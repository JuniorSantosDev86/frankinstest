package com.frankintest.api.toolrecommendation;

import com.frankintest.api.BaseIntegrationTest;
import com.frankintest.api.TestJwtHelper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ToolRecommendationControllerTest extends BaseIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JdbcTemplate jdbc;

    private String orgId;
    private String reportId;
    private String aiRunId;
    private String token;

    @BeforeEach
    void setup() {
        orgId = "org_toolrec_" + UUID.randomUUID().toString().substring(0, 8);
        reportId = "rpt_toolrec_" + UUID.randomUUID().toString().substring(0, 8);
        aiRunId = "run_toolrec_" + UUID.randomUUID().toString().substring(0, 8);
        token = TestJwtHelper.validToken("user_toolrec_test", List.of(orgId));

        Timestamp now = Timestamp.from(Instant.now());

        jdbc.update("""
            INSERT INTO ai_runs (id, organization_id, project_id, user_id, feature,
                estimated_credits, reserved_credits, consumed_credits,
                status, failure_category, created_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)
            """,
            aiRunId, orgId, "proj_toolrec", "user_toolrec_test", "checkup",
            0L, 0L, 0L, "completed", "none", now
        );

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
            reportId, aiRunId, orgId, "user_toolrec_test", "DRAFT",
            "FEATURE_DESCRIPTION", "Meu sistema com performance e carga", "ctx", "goal", "STANDARD",
            "[{\"title\":\"Risco de performance\",\"description\":\"latência elevada sob carga\",\"severity\":\"HIGH\"}]",
            "[]", "[]", "[]", "[]", "[]", "[]",
            now, now
        );
    }

    // ── POST /api/tool-recommendations/{reportId} ─────────────────────────────

    @Test
    void generate_comRelatorioValido_retorna200ComPERFORMANCE() throws Exception {
        mockMvc.perform(post("/api/tool-recommendations/{reportId}", reportId)
                .header("Authorization", TestJwtHelper.bearer(token))
                .header("X-Organization-Id", orgId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.reportId").value(reportId))
            .andExpect(jsonPath("$.categories").isArray())
            .andExpect(jsonPath("$.categories[0].categoryCode").value("PERFORMANCE"));
    }

    @Test
    void generate_semJwt_retorna401() throws Exception {
        mockMvc.perform(post("/api/tool-recommendations/{reportId}", reportId)
                .header("X-Organization-Id", orgId))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void generate_semOrgHeader_retorna403() throws Exception {
        mockMvc.perform(post("/api/tool-recommendations/{reportId}", reportId)
                .header("Authorization", TestJwtHelper.bearer(token)))
            .andExpect(status().isForbidden());
    }

    @Test
    void generate_orgDiferente_retorna404() throws Exception {
        String otherToken = TestJwtHelper.validToken("user_other", List.of("org_other_xyz"));
        mockMvc.perform(post("/api/tool-recommendations/{reportId}", reportId)
                .header("Authorization", TestJwtHelper.bearer(otherToken))
                .header("X-Organization-Id", "org_other_xyz"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.message").value("Relatório não encontrado."));
    }

    @Test
    void generate_reportIdInexistente_retorna404() throws Exception {
        mockMvc.perform(post("/api/tool-recommendations/{reportId}", "rpt_nao_existe_xyz")
                .header("Authorization", TestJwtHelper.bearer(token))
                .header("X-Organization-Id", orgId))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.message").value("Relatório não encontrado."));
    }

    // ── POST /api/tool-recommendations/{reportId}/save ────────────────────────

    @Test
    void save_comRelatorioValido_retorna201ComQA_ACTION() throws Exception {
        mockMvc.perform(post("/api/tool-recommendations/{reportId}/save", reportId)
                .header("Authorization", TestJwtHelper.bearer(token))
                .header("X-Organization-Id", orgId))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.artifactType").value("QA_ACTION"))
            .andExpect(jsonPath("$.status").value("DRAFT"))
            .andExpect(jsonPath("$.artifactId").isNotEmpty());
    }

    @Test
    void save_artefatoNobanco_comDetailsNaoNulo() throws Exception {
        mockMvc.perform(post("/api/tool-recommendations/{reportId}/save", reportId)
                .header("Authorization", TestJwtHelper.bearer(token))
                .header("X-Organization-Id", orgId))
            .andExpect(status().isCreated());

        List<String> details = jdbc.queryForList(
            "SELECT details FROM workspace_artifacts WHERE source_checkup_report_id = ? AND source_section = 'tool-recommendations'",
            String.class, reportId
        );
        assertThat(details).isNotEmpty();
        assertThat(details.get(0)).isNotNull();
        assertThat(details.get(0)).contains("PERFORMANCE");
    }

    @Test
    void save_duasVezes_criaDoisArtefatosDistintos() throws Exception {
        mockMvc.perform(post("/api/tool-recommendations/{reportId}/save", reportId)
                .header("Authorization", TestJwtHelper.bearer(token))
                .header("X-Organization-Id", orgId))
            .andExpect(status().isCreated());

        mockMvc.perform(post("/api/tool-recommendations/{reportId}/save", reportId)
                .header("Authorization", TestJwtHelper.bearer(token))
                .header("X-Organization-Id", orgId))
            .andExpect(status().isCreated());

        Long count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM workspace_artifacts WHERE source_checkup_report_id = ? AND source_section = 'tool-recommendations'",
            Long.class, reportId
        );
        assertThat(count).isEqualTo(2L);
    }

    @Test
    void save_semJwt_retorna401() throws Exception {
        mockMvc.perform(post("/api/tool-recommendations/{reportId}/save", reportId)
                .header("X-Organization-Id", orgId))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void save_semOrgHeader_retorna403() throws Exception {
        mockMvc.perform(post("/api/tool-recommendations/{reportId}/save", reportId)
                .header("Authorization", TestJwtHelper.bearer(token)))
            .andExpect(status().isForbidden());
    }

}
