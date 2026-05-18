package com.frankintest.api.checkup;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.frankintest.api.ai.provider.AiProviderPort;
import com.frankintest.api.ai.provider.AiProviderSelector;
import com.frankintest.api.airuns.AiRunModels;
import com.frankintest.api.airuns.AiRunRepository;
import com.frankintest.api.audit.AuditService;
import com.frankintest.api.credits.CreditModels;
import com.frankintest.api.credits.CreditService;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class CheckupService {

    private final CheckupCreditEstimator creditEstimator;
    private final CheckupPromptBuilder promptBuilder;
    private final CheckupReportParser reportParser;
    private final CheckupOutputValidator outputValidator;
    private final CheckupRepository checkupRepository;
    private final AiRunRepository aiRunRepository;
    private final CreditService creditService;
    private final AuditService auditService;
    private final AiProviderSelector aiProviderSelector;
    private final ObjectMapper objectMapper;

    public CheckupService(
        CheckupCreditEstimator creditEstimator,
        CheckupPromptBuilder promptBuilder,
        CheckupReportParser reportParser,
        CheckupOutputValidator outputValidator,
        CheckupRepository checkupRepository,
        AiRunRepository aiRunRepository,
        CreditService creditService,
        AuditService auditService,
        AiProviderSelector aiProviderSelector,
        ObjectMapper objectMapper
    ) {
        this.creditEstimator = creditEstimator;
        this.promptBuilder = promptBuilder;
        this.reportParser = reportParser;
        this.outputValidator = outputValidator;
        this.checkupRepository = checkupRepository;
        this.aiRunRepository = aiRunRepository;
        this.creditService = creditService;
        this.auditService = auditService;
        this.aiProviderSelector = aiProviderSelector;
        this.objectMapper = objectMapper;
    }

    public CheckupModels.CheckupEstimateResponse estimate(CheckupModels.CheckupRequest request) {
        creditEstimator.validateRequest(request);
        long base = baseCredits(request.depth());
        double multiplier = outputMultiplier(request.outputMode());
        long total = (long) Math.ceil(base * multiplier);
        return new CheckupModels.CheckupEstimateResponse(
            total,
            new CheckupModels.CheckupEstimateResponse.CreditBreakdown(base, multiplier, total),
            "credits"
        );
    }

    public CheckupModels.CheckupRunResponse run(
        CheckupModels.CheckupRequest request,
        String organizationId,
        String userId
    ) {
        creditEstimator.validateRequest(request);

        long estimatedCredits = creditEstimator.estimate(request.depth(), request.outputMode());

        if (!creditService.hasEnoughCredits(organizationId, estimatedCredits)) {
            CreditModels.CreditBalance balance = creditService.getBalance(organizationId);
            throw new InsufficientCheckupCreditsException(estimatedCredits, balance.availableCredits());
        }

        String aiRunId = UUID.randomUUID().toString();
        String reportId = UUID.randomUUID().toString();
        Instant now = Instant.now();

        AiRunModels.AiRun run = new AiRunModels.AiRun(
            aiRunId, organizationId, "checkup", userId,
            AiRunModels.AiRunFeature.checkup,
            null, null,
            request.targetType().name() + ":" + truncate(request.targetValue(), 100),
            estimatedCredits, 0L, 0L,
            AiRunModels.AiRunStatus.reserved,
            AiRunModels.AiRunFailureCategory.none,
            AiRunModels.OutputArtifactType.checkup_report,
            List.of(reportId),
            null,
            now, null, null
        );
        aiRunRepository.insert(run);

        audit(organizationId, userId, "CHECK_UP_REQUESTED", "ai_run", aiRunId);

        creditService.reserve(organizationId, userId, aiRunId, estimatedCredits, "Check-up " + request.depth());
        aiRunRepository.updateReservedCredits(aiRunId, estimatedCredits);
        audit(organizationId, userId, "CHECK_UP_CREDITS_RESERVED", "ai_run", aiRunId);

        aiRunRepository.updateToRunning(aiRunId, Instant.now());
        audit(organizationId, userId, "CHECK_UP_RUNNING", "ai_run", aiRunId);

        audit(organizationId, userId, "CHECK_UP_PROVIDER_CALL_STARTED", "ai_run", aiRunId);
        AiProviderPort.AiProviderResponse response = aiProviderSelector.getProvider().generate(promptBuilder.build(request));

        if (!response.success()) {
            creditService.release(organizationId, userId, aiRunId, estimatedCredits,
                "Falha no provider");
            aiRunRepository.updateStatus(aiRunId,
                AiRunModels.AiRunStatus.failed,
                AiRunModels.AiRunFailureCategory.provider,
                0L, List.of(reportId), Instant.now());
            audit(organizationId, userId, "CHECK_UP_PROVIDER_CALL_FAILED", "ai_run", aiRunId);
            audit(organizationId, userId, "CHECK_UP_FAILED", "ai_run", aiRunId);
            audit(organizationId, userId, "CHECK_UP_CREDITS_RELEASED", "ai_run", aiRunId);
            throw new CheckupExecutionException("Não foi possível concluir a análise. Seus créditos foram preservados.", aiRunId);
        }

        audit(organizationId, userId, "CHECK_UP_PROVIDER_CALL_COMPLETED", "ai_run", aiRunId);

        JsonNode parsedRoot;
        try {
            parsedRoot = objectMapper.readTree(response.content());
        } catch (Exception e) {
            creditService.release(organizationId, userId, aiRunId, estimatedCredits,
                "Saída do provedor não é JSON válido");
            aiRunRepository.updateStatus(aiRunId,
                AiRunModels.AiRunStatus.failed,
                AiRunModels.AiRunFailureCategory.output_validation,
                0L, List.of(reportId), Instant.now());
            audit(organizationId, userId, "CHECK_UP_OUTPUT_VALIDATION_FAILED", "ai_run", aiRunId);
            audit(organizationId, userId, "CHECK_UP_FAILED", "ai_run", aiRunId);
            throw new CheckupExecutionException("A saída do provedor de IA está em formato inválido. Seus créditos foram preservados.", aiRunId);
        }

        CheckupOutputValidator.ValidationResult validation = outputValidator.validate(parsedRoot);
        if (!validation.valid()) {
            creditService.release(organizationId, userId, aiRunId, estimatedCredits,
                "Falha na validação da saída do provedor");
            aiRunRepository.updateStatus(aiRunId,
                AiRunModels.AiRunStatus.failed,
                AiRunModels.AiRunFailureCategory.output_validation,
                0L, List.of(reportId), Instant.now());
            audit(organizationId, userId, "CHECK_UP_OUTPUT_VALIDATION_FAILED", "ai_run", aiRunId);
            audit(organizationId, userId, "CHECK_UP_FAILED", "ai_run", aiRunId);
            throw new CheckupExecutionException("A saída do provedor de IA não passou na validação de estrutura. Seus créditos foram preservados.", aiRunId);
        }

        CheckupModels.CheckupReport report = reportParser.parse(
            reportId, aiRunId, organizationId, userId, request, response.content());
        checkupRepository.save(report);

        creditService.capture(organizationId, userId, aiRunId, estimatedCredits, estimatedCredits, "Check-up concluído");
        aiRunRepository.updateStatus(aiRunId,
            AiRunModels.AiRunStatus.completed,
            AiRunModels.AiRunFailureCategory.none,
            estimatedCredits, List.of(reportId), Instant.now());
        audit(organizationId, userId, "CHECK_UP_COMPLETED", "ai_run", aiRunId);

        return new CheckupModels.CheckupRunResponse(aiRunId, reportId, "running", estimatedCredits);
    }

    public CheckupModels.CheckupRunStatusResponse getRunStatus(String aiRunId, String organizationId) {
        Optional<AiRunModels.AiRun> runOpt = aiRunRepository.findById(aiRunId);
        if (runOpt.isEmpty()) throw new CheckupNotFoundException("AI run não encontrado.");
        AiRunModels.AiRun run = runOpt.get();

        return switch (run.status()) {
            case completed -> {
                Optional<CheckupModels.CheckupReport> reportOpt = checkupRepository.findByAiRunId(aiRunId);
                yield new CheckupModels.CheckupRunStatusResponse(
                    aiRunId, "completed", run.consumedCredits(),
                    reportOpt.map(this::toView).orElse(null), null);
            }
            case failed -> new CheckupModels.CheckupRunStatusResponse(
                aiRunId, "failed", 0L, null,
                "Não foi possível concluir a análise. Seus créditos foram preservados.");
            default -> new CheckupModels.CheckupRunStatusResponse(aiRunId, "running", 0L, null, null);
        };
    }

    private void audit(String orgId, String userId, String eventType, String entityType, String entityId) {
        auditService.record(AuditService.AuditEvent.of(orgId, userId, eventType, entityType, entityId, null));
    }

    private CheckupModels.CheckupReportView toView(CheckupModels.CheckupReport r) {
        return new CheckupModels.CheckupReportView(
            r.id(), r.status().name(), r.targetType().name(), r.targetValue(), r.depth().name(),
            r.qualityRisks(), r.missingOrUnclearRequirements(),
            r.suggestedTestScenarios(), r.suggestedTestCases(),
            r.uxProductRisks(), r.releaseReadinessNotes(), r.recommendedNextActions(),
            r.createdAt(), r.updatedAt(),
            true);
    }

    private long baseCredits(CheckupModels.CheckupDepth depth) {
        return switch (depth) {
            case QUICK -> 10L;
            case STANDARD -> 20L;
            case DEEP -> 35L;
        };
    }

    private double outputMultiplier(CheckupModels.OutputMode mode) {
        return switch (mode) {
            case REPORT_ONLY -> 1.0;
            case REPORT_WITH_SCENARIOS -> 1.5;
        };
    }

    private String truncate(String s, int max) {
        if (s == null) return "";
        return s.length() <= max ? s : s.substring(0, max);
    }

    public static class InsufficientCheckupCreditsException extends RuntimeException {
        public final long required;
        public final long available;
        public InsufficientCheckupCreditsException(long required, long available) {
            super("Saldo de créditos insuficiente.");
            this.required = required;
            this.available = available;
        }
    }

    public static class CheckupExecutionException extends RuntimeException {
        public final String aiRunId;
        public CheckupExecutionException(String message, String aiRunId) {
            super(message);
            this.aiRunId = aiRunId;
        }
    }

    public static class CheckupNotFoundException extends RuntimeException {
        public CheckupNotFoundException(String message) { super(message); }
    }
}
