package com.frankintest.api.conversion;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.frankintest.api.BaseIntegrationTest;
import com.frankintest.api.TestJwtHelper;
import com.frankintest.api.airuns.AiRunModels;
import com.frankintest.api.airuns.AiRunRepository;
import com.frankintest.api.checkup.CheckupModels;
import com.frankintest.api.checkup.CheckupRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ConversionControllerIntegrationTest extends BaseIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private CheckupRepository checkupRepository;
    @Autowired private AiRunRepository aiRunRepository;

    private String orgId;
    private String reportId;
    private String aiRunId;
    private String token;

    @BeforeEach
    void setupData() {
        orgId = "org_conv_" + UUID.randomUUID().toString().substring(0, 8);
        reportId = "rpt_" + UUID.randomUUID().toString().substring(0, 8);
        aiRunId = "run_" + UUID.randomUUID().toString().substring(0, 8);
        token = TestJwtHelper.validToken("user_conv_test", List.of(orgId));

        // Insert a completed ai_run
        jdbc.update("""
            INSERT INTO ai_runs (id, organization_id, project_id, user_id, feature,
                estimated_credits, reserved_credits, consumed_credits,
                status, failure_category, created_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)
            """,
            aiRunId, orgId, "proj_test", "user_conv_test", "checkup",
            0L, 0L, 0L, "completed", "none", java.sql.Timestamp.from(Instant.now())
        );

        // Insert a checkup_report linked to that run
        jdbc.update("""
            INSERT INTO checkup_reports (
                id, ai_run_id, organization_id, user_id, status,
                target_type, target_value, context, goal, depth,
                quality_risks, missing_or_unclear_requirements,
                suggested_test_scenarios, suggested_test_cases,
                ux_product_risks, release_readiness_notes, recommended_next_actions,
                created_at, updated_at
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """,
            reportId, aiRunId, orgId, "user_conv_test", "DRAFT",
            "FEATURE_DESCRIPTION", "My feature", "contexto", "objetivo", "STANDARD",
            "[{\"title\":\"Risco Q1\",\"description\":\"desc risco\",\"severity\":\"HIGH\"}]",
            "[{\"title\":\"Req ausente\",\"description\":\"desc req\",\"severity\":\"HIGH\"}]",
            "[{\"title\":\"Cenário login\",\"description\":\"desc cenario\",\"type\":\"NEGATIVE\"}]",
            "[{\"title\":\"TC Login\",\"preconditions\":\"logado\",\"steps\":[\"abrir\",\"clicar\"],\"expectedResult\":\"ok\"}]",
            "[{\"title\":\"Risco UX\",\"description\":\"desc ux\",\"severity\":\"MEDIUM\"}]",
            "[{\"title\":\"Nota release\",\"description\":\"desc release\",\"severity\":\"LOW\"}]",
            "[]",
            java.sql.Timestamp.from(Instant.now()), java.sql.Timestamp.from(Instant.now())
        );
    }

    // ─── Auth guard: 401 ──────────────────────────────────────────────────────

    @Test
    void preview_noJwt_returns401() throws Exception {
        mockMvc.perform(post("/api/checkup/reports/{id}/conversion/preview", reportId)
                .header("X-Organization-Id", orgId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"selectedItems\":[]}"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void confirm_noJwt_returns401() throws Exception {
        mockMvc.perform(post("/api/checkup/reports/{id}/conversion/confirm", reportId)
                .header("X-Organization-Id", orgId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"items\":[]}"))
            .andExpect(status().isUnauthorized());
    }

    // ─── Auth guard: 403 ──────────────────────────────────────────────────────

    @Test
    void preview_wrongOrgId_returns403() throws Exception {
        mockMvc.perform(post("/api/checkup/reports/{id}/conversion/preview", reportId)
                .header("Authorization", TestJwtHelper.bearer(token))
                .header("X-Organization-Id", "org_wrong")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "selectedItems", List.of(Map.of("sourceSection", "quality_risks", "sourceItemIndex", 0))
                ))))
            .andExpect(status().isForbidden());
    }

    @Test
    void confirm_wrongOrgId_returns403() throws Exception {
        mockMvc.perform(post("/api/checkup/reports/{id}/conversion/confirm", reportId)
                .header("Authorization", TestJwtHelper.bearer(token))
                .header("X-Organization-Id", "org_wrong")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "items", List.of(Map.of("sourceSection", "quality_risks", "sourceItemIndex", 0, "intent", "CREATE_NEW"))
                ))))
            .andExpect(status().isForbidden());
    }

    @Test
    void preview_reportFromAnotherOrg_returns403() throws Exception {
        // Use a token for a different org but target our report
        String otherToken = TestJwtHelper.validToken("user_other", List.of("org_completely_different"));
        mockMvc.perform(post("/api/checkup/reports/{id}/conversion/preview", reportId)
                .header("Authorization", TestJwtHelper.bearer(otherToken))
                .header("X-Organization-Id", "org_completely_different")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "selectedItems", List.of(Map.of("sourceSection", "quality_risks", "sourceItemIndex", 0))
                ))))
            .andExpect(status().isForbidden());
    }

    // ─── Validation: 400 ──────────────────────────────────────────────────────

    @Test
    void preview_emptySelectedItems_returns400() throws Exception {
        mockMvc.perform(post("/api/checkup/reports/{id}/conversion/preview", reportId)
                .header("Authorization", TestJwtHelper.bearer(token))
                .header("X-Organization-Id", orgId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("selectedItems", List.of()))))
            .andExpect(status().isBadRequest());
    }

    @Test
    void confirm_emptyItems_returns400() throws Exception {
        mockMvc.perform(post("/api/checkup/reports/{id}/conversion/confirm", reportId)
                .header("Authorization", TestJwtHelper.bearer(token))
                .header("X-Organization-Id", orgId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("items", List.of()))))
            .andExpect(status().isBadRequest());
    }

    @Test
    void confirm_allSkip_returns400() throws Exception {
        mockMvc.perform(post("/api/checkup/reports/{id}/conversion/confirm", reportId)
                .header("Authorization", TestJwtHelper.bearer(token))
                .header("X-Organization-Id", orgId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("items", List.of(
                    Map.of("sourceSection", "quality_risks", "sourceItemIndex", 0, "intent", "SKIP")
                )))))
            .andExpect(status().isBadRequest());
    }

    // ─── Happy path ───────────────────────────────────────────────────────────

    @Test
    void preview_completedReport_returns200WithItems() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
            "selectedItems", List.of(
                Map.of("sourceSection", "missing_or_unclear_requirements", "sourceItemIndex", 0),
                Map.of("sourceSection", "quality_risks", "sourceItemIndex", 0)
            )
        ));

        mockMvc.perform(post("/api/checkup/reports/{id}/conversion/preview", reportId)
                .header("Authorization", TestJwtHelper.bearer(token))
                .header("X-Organization-Id", orgId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.reportId").value(reportId))
            .andExpect(jsonPath("$.items").isArray())
            .andExpect(jsonPath("$.items.length()").value(2))
            .andExpect(jsonPath("$.items[0].artifactType").value("REQUIREMENT"))
            .andExpect(jsonPath("$.items[1].artifactType").value("RISK_ITEM"));
    }

    @Test
    void confirm_createNew_returns200AndPersistsArtifacts() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("items", List.of(
            Map.of("sourceSection", "missing_or_unclear_requirements", "sourceItemIndex", 0, "intent", "CREATE_NEW"),
            Map.of("sourceSection", "quality_risks", "sourceItemIndex", 0, "intent", "CREATE_NEW")
        )));

        mockMvc.perform(post("/api/checkup/reports/{id}/conversion/confirm", reportId)
                .header("Authorization", TestJwtHelper.bearer(token))
                .header("X-Organization-Id", orgId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.reportId").value(reportId))
            .andExpect(jsonPath("$.createdArtifacts").isArray())
            .andExpect(jsonPath("$.createdArtifacts.length()").value(2));

        // Verify DB persistence with traceability fields
        List<Map<String, Object>> artifacts = jdbc.queryForList(
            "SELECT * FROM workspace_artifacts WHERE source_checkup_report_id = ?", reportId);
        assertThat(artifacts).hasSize(2);
        assertThat(artifacts).allMatch(a -> Boolean.TRUE.equals(a.get("ai_assisted")));
        assertThat(artifacts).allMatch(a -> "DRAFT".equals(a.get("status")));
        assertThat(artifacts).allMatch(a -> reportId.equals(a.get("source_checkup_report_id")));
    }

    @Test
    void confirm_testScenario_persistsInTestScenariosTable() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("items", List.of(
            Map.of("sourceSection", "suggested_test_scenarios", "sourceItemIndex", 0, "intent", "CREATE_NEW")
        )));

        mockMvc.perform(post("/api/checkup/reports/{id}/conversion/confirm", reportId)
                .header("Authorization", TestJwtHelper.bearer(token))
                .header("X-Organization-Id", orgId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.createdArtifacts[0].artifactType").value("TEST_SCENARIO"))
            .andExpect(jsonPath("$.createdArtifacts[0].targetTable").value("test_scenarios"));

        List<Map<String, Object>> scenarios = jdbc.queryForList(
            "SELECT * FROM test_scenarios WHERE source_checkup_report_id = ?", reportId);
        assertThat(scenarios).hasSize(1);
        assertThat(scenarios.get(0).get("source_section")).isEqualTo("suggested_test_scenarios");
        assertThat(scenarios.get(0).get("source_item_index")).isEqualTo(0);
        assertThat(scenarios.get(0).get("ai_assisted")).isEqualTo(true);
    }

    @Test
    void confirm_idempotency_secondCallReturnsSameArtifacts() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("items", List.of(
            Map.of("sourceSection", "missing_or_unclear_requirements", "sourceItemIndex", 0, "intent", "CREATE_NEW")
        )));

        // First call
        mockMvc.perform(post("/api/checkup/reports/{id}/conversion/confirm", reportId)
                .header("Authorization", TestJwtHelper.bearer(token))
                .header("X-Organization-Id", orgId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isOk());

        // Second call with SKIP (idempotent — no duplicate)
        String body2 = objectMapper.writeValueAsString(Map.of("items", List.of(
            Map.of("sourceSection", "quality_risks", "sourceItemIndex", 0, "intent", "CREATE_NEW")
        )));
        mockMvc.perform(post("/api/checkup/reports/{id}/conversion/confirm", reportId)
                .header("Authorization", TestJwtHelper.bearer(token))
                .header("X-Organization-Id", orgId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body2))
            .andExpect(status().isOk());

        // Only 2 workspace_artifacts total (one per section/index)
        int count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM workspace_artifacts WHERE source_checkup_report_id = ?",
            Integer.class, reportId);
        assertThat(count).isEqualTo(2);
    }

    @Test
    void confirm_auditEventRecorded() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("items", List.of(
            Map.of("sourceSection", "missing_or_unclear_requirements", "sourceItemIndex", 0, "intent", "CREATE_NEW")
        )));

        mockMvc.perform(post("/api/checkup/reports/{id}/conversion/confirm", reportId)
                .header("Authorization", TestJwtHelper.bearer(token))
                .header("X-Organization-Id", orgId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isOk());

        List<String> events = jdbc.queryForList(
            "SELECT event_type FROM audit_log WHERE organization_id = ? AND entity_id = ?",
            String.class, orgId, reportId);
        assertThat(events).contains("CHECKUP_ARTIFACTS_CONVERTED");
    }
}
