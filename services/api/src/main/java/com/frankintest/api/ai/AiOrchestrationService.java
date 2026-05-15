package com.frankintest.api.ai;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
public class AiOrchestrationService {

    private static final String PRICING_NOTE = "Estimativa baseada em tamanho do contexto. 1 crédito = 1.000 tokens aproximados.";
    private static final long MIN_CREDITS = 1L;
    private static final long CREDIT_PER_100_CHARS = 1L;

    private final AiProviderFactory providerFactory;
    private final JdbcTemplate jdbc;

    public AiOrchestrationService(AiProviderFactory providerFactory, JdbcTemplate jdbc) {
        this.providerFactory = providerFactory;
        this.jdbc = jdbc;
    }

    public long estimateCredits(String feature, String context) {
        long base = switch (feature) {
            case "generate_scenarios" -> 30L;
            case "generate_test_cases" -> 40L;
            default -> 20L;
        };
        long contextCredits = (context == null || context.isBlank())
                ? 0
                : (context.length() / 100) * CREDIT_PER_100_CHARS;
        return Math.max(MIN_CREDITS, base + contextCredits);
    }

    public AiRunResponse generateScenarios(AiGenerateScenariosRequest request) {
        String aiRunId = UUID.randomUUID().toString();
        long estimatedCredits = estimateCredits("generate_scenarios", request.context());

        insertAiRun(aiRunId, request.organizationId(), request.projectId(), request.userId(),
                "generate_scenarios", buildScenariosContext(request), estimatedCredits, "processing");

        insertCreditTransaction(UUID.randomUUID().toString(), request.organizationId(),
                "reserve", estimatedCredits, "Reserva para geração de cenários", aiRunId);

        String prompt = buildScenariosPrompt(request);
        AiProvider provider = providerFactory.getProvider();
        AiResponse aiResponse = provider.generateContent(prompt);

        if (!aiResponse.success()) {
            updateAiRun(aiRunId, "failed", null, null, 0L, aiResponse.errorMessage());
            refundCreditTransaction(request.organizationId(), aiRunId, estimatedCredits);
            return new AiRunResponse(aiRunId, "failed", "test_scenario", null, 0L, aiResponse.errorMessage());
        }

        long consumed = calculateConsumedCredits(aiResponse.inputTokens(), aiResponse.outputTokens());
        updateAiRun(aiRunId, "completed", "test_scenario", null, consumed, null);
        chargeCreditTransaction(request.organizationId(), aiRunId, consumed, estimatedCredits);

        return new AiRunResponse(aiRunId, "completed", "test_scenario", aiResponse.content(), consumed, null);
    }

    public AiRunResponse generateTestCases(AiGenerateTestCasesRequest request) {
        String aiRunId = UUID.randomUUID().toString();
        long estimatedCredits = estimateCredits("generate_test_cases", request.context());

        insertAiRun(aiRunId, request.organizationId(), request.projectId(), request.userId(),
                "generate_test_cases", buildTestCasesContext(request), estimatedCredits, "processing");

        insertCreditTransaction(UUID.randomUUID().toString(), request.organizationId(),
                "reserve", estimatedCredits, "Reserva para geração de casos de teste", aiRunId);

        String prompt = buildTestCasesPrompt(request);
        AiProvider provider = providerFactory.getProvider();
        AiResponse aiResponse = provider.generateContent(prompt);

        if (!aiResponse.success()) {
            updateAiRun(aiRunId, "failed", null, null, 0L, aiResponse.errorMessage());
            refundCreditTransaction(request.organizationId(), aiRunId, estimatedCredits);
            return new AiRunResponse(aiRunId, "failed", "test_case", null, 0L, aiResponse.errorMessage());
        }

        long consumed = calculateConsumedCredits(aiResponse.inputTokens(), aiResponse.outputTokens());
        updateAiRun(aiRunId, "completed", "test_case", null, consumed, null);
        chargeCreditTransaction(request.organizationId(), aiRunId, consumed, estimatedCredits);

        return new AiRunResponse(aiRunId, "completed", "test_case", aiResponse.content(), consumed, null);
    }

