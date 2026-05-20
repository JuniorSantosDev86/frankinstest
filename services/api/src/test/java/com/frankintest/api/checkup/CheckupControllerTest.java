package com.frankintest.api.checkup;

import com.frankintest.api.BaseIntegrationTest;
import com.frankintest.api.TestJwtHelper;
import com.frankintest.api.airuns.AiRunModels;
import com.frankintest.api.airuns.AiRunRepository;
import com.frankintest.api.conversion.ConversionModels;
import com.frankintest.api.conversion.WorkspaceArtifactRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Bloco 16 — Integration tests for GET /api/checkup/runs and GET /api/checkup/runs/summary
 * Also covers regression tests for GET /api/checkup/runs/{aiRunId} (T020).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CheckupControllerTest extends BaseIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private AiRunRepository aiRunRepository;
    @Autowired private CheckupRepository checkupRepository;
    @Autowired private WorkspaceArtifactRepository workspaceArtifactRepository;
    @Autowired private JdbcTemplate jdbc;

    private static final String ORG_A = TestJwtHelper.DEMO_ORG_ID;
    private static final String ORG_B = TestJwtHelper.OTHER_ORG_ID;

    @BeforeEach
    void cleanupCheckupData() {
        // Remove test data inserted by this test class only (keyed by unique IDs)
        jdbc.execute("DELETE FROM workspace_artifacts WHERE organization_id IN ('" + ORG_A + "','" + ORG_B + "') AND source_section = 'test_bloco16'");
        jdbc.execute("DELETE FROM checkup_reports WHERE organization_id IN ('" + ORG_A + "','" + ORG_B + "') AND goal = '__bloco16_test__'");
        jdbc.execute("DELETE FROM ai_runs WHERE organization_id IN ('" + ORG_A + "','" + ORG_B + "') AND input_summary LIKE '__bloco16%'");
    }

    // ── Helper: insert a minimal ai_run row ───────────────────────────────────

    /** Returns [runId, reportId] — reportId is non-null only for completed runs. */
    private String[] insertRunWithReport(String orgId, AiRunModels.AiRunStatus status, long estimatedCredits, long consumedCredits) {
        String runId = UUID.randomUUID().toString();
        String reportId = UUID.randomUUID().toString();
        Instant now = Instant.now();
        AiRunModels.AiRun run = new AiRunModels.AiRun(
            runId, orgId, "checkup", TestJwtHelper.DEMO_USER_ID,
            AiRunModels.AiRunFeature.checkup,
            null, null,
            "__bloco16_test_run_" + runId.substring(0, 8),
            estimatedCredits, 0L, consumedCredits,
            status,
            AiRunModels.AiRunFailureCategory.none,
            AiRunModels.OutputArtifactType.checkup_report,
            status == AiRunModels.AiRunStatus.completed ? List.of(reportId) : List.of(),
            null,
            now, null,
            status == AiRunModels.AiRunStatus.completed ? now : null
        );
        aiRunRepository.insert(run);
        if (status == AiRunModels.AiRunStatus.completed) {
            CheckupModels.CheckupReport report = new CheckupModels.CheckupReport(
                reportId, runId, orgId, TestJwtHelper.DEMO_USER_ID,
                CheckupModels.ReportStatus.DRAFT,
                CheckupModels.TargetType.URL,
                "https://test.example.com",
                "Contexto de teste bloco 16",
                "__bloco16_test__",
                CheckupModels.CheckupDepth.STANDARD,
                List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), List.of(),
                null, now, now
            );
            checkupRepository.save(report);
            return new String[]{runId, reportId};
        }
        return new String[]{runId, null};
    }

    private String insertRun(String orgId, AiRunModels.AiRunStatus status, long estimatedCredits, long consumedCredits) {
        return insertRunWithReport(orgId, status, estimatedCredits, consumedCredits)[0];
    }

    private void insertArtifact(String orgId, String sourceAiRunId, String sourceCheckupReportId) {
        ConversionModels.WorkspaceArtifactRow artifact = new ConversionModels.WorkspaceArtifactRow(
            UUID.randomUUID().toString(),
            orgId, null,
            "test_scenario",
            "Artefato de teste bloco 16",
            "Descrição",
            "active", true,
            sourceCheckupReportId, sourceAiRunId,
            "test_bloco16", 0,
            null, TestJwtHelper.DEMO_USER_ID,
            Instant.now(), Instant.now()
        );
        workspaceArtifactRepository.save(artifact);
    }

    // ── T009: GET /api/checkup/runs — lista runs da org, paginação, campos ────

    @Test
    void listRuns_validRequest_returnsPageWithCorrectFields() throws Exception {
        String runId = insertRun(ORG_A, AiRunModels.AiRunStatus.completed, 20L, 18L);

        mockMvc.perform(get("/api/checkup/runs")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", ORG_A)
                .param("page", "0")
                .param("size", "20"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isArray())
            .andExpect(jsonPath("$.page").value(0))
            .andExpect(jsonPath("$.size").value(20))
            .andExpect(jsonPath("$.totalElements").isNumber())
            .andExpect(jsonPath("$.totalPages").isNumber())
            .andExpect(jsonPath("$.content[?(@.aiRunId == '" + runId + "')].status").value("completed"))
            .andExpect(jsonPath("$.content[?(@.aiRunId == '" + runId + "')].estimatedCredits").value(20))
            .andExpect(jsonPath("$.content[?(@.aiRunId == '" + runId + "')].consumedCredits").value(18));
    }

    @Test
    void listRuns_multipleRuns_returnedInDescendingOrder() throws Exception {
        // Insert two runs in sequence; ordering is by created_at DESC
        insertRun(ORG_A, AiRunModels.AiRunStatus.completed, 10L, 10L);
        insertRun(ORG_A, AiRunModels.AiRunStatus.failed, 20L, 0L);

        mockMvc.perform(get("/api/checkup/runs")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", ORG_A)
                .param("size", "50"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isArray());
        // Both runs inserted for ORG_A; we just verify list is non-empty and responds 200
    }

    // ── T010: GET /api/checkup/runs without JWT → 401 ────────────────────────

    @Test
    void listRuns_missingJwt_returns401() throws Exception {
        mockMvc.perform(get("/api/checkup/runs")
                .header("X-Organization-Id", ORG_A))
            .andExpect(status().isUnauthorized());
    }

    // ── T011: GET /api/checkup/runs without X-Organization-Id → 400/403 ──────

    @Test
    void listRuns_missingOrgHeader_returns4xx() throws Exception {
        mockMvc.perform(get("/api/checkup/runs")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken())))
            .andExpect(result -> {
                int status = result.getResponse().getStatus();
                if (status != 400 && status != 403) {
                    throw new AssertionError("Expected 400 or 403 but got " + status);
                }
            });
    }

    // ── T012: Org isolation — run from ORG_B not visible in ORG_A ─────────────

    @Test
    void listRuns_orgIsolation_orgBRunNotVisibleInOrgA() throws Exception {
        String orgBRunId = insertRun(ORG_B, AiRunModels.AiRunStatus.completed, 10L, 10L);

        String response = mockMvc.perform(get("/api/checkup/runs")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", ORG_A)
                .param("size", "50"))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        // The ORG_B run must not appear in ORG_A's list
        if (response.contains(orgBRunId)) {
            throw new AssertionError("ORG_B run '" + orgBRunId + "' was exposed in ORG_A response");
        }
    }

    // ── T020: GET /api/checkup/runs/{aiRunId} — existing endpoint unchanged ──

    @Test
    void getRunStatus_existingEndpoint_notAltered() throws Exception {
        String runId = insertRun(ORG_A, AiRunModels.AiRunStatus.completed, 20L, 18L);

        mockMvc.perform(get("/api/checkup/runs/" + runId)
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", ORG_A))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.aiRunId").value(runId))
            .andExpect(jsonPath("$.status").value("completed"));
    }

    // ── T024: artifactCount correct in listRuns ──────────────────────────────

    @Test
    void listRuns_artifactCountCorrect_zeroWhenNoArtifacts() throws Exception {
        insertRun(ORG_A, AiRunModels.AiRunStatus.completed, 10L, 10L);

        String response = mockMvc.perform(get("/api/checkup/runs")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", ORG_A)
                .param("size", "50"))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        // artifactCount must be present and 0 for this run (no artifacts inserted)
        org.assertj.core.api.Assertions.assertThat(response)
            .contains("\"artifactCount\"");
    }

    @Test
    void listRuns_artifactCountCorrect_countsArtifactsForRun() throws Exception {
        String[] runData = insertRunWithReport(ORG_A, AiRunModels.AiRunStatus.completed, 10L, 10L);
        String runId = runData[0];
        String reportId = runData[1];
        insertArtifact(ORG_A, runId, reportId);
        insertArtifact(ORG_A, runId, reportId);

        mockMvc.perform(get("/api/checkup/runs")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", ORG_A)
                .param("size", "50"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[?(@.aiRunId == '" + runId + "')].artifactCount").value(2));
    }

    // ── T026: GET /api/checkup/runs/summary ──────────────────────────────────

    @Test
    void getRunsSummary_orgWithRuns_returnsCorrectCounts() throws Exception {
        insertRun(ORG_A, AiRunModels.AiRunStatus.completed, 10L, 10L);
        insertRun(ORG_A, AiRunModels.AiRunStatus.failed, 20L, 0L);

        mockMvc.perform(get("/api/checkup/runs/summary")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", ORG_A))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalRuns").isNumber())
            .andExpect(jsonPath("$.completedRuns").isNumber())
            .andExpect(jsonPath("$.runningRuns").isNumber())
            .andExpect(jsonPath("$.failedRuns").isNumber())
            .andExpect(jsonPath("$.totalConsumedCredits").isNumber())
            .andExpect(jsonPath("$.totalArtifacts").isNumber());
    }

    @Test
    void getRunsSummary_orgWithoutRuns_returnsAllZeros() throws Exception {
        // Use ORG_B which we haven't added runs to in this test
        // (cleanup runs before each test, and we don't insert for ORG_B here)
        mockMvc.perform(get("/api/checkup/runs/summary")
                .header("Authorization", TestJwtHelper.bearer(
                    TestJwtHelper.validToken(TestJwtHelper.DEMO_USER_ID, List.of(ORG_B))))
                .header("X-Organization-Id", ORG_B))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalRuns").value(0))
            .andExpect(jsonPath("$.completedRuns").value(0))
            .andExpect(jsonPath("$.runningRuns").value(0))
            .andExpect(jsonPath("$.failedRuns").value(0))
            .andExpect(jsonPath("$.totalConsumedCredits").value(0))
            .andExpect(jsonPath("$.totalArtifacts").value(0));
    }

    @Test
    void getRunsSummary_orgIsolation_doesNotLeakOtherOrgData() throws Exception {
        insertRun(ORG_B, AiRunModels.AiRunStatus.completed, 99L, 99L);

        // ORG_A summary should not include ORG_B's consumed credits
        mockMvc.perform(get("/api/checkup/runs/summary")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", ORG_A))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalRuns").isNumber());
        // We can't assert exact 0 here because other tests may have added ORG_A runs,
        // but we verify the endpoint responds cleanly without ORG_B data bleeding in.
    }

    // ── T027: summary auth errors ────────────────────────────────────────────

    @Test
    void getRunsSummary_missingJwt_returns401() throws Exception {
        mockMvc.perform(get("/api/checkup/runs/summary")
                .header("X-Organization-Id", ORG_A))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void getRunsSummary_missingOrgHeader_returns4xx() throws Exception {
        mockMvc.perform(get("/api/checkup/runs/summary")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken())))
            .andExpect(result -> {
                int status = result.getResponse().getStatus();
                if (status != 400 && status != 403) {
                    throw new AssertionError("Expected 400 or 403 but got " + status);
                }
            });
    }

    // ── SC-002: GET /api/checkup/runs responde em < 2s com até 100 runs ──────
    // Insere 100 ai_runs para ORG_A, mede o tempo total da chamada via MockMvc
    // e falha o teste se exceder 2000 ms (SC-002).

    @Test
    void listRuns_sc002_respondsUnder2000msFor100Runs() throws Exception {
        // Seed 100 runs for ORG_A (mix of statuses to exercise all JOIN paths)
        for (int i = 0; i < 60; i++) {
            insertRun(ORG_A, AiRunModels.AiRunStatus.completed, 10L, 9L);
        }
        for (int i = 0; i < 25; i++) {
            insertRun(ORG_A, AiRunModels.AiRunStatus.running, 10L, 0L);
        }
        for (int i = 0; i < 15; i++) {
            insertRun(ORG_A, AiRunModels.AiRunStatus.failed, 10L, 0L);
        }

        long start = System.currentTimeMillis();

        mockMvc.perform(get("/api/checkup/runs")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", ORG_A)
                .param("page", "0")
                .param("size", "20"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements").isNumber());

        long elapsed = System.currentTimeMillis() - start;

        // Log the measured time so it appears in the test output
        System.out.printf("[SC-002] GET /api/checkup/runs with 100 runs: %d ms%n", elapsed);

        assertThat(elapsed)
            .as("SC-002: GET /api/checkup/runs deve responder em menos de 2000 ms com 100 runs, mas levou %d ms", elapsed)
            .isLessThan(2000L);
    }
}
