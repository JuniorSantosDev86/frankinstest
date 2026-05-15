package com.frankintest.api.ai;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class AiOrchestrationServiceTest {

    @Autowired
    private AiOrchestrationService service;

    @Test
    void estimateCredits_generateScenarios_returnsAtLeast30() {
        long credits = service.estimateCredits("generate_scenarios", "contexto de teste");
        assertThat(credits).isGreaterThanOrEqualTo(30L);
    }

    @Test
    void estimateCredits_generateTestCases_returnsAtLeast40() {
        long credits = service.estimateCredits("generate_test_cases", "contexto de teste");
        assertThat(credits).isGreaterThanOrEqualTo(40L);
    }

    @Test
    void estimateCredits_longContext_returnsHigherValue() {
        String shortContext = "curto";
        String longContext = "a".repeat(1000);

        long shortCredits = service.estimateCredits("generate_scenarios", shortContext);
        long longCredits = service.estimateCredits("generate_scenarios", longContext);

        assertThat(longCredits).isGreaterThan(shortCredits);
    }

    @Test
    void estimateCredits_neverBelowMinimum() {
        long credits = service.estimateCredits("generate_scenarios", "");
        assertThat(credits).isGreaterThanOrEqualTo(1L);
    }

    @Test
    void generateScenarios_withMockProvider_returnsCompleted() {
        AiGenerateScenariosRequest request = new AiGenerateScenariosRequest(
                "org_test", "project_test", "user_test",
                "rule_001", "Validação de email obrigatório",
                "O usuário deve informar um email válido no cadastro"
        );

        AiRunResponse response = service.generateScenarios(request);

        assertThat(response.status()).isEqualTo("completed");
        assertThat(response.aiRunId()).isNotBlank();
        assertThat(response.output()).isNotBlank();
        assertThat(response.consumedCredits()).isGreaterThanOrEqualTo(1L);
        assertThat(response.outputArtifactType()).isEqualTo("test_scenario");
    }

    @Test
    void generateTestCases_withMockProvider_returnsCompleted() {
        AiGenerateTestCasesRequest request = new AiGenerateTestCasesRequest(
                "org_test", "project_test", "user_test",
                "scenario_001", "Cenário: email inválido rejeitado",
                "Sistema deve rejeitar emails sem @ e sem domínio"
        );

        AiRunResponse response = service.generateTestCases(request);

        assertThat(response.status()).isEqualTo("completed");
        assertThat(response.aiRunId()).isNotBlank();
        assertThat(response.output()).isNotBlank();
        assertThat(response.consumedCredits()).isGreaterThanOrEqualTo(1L);
        assertThat(response.outputArtifactType()).isEqualTo("test_case");
    }

    @Test
    void getPricingNote_isNotBlank() {
        assertThat(service.getPricingNote()).isNotBlank();
    }
}