    private String buildScenariosPrompt(AiGenerateScenariosRequest request) {
        return """
                Você é um especialista em QA assistindo um profissional de qualidade.

                Gere cenários de teste para a seguinte regra de negócio:

                Regra de negócio: %s
                Contexto adicional: %s

                Requisitos:
                - Gere entre 3 e 5 cenários de teste
                - Inclua cenários positivos, negativos e de borda
                - Use linguagem BDD (Dado/Quando/Então) em português brasileiro
                - Indique claramente que são sugestões que requerem validação humana
                - Não afirme cobertura total ou ausência de bugs
                """.formatted(
                request.businessRuleTitle(),
                request.context() != null ? request.context() : "Nenhum contexto adicional"
        );
    }

    private String buildTestCasesPrompt(AiGenerateTestCasesRequest request) {
        return """
                Você é um especialista em QA assistindo um profissional de qualidade.

                Gere casos de teste para o seguinte cenário:

                Cenário: %s
                Contexto adicional: %s

                Requisitos:
                - Gere entre 2 e 4 casos de teste detalhados
                - Inclua pré-condições, passos e resultado esperado
                - Use linguagem clara em português brasileiro
                - Indique claramente que são sugestões que requerem validação humana
                - Não afirme cobertura total ou ausência de bugs
                """.formatted(
                request.scenarioTitle(),
                request.context() != null ? request.context() : "Nenhum contexto adicional"
        );
    }

    private String buildScenariosContext(AiGenerateScenariosRequest request) {
        return "businessRuleId=" + request.businessRuleId() + "; context=" + request.context();
    }

    private String buildTestCasesContext(AiGenerateTestCasesRequest request) {
        return "scenarioId=" + request.scenarioId() + "; context=" + request.context();
    }

    private long calculateConsumedCredits(int inputTokens, int outputTokens) {
        long totalTokens = inputTokens + outputTokens;
        return Math.max(MIN_CREDITS, (long) Math.ceil(totalTokens / 1000.0));
    }

    private void insertAiRun(String id, String orgId, String projectId, String userId,
                             String feature, String inputContext, long estimatedCredits, String status) {
        jdbc.update("""
                INSERT INTO ai_runs (id, organization_id, project_id, user_id, feature, input_context,
                    estimated_credits, consumed_credits, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
                """,
                id, orgId, projectId, userId, feature, inputContext, estimatedCredits, status,
                Instant.now().toString());
    }

    private void updateAiRun(String id, String status, String artifactType, String artifactId,
                             long consumed, String errorMessage) {
        jdbc.update("""
                UPDATE ai_runs SET status = ?, output_artifact_type = ?, output_artifact_id = ?,
                    consumed_credits = ?, error_message = ?
                WHERE id = ?
                """,
                status, artifactType, artifactId, consumed, errorMessage, id);
    }

    private void insertCreditTransaction(String id, String orgId, String type, long amount,
                                         String reason, String aiRunId) {
        jdbc.update("""
                INSERT INTO credit_transactions (id, organization_id, type, amount, reason, ai_run_id, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                id, orgId, type, amount, reason, aiRunId, Instant.now().toString());
    }

    private void chargeCreditTransaction(String orgId, String aiRunId, long consumed, long reserved) {
        insertCreditTransaction(UUID.randomUUID().toString(), orgId, "charge", consumed,
                "Cobrança por AI run concluído", aiRunId);
        if (reserved > consumed) {
            insertCreditTransaction(UUID.randomUUID().toString(), orgId, "refund", reserved - consumed,
                    "Estorno de créditos não utilizados", aiRunId);
        }
    }

    private void refundCreditTransaction(String orgId, String aiRunId, long amount) {
        insertCreditTransaction(UUID.randomUUID().toString(), orgId, "refund", amount,
                "Estorno por falha no AI run", aiRunId);
    }

    public String getPricingNote() {
        return PRICING_NOTE;
    }
}
