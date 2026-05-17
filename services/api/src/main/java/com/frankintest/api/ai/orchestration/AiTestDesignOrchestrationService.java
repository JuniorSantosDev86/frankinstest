package com.frankintest.api.ai.orchestration;

import com.frankintest.api.ai.provider.AiProviderPort;
import com.frankintest.api.ai.provider.AiProviderSelector;
import com.frankintest.api.airuns.AiRunModels;
import com.frankintest.api.airuns.AiRunRepository;
import com.frankintest.api.audit.AuditService;
import com.frankintest.api.credits.CreditModels;
import com.frankintest.api.credits.CreditRepository;
import com.frankintest.api.system.WorkspaceAccessService;
import com.frankintest.api.testdesign.TestDesignModels;
import com.frankintest.api.testdesign.TestDesignRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
public class AiTestDesignOrchestrationService {

    private static final String PRICING_NOTE =
        "Estimativa baseada no tamanho do contexto. 1 crédito ≈ 1.000 tokens.";
    private static final int ESTIMATE_TTL_MINUTES = 5;

    private final AiProviderSelector providerSelector;
    private final AiGeneratedArtifactParser parser;
    private final AiRunRepository aiRunRepository;
    private final CreditRepository creditRepository;
    private final TestDesignRepository testDesignRepository;
    private final AuditService auditService;
    private final WorkspaceAccessService accessService;

    public AiTestDesignOrchestrationService(
        AiProviderSelector providerSelector,
        AiGeneratedArtifactParser parser,
        AiRunRepository aiRunRepository,
        CreditRepository creditRepository,
        TestDesignRepository testDesignRepository,
        AuditService auditService,
        WorkspaceAccessService accessService
    ) {
        this.providerSelector = providerSelector;
        this.parser = parser;
        this.aiRunRepository = aiRunRepository;
        this.creditRepository = creditRepository;
        this.testDesignRepository = testDesignRepository;
        this.auditService = auditService;
        this.accessService = accessService;
    }

    // ---- Estimate ----

    public AiTestDesignDtos.EstimateResponse estimate(AiTestDesignDtos.EstimateRequest req) {
        accessService.requireProjectAccess(req.organizationId(), req.projectId(), req.userId());

        int credits = calculateEstimate(req.generationType(), req.context());
        String expiresAt = Instant.now()
            .plusSeconds(ESTIMATE_TTL_MINUTES * 60L)
            .atOffset(ZoneOffset.UTC)
            .format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);

        auditService.record(AuditService.AuditEvent.of(
            req.organizationId(), req.userId(),
            "ai_run.estimated", "ai_estimate", req.sourceArtifactId(),
            "generationType=" + req.generationType() + ";estimatedCredits=" + credits
        ));

