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

/**
 * Tests the output-validation failure path: provider returns HTTP success but
 * structurally invalid JSON (missing required sections). MockAiProvider triggers
 * this when the prompt contains "force-invalid-output".
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CheckupOutputValidationFailureTest extends com.frankintest.api.BaseIntegrationTest {

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

    private Map<String, Object> invalidOutputBody() {
        // MockAiProvider returns {"content":"sem artefatos estruturados"} for this targetValue
        return Map.of(
            "targetType", "FEATURE_DESCRIPTION",
            "targetValue", "force-invalid-output",
            "userAuthorizationConfirmed", true,
            "context", "Teste de rejeição de saída inválida do provider",
            "goal", "Verificar que saída inválida não persiste e créditos são preservados",
            "depth", "QUICK",
            "outputMode", "REPORT_ONLY"
        );
    }

    @Test
    void invalidProviderOutput_emitsValidationFailedAuditEvent() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/checkup/run")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", TestJwtHelper.DEMO_ORG_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidOutputBody())))
            .andReturn();

        int status = result.getResponse().getStatus();
        assertThat(status)
            .as("Must exercise output-validation-failure path, not bounce on 402 (credits were seeded)")
            .isNotEqualTo(402);

        String aiRunId = objectMapper.readTree(result.getResponse().getContentAsString())
            .path("aiRunId").asText(null);
        assertThat(aiRunId).as("Response must include aiRunId").isNotBlank();

        List<String> events = jdbc.queryForList(
            "SELECT event_type FROM audit_log WHERE entity_id = ? ORDER BY created_at",
            String.class, aiRunId);
        assertThat(events).contains("CHECK_UP_OUTPUT_VALIDATION_FAILED");
        assertThat(events).contains("CHECK_UP_FAILED");

        // Verify ai_run failure_category
        String failureCategory = jdbc.queryForObject(
            "SELECT failure_category FROM ai_runs WHERE id = ?", String.class, aiRunId);
        assertThat(failureCategory).isEqualTo("output_validation");

        // Verify audit rows contain organizationId and userId
        List<Map<String, Object>> auditRows = jdbc.queryForList(
            "SELECT organization_id, user_id FROM audit_log WHERE entity_id = ?", aiRunId);
        assertThat(auditRows).isNotEmpty();
        auditRows.forEach(row -> {
            assertThat(row.get("organization_id")).isEqualTo(TestJwtHelper.DEMO_ORG_ID);
            assertThat(row.get("user_id")).isEqualTo(TestJwtHelper.DEMO_USER_ID);
        });

        // Credits must be released (not consumed) after output-validation failure
        Long available = jdbc.queryForObject(
            "SELECT available_credits FROM credit_balances WHERE organization_id = ?",
            Long.class, TestJwtHelper.DEMO_ORG_ID);
        assertThat(available).isNotNull().isEqualTo(50000L);
        Long consumed = jdbc.queryForObject(
            "SELECT consumed_credits FROM ai_runs WHERE id = ?", Long.class, aiRunId);
        assertThat(consumed).isNotNull().isZero();
    }

    @Test
    void invalidProviderOutput_noReportPersistedInDb() throws Exception {
        Long reportsBeforeObj = jdbc.queryForObject("SELECT COUNT(*) FROM checkup_reports", Long.class);
        long reportsBefore = reportsBeforeObj != null ? reportsBeforeObj : 0L;

        MvcResult result = mockMvc.perform(post("/api/checkup/run")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", TestJwtHelper.DEMO_ORG_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidOutputBody())))
            .andReturn();

        assertThat(result.getResponse().getStatus())
            .as("Must exercise output-validation-failure path, not bounce on 402 (credits were seeded)")
            .isNotEqualTo(402);

        Long reportsAfterObj = jdbc.queryForObject("SELECT COUNT(*) FROM checkup_reports", Long.class);
        long reportsAfter = reportsAfterObj != null ? reportsAfterObj : 0L;
        assertThat(reportsAfter).isEqualTo(reportsBefore);
    }

    @Test
    void invalidProviderOutput_responseContainsNoPtBrRawAiContent() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/checkup/run")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", TestJwtHelper.DEMO_ORG_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidOutputBody())))
            .andReturn();

        String body = result.getResponse().getContentAsString();
        // Raw AI content must never appear in the response
        assertThat(body).doesNotContain("sem artefatos estruturados");
        assertThat(body).doesNotContain("sk-ant");
        assertThat(body).doesNotContain("ANTHROPIC_API_KEY");
    }
}
