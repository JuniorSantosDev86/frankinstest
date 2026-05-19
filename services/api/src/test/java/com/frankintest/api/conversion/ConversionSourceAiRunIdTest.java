package com.frankintest.api.conversion;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.frankintest.api.BaseIntegrationTest;
import com.frankintest.api.TestJwtHelper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * T004: verifica que, após uma conversão, o WorkspaceArtifact criado tem
 * sourceAiRunId preenchido com o aiRunId do CheckupReport de origem.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ConversionSourceAiRunIdTest extends BaseIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private JdbcTemplate jdbc;

    private String orgId;
    private String reportId;
    private String aiRunId;
    private String token;

    @BeforeEach
    void setupData() {
        orgId = "org_sai_" + UUID.randomUUID().toString().substring(0, 8);
        reportId = "rpt_sai_" + UUID.randomUUID().toString().substring(0, 8);
        aiRunId = "run_sai_" + UUID.randomUUID().toString().substring(0, 8);
        token = TestJwtHelper.validToken("user_sai_test", List.of(orgId));

        jdbc.update("""
            INSERT INTO ai_runs (id, organization_id, project_id, user_id, feature,
                estimated_credits, reserved_credits, consumed_credits,
                status, failure_category, created_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)
            """,
            aiRunId, orgId, "proj_test", "user_sai_test", "checkup",
            0L, 0L, 0L, "completed", "none", Timestamp.from(Instant.now())
        );

        jdbc.update("""
            INSERT INTO checkup_reports (
                id, ai_run_id, organization_id, user_id, status,
                target_type, target_value, context, goal, depth,
                quality_risks, missing_or_unclear_requirements,
                suggested_test_scenarios, suggested_test_cases,
                ux_product_risks, release_readiness_notes,
                recommended_next_actions
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """,
            reportId, aiRunId, orgId, "user_sai_test", "DRAFT",
            "FEATURE_DESCRIPTION", "https://example.com/feature",
            "contexto de teste", "objetivo de teste", "STANDARD",
            "[]",
            "[{\"title\":\"Requisito missing\",\"description\":\"desc req\",\"severity\":\"HIGH\"}]",
            "[]", "[]", "[]", "[]", "[]"
        );
    }

    @Test
    void confirm_createsArtifactWithSourceAiRunIdFromReport() throws Exception {
        var body = Map.of("items", List.of(
            Map.of("sourceSection", "missing_or_unclear_requirements",
                   "sourceItemIndex", 0,
                   "intent", "CREATE_NEW")
        ));

        mockMvc.perform(post("/api/checkup/reports/{reportId}/conversion/confirm", reportId)
                .header("Authorization", TestJwtHelper.bearer(token))
                .header("X-Organization-Id", orgId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isOk());

        String savedAiRunId = jdbc.queryForObject(
            "SELECT source_ai_run_id FROM workspace_artifacts WHERE source_checkup_report_id = ?",
            String.class, reportId
        );

        assertThat(savedAiRunId)
            .as("sourceAiRunId deve ser o aiRunId do CheckupReport de origem")
            .isEqualTo(aiRunId);
    }

    @Test
    void confirm_sourceAiRunIdExposedInApiResponse() throws Exception {
        var body = Map.of("items", List.of(
            Map.of("sourceSection", "missing_or_unclear_requirements",
                   "sourceItemIndex", 0,
                   "intent", "CREATE_NEW")
        ));

        mockMvc.perform(post("/api/checkup/reports/{reportId}/conversion/confirm", reportId)
                .header("Authorization", TestJwtHelper.bearer(token))
                .header("X-Organization-Id", orgId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isOk());

        // Read back the artifact via the workspace API to verify sourceAiRunId is exposed
        String artifactId = jdbc.queryForObject(
            "SELECT id FROM workspace_artifacts WHERE source_checkup_report_id = ?",
            String.class, reportId
        );

        String response = mockMvc.perform(
                org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                    .get("/api/workspace/artifacts/{id}", artifactId)
                    .header("Authorization", TestJwtHelper.bearer(token))
                    .header("X-Organization-Id", orgId))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        @SuppressWarnings("unchecked")
        Map<String, Object> artifact = objectMapper.readValue(response, Map.class);
        assertThat(artifact.get("sourceAiRunId"))
            .as("sourceAiRunId deve ser exposto na resposta da API")
            .isEqualTo(aiRunId);
    }
}
