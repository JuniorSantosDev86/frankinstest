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
import org.springframework.test.web.servlet.MvcResult;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CheckupProviderFailurePathTest extends com.frankintest.api.BaseIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private JdbcTemplate jdbc;

    @org.junit.jupiter.api.BeforeEach
    void ensureCredits() {
        jdbc.update("""
            MERGE INTO credit_balances (organization_id, available_credits, reserved_credits, updated_at)
            KEY (organization_id)
            VALUES (?, 50000, 0, ?)
            """, TestJwtHelper.DEMO_ORG_ID, Timestamp.from(Instant.now()));
    }

    private Map<String, Object> failureBody() {
        return Map.of(
            "targetType", "FEATURE_DESCRIPTION",
            // force-provider-failure is handled by MockAiProvider
            "targetValue", "force-provider-failure",
            "userAuthorizationConfirmed", true,
            "context", "Teste de falha do provider",
            "goal", "Verificar créditos preservados",
            "depth", "QUICK",
            "outputMode", "REPORT_ONLY"
        );
    }

    @Test
    void providerFailure_creditsReleasedAndAuditEventPresent() throws Exception {
        Long creditsBeforeObj = jdbc.queryForObject(
            "SELECT available_credits FROM credit_balances WHERE organization_id = ?",
            Long.class, TestJwtHelper.DEMO_ORG_ID);
        long creditsBefore = creditsBeforeObj != null ? creditsBeforeObj : 0L;

        MvcResult result = mockMvc.perform(post("/api/checkup/run")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", TestJwtHelper.DEMO_ORG_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(failureBody())))
            .andReturn();

        int httpStatus = result.getResponse().getStatus();
        assertThat(httpStatus)
            .as("Must exercise provider-failure path, not bounce on 402 (credits were seeded)")
            .isNotEqualTo(402);

        // Reserved credits must be released back after failure
        Long creditsAfterObj = jdbc.queryForObject(
            "SELECT available_credits FROM credit_balances WHERE organization_id = ?",
            Long.class, TestJwtHelper.DEMO_ORG_ID);
        long creditsAfter = creditsAfterObj != null ? creditsAfterObj : 0L;
        assertThat(creditsAfter).isEqualTo(creditsBefore);

        // No final consumption must occur
        String aiRunId = objectMapper.readTree(result.getResponse().getContentAsString())
            .path("aiRunId").asText(null);
        assertThat(aiRunId).as("Error response must include aiRunId").isNotBlank();
        Long consumed = jdbc.queryForObject(
            "SELECT consumed_credits FROM ai_runs WHERE id = ?", Long.class, aiRunId);
        assertThat(consumed).isNotNull().isZero();
    }

    @Test
    void providerFailure_auditContainsProviderCallFailedEvent() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/checkup/run")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", TestJwtHelper.DEMO_ORG_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(failureBody())))
            .andReturn();

        assertThat(result.getResponse().getStatus())
            .as("Must exercise provider-failure path, not bounce on 402 (credits were seeded)")
            .isNotEqualTo(402);

        String aiRunId = objectMapper.readTree(result.getResponse().getContentAsString())
            .path("aiRunId").asText(null);
        assertThat(aiRunId).as("Response must include aiRunId").isNotBlank();

        List<String> events = jdbc.queryForList(
            "SELECT event_type FROM audit_log WHERE entity_id = ? ORDER BY created_at",
            String.class, aiRunId);
        assertThat(events).contains("CHECK_UP_PROVIDER_CALL_FAILED");
        assertThat(events).contains("CHECK_UP_FAILED");

        // Verify ai_run failure_category
        String failureCategory = jdbc.queryForObject(
            "SELECT failure_category FROM ai_runs WHERE id = ?", String.class, aiRunId);
        assertThat(failureCategory).isEqualTo("provider");

        // Verify audit rows contain organizationId and userId
        List<Map<String, Object>> auditRows = jdbc.queryForList(
            "SELECT organization_id, user_id FROM audit_log WHERE entity_id = ?", aiRunId);
        assertThat(auditRows).isNotEmpty();
        auditRows.forEach(row -> {
            assertThat(row.get("organization_id")).isEqualTo(TestJwtHelper.DEMO_ORG_ID);
            assertThat(row.get("user_id")).isEqualTo(TestJwtHelper.DEMO_USER_ID);
        });
    }

    @Test
    void providerFailure_responseBodyContainsNoPtBrProviderInternals() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/checkup/run")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", TestJwtHelper.DEMO_ORG_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(failureBody())))
            .andReturn();

        String body = result.getResponse().getContentAsString();
        // Provider internal error message must never leak to the caller
        assertThat(body).doesNotContain("PROVIDER_FAILURE simulated");
        assertThat(body).doesNotContain("Falha simulada do provedor para testes de lifecycle");
        assertThat(body).doesNotContain("sk-ant");
    }
}
