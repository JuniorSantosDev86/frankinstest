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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CheckupAuditWithIdentityTest extends com.frankintest.api.BaseIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private JdbcTemplate jdbc;

    @Test
    void run_withValidAuth_auditEventHasRealIdentity() throws Exception {
        Map<String, Object> body = Map.of(
            "targetType", "FEATURE_DESCRIPTION",
            "targetValue", "Módulo de pagamento",
            "userAuthorizationConfirmed", true,
            "context", "Contexto de auditoria",
            "goal", "Validar auditoria",
            "depth", "QUICK",
            "outputMode", "REPORT_ONLY"
        );

        mockMvc.perform(post("/api/checkup/run")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", TestJwtHelper.DEMO_ORG_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isAccepted());

        // Verify audit event carries real identity (not org_mock / user_mock)
        int count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM audit_log WHERE user_id = ? AND organization_id = ? AND event_type = 'CHECK_UP_REQUESTED'",
            Integer.class,
            TestJwtHelper.DEMO_USER_ID, TestJwtHelper.DEMO_ORG_ID
        );
        assertThat(count).as("Expected CHECK_UP_REQUESTED audit event with real identity").isGreaterThan(0);
    }
}
