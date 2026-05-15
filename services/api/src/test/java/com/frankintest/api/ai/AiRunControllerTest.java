package com.frankintest.api.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AiRunControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void estimate_validRequest_returns200WithCredits() throws Exception {
        AiEstimateRequest request = new AiEstimateRequest("generate_scenarios", "validação de login com credenciais válidas");

        mockMvc.perform(post("/api/ai/estimate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estimatedCredits").isNumber())
                .andExpect(jsonPath("$.pricingNote").isString());
    }

    @Test
    void estimate_missingFeature_returns400() throws Exception {
        mockMvc.perform(post("/api/ai/estimate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"feature\":\"\",\"context\":\"algum contexto\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void estimate_missingContext_returns400() throws Exception {
        mockMvc.perform(post("/api/ai/estimate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"feature\":\"generate_scenarios\",\"context\":\"\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void generateScenarios_validRequest_returns200WithOutput() throws Exception {
        AiGenerateScenariosRequest request = new AiGenerateScenariosRequest(
                "org_test", "project_test", "user_test",
                "rule_001", "Validação de email obrigatório",
                "Email deve ter formato válido"
        );

        mockMvc.perform(post("/api/ai/scenarios/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.aiRunId").isString())
                .andExpect(jsonPath("$.status").value("completed"))
                .andExpect(jsonPath("$.output").isString())
                .andExpect(jsonPath("$.outputArtifactType").value("test_scenario"));
    }

    @Test
    void generateScenarios_missingProjectId_returns400() throws Exception {
        mockMvc.perform(post("/api/ai/scenarios/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"projectId\":\"\",\"businessRuleId\":\"rule_001\",\"businessRuleTitle\":\"Regra\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void generateTestCases_validRequest_returns200WithOutput() throws Exception {
        AiGenerateTestCasesRequest request = new AiGenerateTestCasesRequest(
                "org_test", "project_test", "user_test",
                "scenario_001", "Email inválido deve ser rejeitado",
                "Sistema valida formato de email"
        );

        mockMvc.perform(post("/api/ai/test-cases/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.aiRunId").isString())
                .andExpect(jsonPath("$.status").value("completed"))
                .andExpect(jsonPath("$.output").isString())
                .andExpect(jsonPath("$.outputArtifactType").value("test_case"));
    }

    @Test
    void generateTestCases_missingScenarioTitle_returns400() throws Exception {
        mockMvc.perform(post("/api/ai/test-cases/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"projectId\":\"p1\",\"scenarioId\":\"s1\",\"scenarioTitle\":\"\"}"))
                .andExpect(status().isBadRequest());
    }
}
