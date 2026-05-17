package com.frankintest.api.checkup;

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

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CheckupLgpdEnforcementTest extends com.frankintest.api.BaseIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private JdbcTemplate jdbc;

    private Map<String, Object> baseBody(boolean authorized) {
        return new java.util.HashMap<>(Map.of(
            "targetType", "FEATURE_DESCRIPTION",
            "targetValue", "Sistema de LGPD",
            "userAuthorizationConfirmed", authorized,
            "context", "Teste de conformidade com LGPD para módulo de consentimento",
            "goal", "Validar fluxo de consentimento",
            "depth", "QUICK",
            "outputMode", "REPORT_ONLY"
        ));
    }

    @Test
    void estimate_userAuthorizationFalse_returns422() throws Exception {
        mockMvc.perform(post("/api/checkup/estimate")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", TestJwtHelper.DEMO_ORG_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(baseBody(false))))
            .andExpect(status().isUnprocessableEntity())
            .andExpect(jsonPath("$.error").value("AUTHORIZATION_REQUIRED"));
    }

    @Test
    void estimate_userAuthorizationTrue_proceeds() throws Exception {
        mockMvc.perform(post("/api/checkup/estimate")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", TestJwtHelper.DEMO_ORG_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(baseBody(true))))
            .andExpect(status().isOk());
    }

    @Test
    void run_userAuthorizationTrue_auditEventCarriesRealUserId() throws Exception {
        mockMvc.perform(post("/api/checkup/run")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", TestJwtHelper.DEMO_ORG_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(baseBody(true))))
            .andExpect(status().isAccepted());

        int count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM audit_log WHERE user_id = ? AND organization_id = ? AND event_type = 'CHECK_UP_REQUESTED'",
            Integer.class,
            TestJwtHelper.DEMO_USER_ID, TestJwtHelper.DEMO_ORG_ID
        );
        assertThat(count).as("CHECK_UP_REQUESTED must carry real userId, not user_mock").isGreaterThan(0);

        // Verify no org_mock or user_mock leaks
        int mockLeaks = jdbc.queryForObject(
            "SELECT COUNT(*) FROM audit_log WHERE user_id = 'user_mock' OR organization_id = 'org_mock'",
            Integer.class
        );
        assertThat(mockLeaks).as("No audit events should have mock identity values").isEqualTo(0);
    }
}
