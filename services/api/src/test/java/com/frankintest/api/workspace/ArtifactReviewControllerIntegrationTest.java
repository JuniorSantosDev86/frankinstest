package com.frankintest.api.workspace;

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
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ArtifactReviewControllerIntegrationTest extends BaseIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired JdbcTemplate jdbc;

    private String orgId;
    private String otherOrgId;
    private String token;
    private String otherToken;
    private String artifactId;

    @BeforeEach
    void setupData() {
        orgId = "org_rev_" + UUID.randomUUID().toString().substring(0, 8);
        otherOrgId = "org_other_" + UUID.randomUUID().toString().substring(0, 8);
        token = TestJwtHelper.validToken("user_review_test", List.of(orgId));
        otherToken = TestJwtHelper.validToken("user_review_other", List.of(otherOrgId));
        artifactId = "wa_rev_" + UUID.randomUUID().toString().substring(0, 8);

        insertArtifact(artifactId, orgId, "REQUIREMENT", "DRAFT",
            "{\"severity\":\"HIGH\",\"originalText\":\"original text\"}");
    }

    // ── GET /api/workspace/artifacts ─────────────────────────────────────────

    @Test
    void listArtifacts_noJwt_returns401() throws Exception {
        mockMvc.perform(get("/api/workspace/artifacts")
                .header("X-Organization-Id", orgId))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void listArtifacts_missingOrgHeader_returns403() throws Exception {
        mockMvc.perform(get("/api/workspace/artifacts")
                .header("Authorization", TestJwtHelper.bearer(token)))
            .andExpect(status().isForbidden());
    }

    @Test
    void listArtifacts_wrongOrg_returns403() throws Exception {
        mockMvc.perform(get("/api/workspace/artifacts")
                .header("Authorization", TestJwtHelper.bearer(token))
                .header("X-Organization-Id", otherOrgId))
            .andExpect(status().isForbidden());
    }

    @Test
    void listArtifacts_correctOrg_returns200WithArtifacts() throws Exception {
        mockMvc.perform(get("/api/workspace/artifacts")
                .header("Authorization", TestJwtHelper.bearer(token))
                .header("X-Organization-Id", orgId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.artifacts", hasSize(greaterThanOrEqualTo(1))))
            .andExpect(jsonPath("$.limitReached").isBoolean());
    }

    @Test
    void listArtifacts_filterByArtifactType_returnsFiltered() throws Exception {
        mockMvc.perform(get("/api/workspace/artifacts")
                .header("Authorization", TestJwtHelper.bearer(token))
                .header("X-Organization-Id", orgId)
                .param("artifactType", "REQUIREMENT"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.artifacts[*].artifactType", everyItem(equalTo("REQUIREMENT"))));
    }

    @Test
    void listArtifacts_filterByStatus_returnsFiltered() throws Exception {
        mockMvc.perform(get("/api/workspace/artifacts")
                .header("Authorization", TestJwtHelper.bearer(token))
                .header("X-Organization-Id", orgId)
                .param("status", "DRAFT"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.artifacts[*].status", everyItem(equalTo("DRAFT"))));
    }

    @Test
    void listArtifacts_invalidArtifactType_returns400() throws Exception {
        mockMvc.perform(get("/api/workspace/artifacts")
                .header("Authorization", TestJwtHelper.bearer(token))
                .header("X-Organization-Id", orgId)
                .param("artifactType", "INVALID"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void listArtifacts_emptyResult_returns200EmptyList() throws Exception {
        String emptyOrg = "org_empty_" + UUID.randomUUID().toString().substring(0, 8);
        String emptyToken = TestJwtHelper.validToken("user_empty", List.of(emptyOrg));

        mockMvc.perform(get("/api/workspace/artifacts")
                .header("Authorization", TestJwtHelper.bearer(emptyToken))
                .header("X-Organization-Id", emptyOrg))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.artifacts", hasSize(0)))
            .andExpect(jsonPath("$.limitReached", is(false)));
    }

    // ── GET /api/workspace/artifacts/{id} ────────────────────────────────────

    @Test
    void getArtifact_noJwt_returns401() throws Exception {
        mockMvc.perform(get("/api/workspace/artifacts/" + artifactId)
                .header("X-Organization-Id", orgId))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void getArtifact_missingOrgHeader_returns403() throws Exception {
        mockMvc.perform(get("/api/workspace/artifacts/" + artifactId)
                .header("Authorization", TestJwtHelper.bearer(token)))
            .andExpect(status().isForbidden());
    }

    @Test
    void getArtifact_unknownId_returns404() throws Exception {
        mockMvc.perform(get("/api/workspace/artifacts/wa_nonexistent_999")
                .header("Authorization", TestJwtHelper.bearer(token))
                .header("X-Organization-Id", orgId))
            .andExpect(status().isNotFound());
    }

    @Test
    void getArtifact_crossOrgId_returns404NotForbidden() throws Exception {
        // artifact exists in orgId, but we're requesting with otherOrgId token + header
        mockMvc.perform(get("/api/workspace/artifacts/" + artifactId)
                .header("Authorization", TestJwtHelper.bearer(otherToken))
                .header("X-Organization-Id", otherOrgId))
            .andExpect(status().isNotFound());
    }

    @Test
    void getArtifact_correctOrg_returns200WithAllFields() throws Exception {
        mockMvc.perform(get("/api/workspace/artifacts/" + artifactId)
                .header("Authorization", TestJwtHelper.bearer(token))
                .header("X-Organization-Id", orgId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id", is(artifactId)))
            .andExpect(jsonPath("$.organizationId", is(orgId)))
            .andExpect(jsonPath("$.artifactType", is("REQUIREMENT")))
            .andExpect(jsonPath("$.status", is("DRAFT")))
            .andExpect(jsonPath("$.aiAssisted", is(true)))
            .andExpect(jsonPath("$.sourceCheckupReportId").exists())
            .andExpect(jsonPath("$.sourceSection").exists())
            .andExpect(jsonPath("$.sourceItemIndex").exists())
            .andExpect(jsonPath("$.createdBy").exists())
            .andExpect(jsonPath("$.createdAt").exists());
    }

    // ── PATCH /api/workspace/artifacts/{id} ──────────────────────────────────

    @Test
    void patchArtifact_noJwt_returns401() throws Exception {
        mockMvc.perform(patch("/api/workspace/artifacts/" + artifactId)
                .header("X-Organization-Id", orgId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"New title\"}"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void patchArtifact_missingOrgHeader_returns403() throws Exception {
        mockMvc.perform(patch("/api/workspace/artifacts/" + artifactId)
                .header("Authorization", TestJwtHelper.bearer(token))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"New title\"}"))
            .andExpect(status().isForbidden());
    }

    @Test
    void patchArtifact_crossOrgId_returns404NotForbidden() throws Exception {
        mockMvc.perform(patch("/api/workspace/artifacts/" + artifactId)
                .header("Authorization", TestJwtHelper.bearer(otherToken))
                .header("X-Organization-Id", otherOrgId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"Attempt\"}"))
            .andExpect(status().isNotFound());

        // Verify artifact is unchanged
        String currentTitle = jdbc.queryForObject(
            "SELECT title FROM workspace_artifacts WHERE id = ?", String.class, artifactId);
        assertThat(currentTitle).isNotEqualTo("Attempt");
    }

    @Test
    void patchArtifact_unknownId_returns404() throws Exception {
        mockMvc.perform(patch("/api/workspace/artifacts/wa_nonexistent_999")
                .header("Authorization", TestJwtHelper.bearer(token))
                .header("X-Organization-Id", orgId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"New\"}"))
            .andExpect(status().isNotFound());
    }

    @Test
    void patchArtifact_validPatch_returns200WithUpdatedArtifact() throws Exception {
        mockMvc.perform(patch("/api/workspace/artifacts/" + artifactId)
                .header("Authorization", TestJwtHelper.bearer(token))
                .header("X-Organization-Id", orgId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"Título atualizado\",\"status\":\"REVIEWED\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.title", is("Título atualizado")))
            .andExpect(jsonPath("$.status", is("REVIEWED")));
    }

    @Test
    void patchArtifact_immutableFieldInBody_returns400WithPtBrMessage() throws Exception {
        mockMvc.perform(patch("/api/workspace/artifacts/" + artifactId)
                .header("Authorization", TestJwtHelper.bearer(token))
                .header("X-Organization-Id", orgId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"ok\",\"sourceCheckupReportId\":\"attempt\"}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value(containsString("sourceCheckupReportId")));
    }

    @Test
    void patchArtifact_invalidStatus_returns400() throws Exception {
        mockMvc.perform(patch("/api/workspace/artifacts/" + artifactId)
                .header("Authorization", TestJwtHelper.bearer(token))
                .header("X-Organization-Id", orgId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"INVALID_STATUS\"}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void patchArtifact_invalidDetails_returns400() throws Exception {
        // REQUIREMENT requires severity + originalText; omit both
        mockMvc.perform(patch("/api/workspace/artifacts/" + artifactId)
                .header("Authorization", TestJwtHelper.bearer(token))
                .header("X-Organization-Id", orgId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"details\":{\"irrelevantField\":\"value\"}}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void patchArtifact_successfulPatch_createsAuditLogEntry() throws Exception {
        mockMvc.perform(patch("/api/workspace/artifacts/" + artifactId)
                .header("Authorization", TestJwtHelper.bearer(token))
                .header("X-Organization-Id", orgId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"REVIEWED\"}"))
            .andExpect(status().isOk());

        int count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM audit_log WHERE entity_id = ? AND event_type = 'ARTIFACT_UPDATED'",
            Integer.class, artifactId);
        assertThat(count).isGreaterThanOrEqualTo(1);
    }

    @Test
    void patchArtifact_titleOnlyEdit_auditLogHasNoStatusFields() throws Exception {
        mockMvc.perform(patch("/api/workspace/artifacts/" + artifactId)
                .header("Authorization", TestJwtHelper.bearer(token))
                .header("X-Organization-Id", orgId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"Novo título apenas\"}"))
            .andExpect(status().isOk());

        String metadata = jdbc.queryForObject(
            "SELECT metadata FROM audit_log WHERE entity_id = ? AND event_type = 'ARTIFACT_UPDATED' ORDER BY created_at DESC LIMIT 1",
            String.class, artifactId);
        assertThat(metadata).contains("title");
        assertThat(metadata).doesNotContain("previousStatus");
        assertThat(metadata).doesNotContain("newStatus");
    }

    // ── Security cross-cutting (US4) ─────────────────────────────────────────

    @Test
    void allEndpoints_expiredJwt_returns401() throws Exception {
        String expiredToken = TestJwtHelper.expiredToken();

        mockMvc.perform(get("/api/workspace/artifacts")
                .header("Authorization", TestJwtHelper.bearer(expiredToken))
                .header("X-Organization-Id", orgId))
            .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/workspace/artifacts/" + artifactId)
                .header("Authorization", TestJwtHelper.bearer(expiredToken))
                .header("X-Organization-Id", orgId))
            .andExpect(status().isUnauthorized());

        mockMvc.perform(patch("/api/workspace/artifacts/" + artifactId)
                .header("Authorization", TestJwtHelper.bearer(expiredToken))
                .header("X-Organization-Id", orgId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"x\"}"))
            .andExpect(status().isUnauthorized());
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private void insertArtifact(String id, String org, String type, String status, String details) {
        jdbc.update("""
            INSERT INTO workspace_artifacts (
                id, organization_id, project_id, artifact_type,
                title, description, status, ai_assisted,
                source_checkup_report_id, source_section, source_item_index,
                details, created_by, created_at, updated_at
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """,
            id, org, null, type,
            "Título de teste", "Descrição de teste",
            status, true,
            "rpt_test_001", "missing_or_unclear_requirements", 0,
            details, "user_review_test",
            Timestamp.from(Instant.now()),
            Timestamp.from(Instant.now())
        );
    }
}
