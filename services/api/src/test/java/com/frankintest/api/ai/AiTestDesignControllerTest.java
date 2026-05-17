package com.frankintest.api.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.frankintest.api.TestJwtHelper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AiTestDesignControllerTest extends com.frankintest.api.BaseIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @Test
    void estimate_validRequest_returns200WithCreditsAndExpiry() throws Exception {
        Map<String, Object> body = Map.of(
            "projectId", "proj_test",
            "generationType", "scenarios_from_business_rule",
            "sourceArtifactId", "rule_001"
        );

        mockMvc.perform(post("/api/ai/test-design/estimate")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", TestJwtHelper.DEMO_ORG_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.estimatedCredits").isNumber())
            .andExpect(jsonPath("$.pricingNote").isString())
            .andExpect(jsonPath("$.expiresAt").isString());
    }

    @Test
    void estimate_noToken_returns401() throws Exception {
        Map<String, Object> body = Map.of(
            "projectId", "proj_test",
            "generationType", "scenarios_from_business_rule",
            "sourceArtifactId", "rule_001"
        );

        mockMvc.perform(post("/api/ai/test-design/estimate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error").value("UNAUTHORIZED"));
    }

    @Test
    void estimate_wrongOrg_returns403() throws Exception {
        Map<String, Object> body = Map.of(
            "projectId", "proj_test",
            "generationType", "scenarios_from_business_rule",
            "sourceArtifactId", "rule_001"
        );

        mockMvc.perform(post("/api/ai/test-design/estimate")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", TestJwtHelper.OTHER_ORG_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isForbidden());
    }

    @Test
    void estimate_missingProjectId_returns400() throws Exception {
        Map<String, Object> body = Map.of(
            "generationType", "scenarios_from_business_rule",
            "sourceArtifactId", "rule_001"
        );

        mockMvc.perform(post("/api/ai/test-design/estimate")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", TestJwtHelper.DEMO_ORG_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("INVALID_INPUT"));
    }

    @Test
    void estimate_unsupportedGenerationType_returns400BeforeOrchestration() throws Exception {
        Map<String, Object> body = Map.of(
            "projectId", "proj_test",
            "generationType", "generic_prompt",
            "sourceArtifactId", "rule_001"
        );

        mockMvc.perform(post("/api/ai/test-design/estimate")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", TestJwtHelper.DEMO_ORG_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("INVALID_INPUT"));
    }

    @Test
    void estimate_malformedJson_returns400() throws Exception {
        mockMvc.perform(post("/api/ai/test-design/estimate")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", TestJwtHelper.DEMO_ORG_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"projectId\":\"proj_test\""))
            .andExpect(status().isBadRequest());
    }

    @Test
    void generateScenarios_validRequest_returns201WithDraftArtifacts() throws Exception {
        Map<String, Object> body = Map.of(
            "projectId", "proj_ctrl_test",
            "businessRuleId", "rule_ctrl_001",
            "confirmedEstimatedCredits", 30
        );

        mockMvc.perform(post("/api/ai/test-design/scenarios")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", TestJwtHelper.DEMO_ORG_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.aiRunId").isString())
            .andExpect(jsonPath("$.status").value("completed"))
            .andExpect(jsonPath("$.outputArtifactType").value("test_scenario"))
            .andExpect(jsonPath("$.artifacts").isArray())
            .andExpect(jsonPath("$.artifacts", hasSize(greaterThan(0))))
            .andExpect(jsonPath("$.artifacts[0].status").value("draft"))
            .andExpect(jsonPath("$.artifacts[0].aiAssisted").value(true));
    }

    @Test
    void generateScenarios_missingProjectId_returns400() throws Exception {
        Map<String, Object> body = Map.of(
            "businessRuleId", "rule_001",
            "confirmedEstimatedCredits", 30
        );

        mockMvc.perform(post("/api/ai/test-design/scenarios")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", TestJwtHelper.DEMO_ORG_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void generateScenarios_missingBusinessRuleId_returns400() throws Exception {
        Map<String, Object> body = Map.of(
            "projectId", "proj_test",
            "confirmedEstimatedCredits", 30
        );

        mockMvc.perform(post("/api/ai/test-design/scenarios")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", TestJwtHelper.DEMO_ORG_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void generateScenarios_zeroCredits_returns400() throws Exception {
        Map<String, Object> body = Map.of(
            "projectId", "proj_test",
            "businessRuleId", "rule_001",
            "confirmedEstimatedCredits", 0
        );

        mockMvc.perform(post("/api/ai/test-design/scenarios")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", TestJwtHelper.DEMO_ORG_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void generateScenarios_malformedJson_returns400() throws Exception {
        mockMvc.perform(post("/api/ai/test-design/scenarios")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", TestJwtHelper.DEMO_ORG_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"projectId\":\"proj_test\""))
            .andExpect(status().isBadRequest());
    }

    @Test
    void generateTestCases_validRequest_returns201WithDraftArtifacts() throws Exception {
        Map<String, Object> body = Map.of(
            "projectId", "proj_tc_test",
            "scenarioId", "scenario_tc_001",
            "confirmedEstimatedCredits", 40
        );

        mockMvc.perform(post("/api/ai/test-design/test-cases")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", TestJwtHelper.DEMO_ORG_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.aiRunId").isString())
            .andExpect(jsonPath("$.status").value("completed"))
            .andExpect(jsonPath("$.outputArtifactType").value("test_case"))
            .andExpect(jsonPath("$.artifacts").isArray())
            .andExpect(jsonPath("$.artifacts[0].status").value("draft"))
            .andExpect(jsonPath("$.artifacts[0].aiAssisted").value(true));
    }

    @Test
    void generateTestCases_missingScenarioId_returns400() throws Exception {
        Map<String, Object> body = Map.of(
            "projectId", "proj_test",
            "confirmedEstimatedCredits", 40
        );

        mockMvc.perform(post("/api/ai/test-design/test-cases")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", TestJwtHelper.DEMO_ORG_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void generateTestCases_zeroCredits_returns400() throws Exception {
        Map<String, Object> body = Map.of(
            "projectId", "proj_test",
            "scenarioId", "scenario_001",
            "confirmedEstimatedCredits", 0
        );

        mockMvc.perform(post("/api/ai/test-design/test-cases")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", TestJwtHelper.DEMO_ORG_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("INVALID_INPUT"));
    }
}
