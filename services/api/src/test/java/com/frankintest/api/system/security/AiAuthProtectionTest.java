package com.frankintest.api.system.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.frankintest.api.TestJwtHelper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AiAuthProtectionTest extends com.frankintest.api.BaseIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private JdbcTemplate jdbc;

    @Test
    void estimateTestDesign_noToken_returns401() throws Exception {
        mockMvc.perform(post("/api/ai/test-design/estimate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "projectId", "p1",
                    "generationType", "scenarios_from_business_rule",
                    "sourceArtifactId", "a1"
                ))))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error").value("UNAUTHORIZED"));
    }

    @Test
    void estimateTestDesign_validTokenCorrectOrg_proceeds() throws Exception {
        mockMvc.perform(post("/api/ai/test-design/estimate")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", TestJwtHelper.DEMO_ORG_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "projectId", "p1",
                    "generationType", "scenarios_from_business_rule",
                    "sourceArtifactId", "a1"
                ))))
            .andExpect(status().isOk());
    }

    @Test
    void estimateTestDesign_validTokenWrongOrg_returns403() throws Exception {
        mockMvc.perform(post("/api/ai/test-design/estimate")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", TestJwtHelper.OTHER_ORG_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "projectId", "p1",
                    "generationType", "scenarios_from_business_rule",
                    "sourceArtifactId", "a1"
                ))))
            .andExpect(status().isForbidden());
    }

    @Test
    void getAiRunStatus_noToken_returns401() throws Exception {
        mockMvc.perform(get("/api/ai/runs/any-run-id"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error").value("UNAUTHORIZED"));
    }

    @Test
    void getAiRunStatus_validTokenWrongOrg_returns403() throws Exception {
        // First create a run under DEMO_ORG_ID
        String response = mockMvc.perform(post("/api/ai/test-design/scenarios")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", TestJwtHelper.DEMO_ORG_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "projectId", "proj_cross_org",
                    "businessRuleId", "rule_cross_001",
                    "confirmedEstimatedCredits", 30
                ))))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();

        String aiRunId = objectMapper.readTree(response).path("aiRunId").asText();

        // Try to access with a different org token
        String otherToken = TestJwtHelper.validToken("other_user", List.of(TestJwtHelper.OTHER_ORG_ID));
        mockMvc.perform(get("/api/ai/runs/" + aiRunId)
                .header("Authorization", TestJwtHelper.bearer(otherToken))
                .header("X-Organization-Id", TestJwtHelper.OTHER_ORG_ID))
            .andExpect(status().isForbidden());
    }

    @Test
    void generateScenarios_withValidAuth_auditEventCarriesRealUserId() throws Exception {
        mockMvc.perform(post("/api/ai/test-design/scenarios")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", TestJwtHelper.DEMO_ORG_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "projectId", "proj_audit_ai",
                    "businessRuleId", "rule_audit_001",
                    "confirmedEstimatedCredits", 30
                ))))
            .andExpect(status().isCreated());

        int count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM audit_log WHERE user_id = ? AND organization_id = ?",
            Integer.class,
            TestJwtHelper.DEMO_USER_ID, TestJwtHelper.DEMO_ORG_ID
        );
        assertThat(count).as("Expected audit events with real identity for AI run").isGreaterThan(0);
    }
}
