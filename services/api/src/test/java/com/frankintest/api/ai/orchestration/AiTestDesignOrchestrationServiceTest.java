package com.frankintest.api.ai.orchestration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class AiTestDesignOrchestrationServiceTest {

    @Autowired
    private AiTestDesignOrchestrationService service;

    // T022 — US1: estimate for scenario generation
    @Test
    void calculateEstimate_scenariosFromBusinessRule_returnsAtLeast30() {
        int estimate = service.calculateEstimate("scenarios_from_business_rule", "contexto curto");
        assertThat(estimate).isGreaterThanOrEqualTo(30);
    }

    // T040 — US2: estimate for test case generation
    @Test
    void calculateEstimate_testCasesFromScenario_returnsAtLeast40() {
        int estimate = service.calculateEstimate("test_cases_from_scenario", "contexto curto");
        assertThat(estimate).isGreaterThanOrEqualTo(40);
    }

    @Test
    void calculateEstimate_longerContext_returnsHigherValue() {
        int short_ = service.calculateEstimate("scenarios_from_business_rule", "curto");
        int long_ = service.calculateEstimate("scenarios_from_business_rule", "a".repeat(500));
        assertThat(long_).isGreaterThan(short_);
    }

    @Test
    void calculateEstimate_emptyContext_returnsMinimum() {
        int estimate = service.calculateEstimate("scenarios_from_business_rule", "");
        assertThat(estimate).isGreaterThanOrEqualTo(1);
    }

    // US1: full scenario generation
    @Test
    void generateScenarios_mockProvider_returnsCompletedWithArtifacts() {
        AiTestDesignDtos.GenerateScenariosRequest req = new AiTestDesignDtos.GenerateScenariosRequest(
            "org_test", "proj_test", "user_test",
            "rule_001", 30, "Email deve ter formato válido"
        );

        AiTestDesignDtos.AiGenerationResult result = service.generateScenarios(req);

        assertThat(result.status()).isEqualTo("completed");
        assertThat(result.aiRunId()).isNotBlank();
        assertThat(result.outputArtifactType()).isEqualTo("test_scenario");
        assertThat(result.artifacts()).isNotEmpty();
        assertThat(result.consumedCredits()).isGreaterThanOrEqualTo(1);
    }

    @Test
    void generateScenarios_allArtifactsAreDraftAndAiAssisted() {
        AiTestDesignDtos.GenerateScenariosRequest req = new AiTestDesignDtos.GenerateScenariosRequest(
            "org_test", "proj_test", "user_test",
            "rule_002", 30, null
        );

        AiTestDesignDtos.AiGenerationResult result = service.generateScenarios(req);

        result.artifacts().forEach(artifact -> {
            assertThat(artifact.status()).isEqualTo("draft");
            assertThat(artifact.aiAssisted()).isTrue();
        });
    }

    // US2: full test case generation
    @Test
    void generateTestCases_mockProvider_returnsCompletedWithArtifacts() {
        AiTestDesignDtos.GenerateTestCasesRequest req = new AiTestDesignDtos.GenerateTestCasesRequest(
            "org_test", "proj_test", "user_test",
            "scenario_001", 40, "Cenário de login inválido"
        );

        AiTestDesignDtos.AiGenerationResult result = service.generateTestCases(req);

        assertThat(result.status()).isEqualTo("completed");
        assertThat(result.aiRunId()).isNotBlank();
        assertThat(result.outputArtifactType()).isEqualTo("test_case");
        assertThat(result.artifacts()).isNotEmpty();
    }

    @Test
    void generateTestCases_allArtifactsAreDraftAndAiAssisted() {
        AiTestDesignDtos.GenerateTestCasesRequest req = new AiTestDesignDtos.GenerateTestCasesRequest(
            "org_test", "proj_test", "user_test",
            "scenario_002", 40, null
        );

        AiTestDesignDtos.AiGenerationResult result = service.generateTestCases(req);

        result.artifacts().forEach(artifact -> {
            assertThat(artifact.status()).isEqualTo("draft");
            assertThat(artifact.aiAssisted()).isTrue();
        });
    }
}
