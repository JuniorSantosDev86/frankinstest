package com.frankintest.api.workspace;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.frankintest.api.audit.AuditService;
import com.frankintest.api.conversion.ConversionModels.WorkspaceArtifactRow;
import com.frankintest.api.conversion.WorkspaceArtifactRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ArtifactReviewServiceTest {

    @Mock WorkspaceArtifactRepository repository;
    @Mock AuditService auditService;

    ArtifactReviewService service;

    private static final String ORG = "org_test";
    private static final String USER = "user_test";
    private static final String ART_ID = "wa_test_001";

    @BeforeEach
    void setUp() {
        service = new ArtifactReviewService(repository, auditService, new ObjectMapper());
    }

    // ── listArtifacts ─────────────────────────────────────────────────────────

    @Test
    void listArtifacts_validOrg_returnsList() {
        when(repository.findByOrganization(ORG, null, null, null, null))
            .thenReturn(List.of(buildRow("DRAFT")));

        var result = service.listArtifacts(ORG,
            new ArtifactReviewModels.ArtifactListFilters(ORG, null, null, null, null));

        assertThat(result.artifacts()).hasSize(1);
        assertThat(result.limitReached()).isFalse();
    }

    @Test
    void listArtifacts_invalidArtifactType_throws400() {
        assertThatThrownBy(() -> service.listArtifacts(ORG,
            new ArtifactReviewModels.ArtifactListFilters(ORG, null, null, "INVALID_TYPE", null)))
            .isInstanceOf(ArtifactReviewModels.ArtifactValidationException.class)
            .hasMessageContaining("Tipo de artefato inválido");
    }

    @Test
    void listArtifacts_invalidStatus_throws400() {
        assertThatThrownBy(() -> service.listArtifacts(ORG,
            new ArtifactReviewModels.ArtifactListFilters(ORG, null, null, null, "INVALID_STATUS")))
            .isInstanceOf(ArtifactReviewModels.ArtifactValidationException.class)
            .hasMessageContaining("Status inválido");
    }

    @Test
    void listArtifacts_emptyResult_returnsEmptyList() {
        when(repository.findByOrganization(ORG, null, null, null, null))
            .thenReturn(List.of());

        var result = service.listArtifacts(ORG,
            new ArtifactReviewModels.ArtifactListFilters(ORG, null, null, null, null));

        assertThat(result.artifacts()).isEmpty();
        assertThat(result.limitReached()).isFalse();
    }

    @Test
    void listArtifacts_limitReached_whenCountExceeds200() {
        var rows = java.util.Collections.nCopies(200, buildRow("DRAFT"));
        when(repository.findByOrganization(ORG, null, null, null, null))
            .thenReturn(rows);
        when(repository.countByOrganization(ORG, null, null, null, null))
            .thenReturn(250L);

        var result = service.listArtifacts(ORG,
            new ArtifactReviewModels.ArtifactListFilters(ORG, null, null, null, null));

        assertThat(result.limitReached()).isTrue();
    }

    // ── getArtifact ───────────────────────────────────────────────────────────

    @Test
    void getArtifact_validIdCorrectOrg_returnsArtifact() {
        when(repository.findById(ART_ID, ORG)).thenReturn(Optional.of(buildRow("DRAFT")));

        var row = service.getArtifact(ART_ID, ORG);

        assertThat(row.id()).isEqualTo(ART_ID);
    }

    @Test
    void getArtifact_notFound_throws404() {
        when(repository.findById(ART_ID, ORG)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getArtifact(ART_ID, ORG))
            .isInstanceOf(ArtifactReviewModels.ArtifactNotFoundException.class);
    }

    @Test
    void getArtifact_crossOrgId_throws404NotForbidden() {
        // findById(id, orgId) uses AND organization_id = ? so cross-org returns empty
        when(repository.findById(ART_ID, "org_other")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getArtifact(ART_ID, "org_other"))
            .isInstanceOf(ArtifactReviewModels.ArtifactNotFoundException.class)
            .isNotInstanceOf(ArtifactReviewModels.ImmutableFieldException.class);
    }

    // ── updateArtifact: immutable field rejection ─────────────────────────────

    @Test
    void updateArtifact_withSourceCheckupReportId_throws400() {
        assertImmutableRejected(Map.of("sourceCheckupReportId", "attempt"));
    }

    @Test
    void updateArtifact_withAiAssisted_throws400() {
        assertImmutableRejected(Map.of("aiAssisted", true));
    }

    @Test
    void updateArtifact_withCreatedBy_throws400() {
        assertImmutableRejected(Map.of("createdBy", "someone"));
    }

    @Test
    void updateArtifact_withCreatedAt_throws400() {
        assertImmutableRejected(Map.of("createdAt", "2026-01-01"));
    }

    // ── updateArtifact: field validation ──────────────────────────────────────

    @Test
    void updateArtifact_emptyTitle_throws400() {
        when(repository.findById(ART_ID, ORG)).thenReturn(Optional.of(buildRow("DRAFT")));
        var patch = new ArtifactReviewModels.ArtifactPatch("", null, null, null);

        assertThatThrownBy(() ->
            service.updateArtifact(ART_ID, ORG, USER, Map.of("title", ""), patch))
            .isInstanceOf(ArtifactReviewModels.ArtifactValidationException.class)
            .hasMessageContaining("título não pode estar vazio");
    }

    @Test
    void updateArtifact_invalidStatus_throws400() {
        // Status validation happens after the artifact is fetched
        when(repository.findById(ART_ID, ORG)).thenReturn(Optional.of(buildRow("DRAFT")));
        var patch = new ArtifactReviewModels.ArtifactPatch(null, null, "UNKNOWN", null);

        assertThatThrownBy(() ->
            service.updateArtifact(ART_ID, ORG, USER, Map.of("status", "UNKNOWN"), patch))
            .isInstanceOf(ArtifactReviewModels.ArtifactValidationException.class)
            .hasMessageContaining("Status inválido");
    }

    // ── updateArtifact: audit events ──────────────────────────────────────────

    @Test
    void updateArtifact_titleOnlyEdit_auditHasNoStatusFields() throws Exception {
        var current = buildRow("DRAFT");
        when(repository.findById(ART_ID, ORG))
            .thenReturn(Optional.of(current))
            .thenReturn(Optional.of(buildRowWithTitle("Novo título")));
        when(repository.updateEditableFields(any(), any(), any(), any(), any(), any()))
            .thenReturn(true);

        var patch = new ArtifactReviewModels.ArtifactPatch("Novo título", null, null, null);
        service.updateArtifact(ART_ID, ORG, USER, Map.of("title", "Novo título"), patch);

        var captor = ArgumentCaptor.forClass(AuditService.AuditEvent.class);
        verify(auditService).record(captor.capture());
        var metadata = captor.getValue().metadata();
        assertThat(metadata).contains("\"changedFields\"");
        assertThat(metadata).contains("title");
        assertThat(metadata).doesNotContain("previousStatus");
        assertThat(metadata).doesNotContain("newStatus");
    }

    @Test
    void updateArtifact_statusChange_auditHasPreviousAndNewStatus() throws Exception {
        var current = buildRow("DRAFT");
        when(repository.findById(ART_ID, ORG))
            .thenReturn(Optional.of(current))
            .thenReturn(Optional.of(buildRow("REVIEWED")));
        when(repository.updateEditableFields(any(), any(), any(), any(), any(), any()))
            .thenReturn(true);

        var patch = new ArtifactReviewModels.ArtifactPatch(null, null, "REVIEWED", null);
        service.updateArtifact(ART_ID, ORG, USER, Map.of("status", "REVIEWED"), patch);

        var captor = ArgumentCaptor.forClass(AuditService.AuditEvent.class);
        verify(auditService).record(captor.capture());
        var metadata = captor.getValue().metadata();
        assertThat(metadata).contains("previousStatus");
        assertThat(metadata).contains("DRAFT");
        assertThat(metadata).contains("newStatus");
        assertThat(metadata).contains("REVIEWED");
    }

    // ── updateArtifact: details validation ───────────────────────────────────

    @Test
    void updateArtifact_invalidDetailsForRequirement_throws400() {
        // missing required 'severity' field — validate directly
        var rawDetails = Map.of("originalText", "some text");

        assertThatThrownBy(() -> service.validateDetails("REQUIREMENT", rawDetails))
            .isInstanceOf(ArtifactReviewModels.ArtifactValidationException.class)
            .hasMessageContaining("severity");
    }

    @Test
    void updateArtifact_invalidDetailsForRiskItem_throws400() {
        var rawDetails = Map.of("severity", "HIGH", "originalText", "text");
        // missing riskCategory

        assertThatThrownBy(() -> service.validateDetails("RISK_ITEM", rawDetails))
            .isInstanceOf(ArtifactReviewModels.ArtifactValidationException.class)
            .hasMessageContaining("riskCategory");
    }

    @Test
    void updateArtifact_invalidDetailsForQaAction_throws400() {
        var rawDetails = Map.of("priority", "HIGH", "originalText", "text");
        // missing action and rationale

        assertThatThrownBy(() -> service.validateDetails("QA_ACTION", rawDetails))
            .isInstanceOf(ArtifactReviewModels.ArtifactValidationException.class)
            .hasMessageContaining("action");
    }

    @Test
    void updateArtifact_detailsOmitted_existingDetailsUnchanged() throws Exception {
        var current = buildRow("DRAFT");
        when(repository.findById(ART_ID, ORG))
            .thenReturn(Optional.of(current))
            .thenReturn(Optional.of(current));
        when(repository.updateEditableFields(any(), any(), isNull(), any(), any(), isNull()))
            .thenReturn(true);

        service.updateArtifact(ART_ID, ORG, USER, Map.of(),
            new ArtifactReviewModels.ArtifactPatch(null, null, null, null));

        verify(repository).updateEditableFields(ART_ID, ORG, null, null, null, null);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private void assertImmutableRejected(Map<String, Object> rawPatch) {
        assertThatThrownBy(() ->
            service.updateArtifact(ART_ID, ORG, USER, rawPatch,
                new ArtifactReviewModels.ArtifactPatch(null, null, null, null)))
            .isInstanceOf(ArtifactReviewModels.ImmutableFieldException.class);
    }

    private WorkspaceArtifactRow buildRow(String status) {
        return new WorkspaceArtifactRow(
            ART_ID, ORG, null, "REQUIREMENT",
            "Título original", "Descrição original",
            status, true,
            "rpt_001", "missing_or_unclear_requirements", 0,
            "{\"severity\":\"HIGH\",\"originalText\":\"text\"}",
            USER, Instant.now(), Instant.now()
        );
    }

    private WorkspaceArtifactRow buildRowWithTitle(String title) {
        return new WorkspaceArtifactRow(
            ART_ID, ORG, null, "REQUIREMENT",
            title, "Descrição original",
            "DRAFT", true,
            "rpt_001", "missing_or_unclear_requirements", 0,
            "{\"severity\":\"HIGH\",\"originalText\":\"text\"}",
            USER, Instant.now(), Instant.now()
        );
    }
}