        return new AiTestDesignDtos.EstimateResponse(credits, PRICING_NOTE, expiresAt);
    }

    public int calculateEstimate(String generationType, String context) {
        int base = switch (generationType) {
            case "scenarios_from_business_rule" -> 30;
            case "test_cases_from_scenario" -> 40;
            default -> 20;
        };
        int contextExtra = (context == null || context.isBlank()) ? 0 : context.length() / 100;
        return Math.max(1, base + contextExtra);
    }

    // ---- Scenario generation (US1) ----

    public AiTestDesignDtos.AiGenerationResult generateScenarios(AiTestDesignDtos.GenerateScenariosRequest req) {
        accessService.requireProjectAccess(req.organizationId(), req.projectId(), req.userId());

        String aiRunId = UUID.randomUUID().toString();
        String inputSummary = "businessRuleId=" + req.businessRuleId();

        AiRunModels.AiRun run = new AiRunModels.AiRun(
            aiRunId, req.organizationId(), req.projectId(), req.userId(),
            AiRunModels.AiRunFeature.test_scenario_generation,
            AiRunModels.SourceArtifactType.business_rule, req.businessRuleId(),
            inputSummary, req.confirmedEstimatedCredits(), 0L, 0L,
            AiRunModels.AiRunStatus.estimated, AiRunModels.AiRunFailureCategory.none,
            null, List.of(), null, Instant.now(), null, null
        );
        aiRunRepository.insert(run);

        try {
            creditRepository.reserve(req.organizationId(), req.userId(), aiRunId,
                req.confirmedEstimatedCredits(), "Reserva para geração de cenários de teste");
            aiRunRepository.updateReservedCredits(aiRunId, req.confirmedEstimatedCredits());

            auditService.record(AuditService.AuditEvent.of(
                req.organizationId(), req.userId(), "credits.reserved", "ai_run", aiRunId,
                "amount=" + req.confirmedEstimatedCredits()));

        } catch (CreditModels.InsufficientCreditsException e) {
            failRun(aiRunId, AiRunModels.AiRunFailureCategory.insufficient_credits);
            auditService.record(AuditService.AuditEvent.of(
                req.organizationId(), req.userId(), "ai_run.failed", "ai_run", aiRunId,
                "failureCategory=insufficient_credits"));
            throw e;
        }

        aiRunRepository.updateToRunning(aiRunId, Instant.now());
        auditService.record(AuditService.AuditEvent.of(
            req.organizationId(), req.userId(), "ai_run.started", "ai_run", aiRunId, null));

        String prompt = buildScenariosPrompt(req);
        AiProviderPort provider = providerSelector.getProvider();
        AiProviderPort.AiProviderResponse providerResponse = provider.generate(prompt);

        if (!providerResponse.success()) {
            releaseAndFail(req.organizationId(), req.userId(), aiRunId,
                req.confirmedEstimatedCredits(), AiRunModels.AiRunFailureCategory.provider);
            auditService.record(AuditService.AuditEvent.of(
                req.organizationId(), req.userId(), "ai_run.failed", "ai_run", aiRunId,
                "failureCategory=provider"));
            throw new ProviderFailureException(providerResponse.errorMessage());
        }

        List<AiTestDesignDtos.ParsedScenario> parsed;
        try {
            parsed = parser.parseScenarios(providerResponse.content());
        } catch (AiGeneratedArtifactParser.InvalidAiOutputException e) {
            releaseAndFail(req.organizationId(), req.userId(), aiRunId,
                req.confirmedEstimatedCredits(), AiRunModels.AiRunFailureCategory.output_validation);
            auditService.record(AuditService.AuditEvent.of(
                req.organizationId(), req.userId(), "ai_run.failed", "ai_run", aiRunId,
                "failureCategory=output_validation;error=" + e.getMessage()));
            throw e;
        }

        List<TestDesignModels.GeneratedQaArtifact> artifacts = persistScenarios(
            parsed, req.organizationId(), req.projectId(), req.businessRuleId(), aiRunId);

        long consumed = calculateConsumed(providerResponse.inputTokens(), providerResponse.outputTokens());
        List<String> artifactIds = artifacts.stream().map(TestDesignModels.GeneratedQaArtifact::id).toList();

        aiRunRepository.updateStatus(aiRunId, AiRunModels.AiRunStatus.completed,
            AiRunModels.AiRunFailureCategory.none, consumed, artifactIds, Instant.now());

        creditRepository.capture(req.organizationId(), req.userId(), aiRunId,
            consumed, req.confirmedEstimatedCredits(), "Captura por geração de cenários concluída");

        auditService.record(AuditService.AuditEvent.of(
            req.organizationId(), req.userId(), "credits.captured", "ai_run", aiRunId,
            "consumed=" + consumed + ";reserved=" + req.confirmedEstimatedCredits()));
        auditService.record(AuditService.AuditEvent.of(
            req.organizationId(), req.userId(), "ai_run.completed", "ai_run", aiRunId,
            "artifactCount=" + artifacts.size()));

        return new AiTestDesignDtos.AiGenerationResult(
            aiRunId, "completed", "test_scenario", artifacts, consumed, PRICING_NOTE);
    }

    // ---- Test case generation (US2) ----

    public AiTestDesignDtos.AiGenerationResult generateTestCases(AiTestDesignDtos.GenerateTestCasesRequest req) {
        accessService.requireProjectAccess(req.organizationId(), req.projectId(), req.userId());

        String aiRunId = UUID.randomUUID().toString();
        String inputSummary = "scenarioId=" + req.scenarioId();

        AiRunModels.AiRun run = new AiRunModels.AiRun(
            aiRunId, req.organizationId(), req.projectId(), req.userId(),
            AiRunModels.AiRunFeature.test_case_generation,
            AiRunModels.SourceArtifactType.test_scenario, req.scenarioId(),
            inputSummary, req.confirmedEstimatedCredits(), 0L, 0L,
            AiRunModels.AiRunStatus.estimated, AiRunModels.AiRunFailureCategory.none,
            null, List.of(), null, Instant.now(), null, null
        );
        aiRunRepository.insert(run);

        try {
            creditRepository.reserve(req.organizationId(), req.userId(), aiRunId,
                req.confirmedEstimatedCredits(), "Reserva para geração de casos de teste");
            aiRunRepository.updateReservedCredits(aiRunId, req.confirmedEstimatedCredits());

            auditService.record(AuditService.AuditEvent.of(
                req.organizationId(), req.userId(), "credits.reserved", "ai_run", aiRunId,
                "amount=" + req.confirmedEstimatedCredits()));

        } catch (CreditModels.InsufficientCreditsException e) {
            failRun(aiRunId, AiRunModels.AiRunFailureCategory.insufficient_credits);
            auditService.record(AuditService.AuditEvent.of(
                req.organizationId(), req.userId(), "ai_run.failed", "ai_run", aiRunId,
                "failureCategory=insufficient_credits"));
            throw e;
        }

        aiRunRepository.updateToRunning(aiRunId, Instant.now());
        auditService.record(AuditService.AuditEvent.of(
            req.organizationId(), req.userId(), "ai_run.started", "ai_run", aiRunId, null));

        String prompt = buildTestCasesPrompt(req);
        AiProviderPort provider = providerSelector.getProvider();
        AiProviderPort.AiProviderResponse providerResponse = provider.generate(prompt);

        if (!providerResponse.success()) {
            releaseAndFail(req.organizationId(), req.userId(), aiRunId,
                req.confirmedEstimatedCredits(), AiRunModels.AiRunFailureCategory.provider);
            auditService.record(AuditService.AuditEvent.of(
                req.organizationId(), req.userId(), "ai_run.failed", "ai_run", aiRunId,
                "failureCategory=provider"));
            throw new ProviderFailureException(providerResponse.errorMessage());
        }

        List<AiTestDesignDtos.ParsedTestCase> parsed;
        try {
            parsed = parser.parseTestCases(providerResponse.content());
        } catch (AiGeneratedArtifactParser.InvalidAiOutputException e) {
            releaseAndFail(req.organizationId(), req.userId(), aiRunId,
                req.confirmedEstimatedCredits(), AiRunModels.AiRunFailureCategory.output_validation);
            auditService.record(AuditService.AuditEvent.of(
                req.organizationId(), req.userId(), "ai_run.failed", "ai_run", aiRunId,
                "failureCategory=output_validation;error=" + e.getMessage()));
            throw e;
        }

        List<TestDesignModels.GeneratedQaArtifact> artifacts = persistTestCases(
            parsed, req.organizationId(), req.projectId(), req.scenarioId(), aiRunId);

        long consumed = calculateConsumed(providerResponse.inputTokens(), providerResponse.outputTokens());
        List<String> artifactIds = artifacts.stream().map(TestDesignModels.GeneratedQaArtifact::id).toList();

        aiRunRepository.updateStatus(aiRunId, AiRunModels.AiRunStatus.completed,
            AiRunModels.AiRunFailureCategory.none, consumed, artifactIds, Instant.now());

        creditRepository.capture(req.organizationId(), req.userId(), aiRunId,
            consumed, req.confirmedEstimatedCredits(), "Captura por geração de casos de teste concluída");

        auditService.record(AuditService.AuditEvent.of(
            req.organizationId(), req.userId(), "credits.captured", "ai_run", aiRunId,
            "consumed=" + consumed + ";reserved=" + req.confirmedEstimatedCredits()));
        auditService.record(AuditService.AuditEvent.of(
            req.organizationId(), req.userId(), "ai_run.completed", "ai_run", aiRunId,
            "artifactCount=" + artifacts.size()));

        return new AiTestDesignDtos.AiGenerationResult(
            aiRunId, "completed", "test_case", artifacts, consumed, PRICING_NOTE);
    }

    // ---- Helpers ----

    private List<TestDesignModels.GeneratedQaArtifact> persistScenarios(
        List<AiTestDesignDtos.ParsedScenario> parsed,
        String orgId, String projectId, String businessRuleId, String aiRunId
    ) {
        return parsed.stream().map(p -> {
            String id = UUID.randomUUID().toString();
            Instant now = Instant.now();
            testDesignRepository.insertScenario(new TestDesignModels.TestScenario(
                id, orgId, projectId, null, null, businessRuleId,
                p.title(), p.description(), p.scenarioType(), "medium",
                "draft", true, aiRunId, null, null, now, now
            ));
            auditService.record(AuditService.AuditEvent.of(
                orgId, null, "artifact.ai_draft_created", "test_scenario", id,
                "aiRunId=" + aiRunId));
            return new TestDesignModels.GeneratedQaArtifact(id, p.title(), p.description(), "draft", true);
        }).toList();
    }

    private List<TestDesignModels.GeneratedQaArtifact> persistTestCases(
        List<AiTestDesignDtos.ParsedTestCase> parsed,
        String orgId, String projectId, String scenarioId, String aiRunId
    ) {
        return parsed.stream().map(p -> {
            String id = UUID.randomUUID().toString();
            Instant now = Instant.now();
            testDesignRepository.insertTestCase(new TestDesignModels.TestCase(
                id, orgId, projectId, null, null, null, scenarioId,
                p.title(), p.preconditions(), p.steps(), p.expectedResult(),
                p.testType(), "medium", p.automationCandidate(),
                "draft", true, aiRunId, null, null, now, now
            ));
            auditService.record(AuditService.AuditEvent.of(
                orgId, null, "artifact.ai_draft_created", "test_case", id,
                "aiRunId=" + aiRunId));
            String desc = p.preconditions() != null && !p.preconditions().isBlank()
                ? p.preconditions() : p.expectedResult();
            return new TestDesignModels.GeneratedQaArtifact(id, p.title(), desc, "draft", true);
        }).toList();
    }

    private String buildScenariosPrompt(AiTestDesignDtos.GenerateScenariosRequest req) {
        return """
            Você é um especialista em QA. Gere cenários de teste para a seguinte regra de negócio.
            Retorne SOMENTE JSON válido com o formato: {"scenarios":[{"title":"...","description":"...","scenarioType":"positive|negative|edge"}]}
            Gere entre 3 e 5 cenários. Use linguagem BDD (Dado/Quando/Então) em português brasileiro.
            Não afirme cobertura total ou ausência de bugs.

            businessRuleId: %s
            contexto adicional: %s
            """.formatted(req.businessRuleId(),
                req.context() != null ? req.context() : "nenhum");
    }

    private String buildTestCasesPrompt(AiTestDesignDtos.GenerateTestCasesRequest req) {
        return """
            Você é um especialista em QA. Gere casos de teste para o seguinte cenário.
            Retorne SOMENTE JSON válido com o formato:
            {"testCases":[{"title":"...","preconditions":"...","steps":"...","expectedResult":"...","testType":"manual","automationCandidate":false}]}
            Gere entre 2 e 4 casos. Use linguagem clara em português brasileiro.
            Não afirme cobertura total.

            scenarioId: %s
            contexto adicional: %s
            """.formatted(req.scenarioId(),
                req.context() != null ? req.context() : "nenhum");
    }

    private void failRun(String aiRunId, AiRunModels.AiRunFailureCategory category) {
        aiRunRepository.updateStatus(aiRunId, AiRunModels.AiRunStatus.failed,
            category, 0L, List.of(), Instant.now());
    }

    private void releaseAndFail(String orgId, String userId, String aiRunId,
                                long reservedCredits, AiRunModels.AiRunFailureCategory category) {
        failRun(aiRunId, category);
        creditRepository.release(orgId, userId, aiRunId, reservedCredits,
            "Liberação por falha no AI run: " + category.name());
        auditService.record(AuditService.AuditEvent.of(
            orgId, userId, "credits.released", "ai_run", aiRunId,
            "amount=" + reservedCredits + ";reason=" + category.name()));
    }

    private long calculateConsumed(int inputTokens, int outputTokens) {
        long total = inputTokens + outputTokens;
        return Math.max(1L, (long) Math.ceil(total / 1000.0));
    }

    public static class ProviderFailureException extends RuntimeException {
        public ProviderFailureException(String message) {
            super(message != null ? message : "Falha no provedor de IA");
        }
    }
}
