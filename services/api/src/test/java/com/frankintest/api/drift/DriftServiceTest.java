package com.frankintest.api.drift;

import com.frankintest.api.conversion.ConversionEligibility;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DriftServiceTest {

    @Mock private DriftRepository driftRepository;

    private DriftService driftService;

    private static final String ORG_ID = "org_test";
    private static final String ARTIFACT_ID = "art_001";
    private static final String REPORT_ID = "rpt_001";

    @BeforeEach
    void setUp() {
        driftService = new DriftService(driftRepository);
    }

    // ── 404 cases ──────────────────────────────────────────────────────────────

    @Test
    void artifactNotFoundInOrg_throws404() {
        when(driftRepository.findArtifactById(ARTIFACT_ID, ORG_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> driftService.calculateArtifactDrift(ARTIFACT_ID, ORG_ID))
            .isInstanceOf(DriftModels.DriftNotFoundException.class);
    }

    @Test
    void artifactWithoutSourceCheckupReportId_throws404() {
        var artifact = artifactRow(ARTIFACT_ID, null, "req", null, "DRAFT",
            Instant.parse("2024-01-01T10:00:00Z"), Instant.parse("2024-01-01T10:00:00Z"));
        when(driftRepository.findArtifactById(ARTIFACT_ID, ORG_ID)).thenReturn(Optional.of(artifact));

        assertThatThrownBy(() -> driftService.calculateArtifactDrift(ARTIFACT_ID, ORG_ID))
            .isInstanceOf(DriftModels.DriftNotFoundException.class);
    }

    // ── SEM_DRIFT ──────────────────────────────────────────────────────────────

    @Test
    void noDriftSignals_returnsSemDrift() {
        Instant t = Instant.parse("2024-01-01T10:00:00Z");
        var artifact = artifactRow(ARTIFACT_ID, REPORT_ID, "req", 0, "DRAFT", t, t);
        when(driftRepository.findArtifactById(ARTIFACT_ID, ORG_ID)).thenReturn(Optional.of(artifact));
        when(driftRepository.findReportById(REPORT_ID, ORG_ID))
            .thenReturn(Optional.of(reportRow(REPORT_ID)));

        DriftModels.DriftResult result = driftService.calculateArtifactDrift(ARTIFACT_ID, ORG_ID);

        assertThat(result.driftStatus()).isEqualTo(DriftModels.DriftStatus.SEM_DRIFT);
        assertThat(result.signals()).isEmpty();
        assertThat(result.artifactId()).isEqualTo(ARTIFACT_ID);
    }

    // ── EDITED_AFTER_CREATION ──────────────────────────────────────────────────

    @Test
    void updatedAtAfterCreatedAt_triggersEditedAfterCreation() {
        Instant created = Instant.parse("2024-01-01T10:00:00Z");
        Instant updated = Instant.parse("2024-01-01T11:00:00Z");
        var artifact = artifactRow(ARTIFACT_ID, REPORT_ID, "req", 0, "DRAFT", created, updated);
        when(driftRepository.findArtifactById(ARTIFACT_ID, ORG_ID)).thenReturn(Optional.of(artifact));
        when(driftRepository.findReportById(REPORT_ID, ORG_ID))
            .thenReturn(Optional.of(reportRow(REPORT_ID)));

        DriftModels.DriftResult result = driftService.calculateArtifactDrift(ARTIFACT_ID, ORG_ID);

        assertThat(result.driftStatus()).isEqualTo(DriftModels.DriftStatus.POSSIVEL_DRIFT);
        assertThat(signalCodes(result)).contains(DriftModels.DriftSignalCode.EDITED_AFTER_CREATION);
    }

    @Test
    void updatedAtEqualsCreatedAt_noEditedSignal() {
        Instant t = Instant.parse("2024-01-01T10:00:00Z");
        var artifact = artifactRow(ARTIFACT_ID, REPORT_ID, "req", 0, "DRAFT", t, t);
        when(driftRepository.findArtifactById(ARTIFACT_ID, ORG_ID)).thenReturn(Optional.of(artifact));
        when(driftRepository.findReportById(REPORT_ID, ORG_ID))
            .thenReturn(Optional.of(reportRow(REPORT_ID)));

        DriftModels.DriftResult result = driftService.calculateArtifactDrift(ARTIFACT_ID, ORG_ID);

        assertThat(signalCodes(result)).doesNotContain(DriftModels.DriftSignalCode.EDITED_AFTER_CREATION);
    }

    // ── STATUS_CHANGED ─────────────────────────────────────────────────────────

    @Test
    void statusNotDraft_triggersStatusChanged() {
        Instant t = Instant.parse("2024-01-01T10:00:00Z");
        var artifact = artifactRow(ARTIFACT_ID, REPORT_ID, "req", 0, "REVIEWED", t, t);
        when(driftRepository.findArtifactById(ARTIFACT_ID, ORG_ID)).thenReturn(Optional.of(artifact));
        when(driftRepository.findReportById(REPORT_ID, ORG_ID))
            .thenReturn(Optional.of(reportRow(REPORT_ID)));

        DriftModels.DriftResult result = driftService.calculateArtifactDrift(ARTIFACT_ID, ORG_ID);

        assertThat(result.driftStatus()).isEqualTo(DriftModels.DriftStatus.POSSIVEL_DRIFT);
        assertThat(signalCodes(result)).contains(DriftModels.DriftSignalCode.STATUS_CHANGED);
    }

    @Test
    void statusDraft_noStatusChangedSignal() {
        Instant t = Instant.parse("2024-01-01T10:00:00Z");
        var artifact = artifactRow(ARTIFACT_ID, REPORT_ID, "req", 0, "DRAFT", t, t);
        when(driftRepository.findArtifactById(ARTIFACT_ID, ORG_ID)).thenReturn(Optional.of(artifact));
        when(driftRepository.findReportById(REPORT_ID, ORG_ID))
            .thenReturn(Optional.of(reportRow(REPORT_ID)));

        DriftModels.DriftResult result = driftService.calculateArtifactDrift(ARTIFACT_ID, ORG_ID);

        assertThat(signalCodes(result)).doesNotContain(DriftModels.DriftSignalCode.STATUS_CHANGED);
    }

    // ── INCOMPLETE_TRACEABILITY ────────────────────────────────────────────────

    @Test
    void sourceCheckupReportIdPresentAndSourceItemIndexNull_triggersIncompleteTraceability() {
        Instant t = Instant.parse("2024-01-01T10:00:00Z");
        // sourceItemIndex = null triggers INCOMPLETE_TRACEABILITY
        var artifact = artifactRow(ARTIFACT_ID, REPORT_ID, "req", null, "DRAFT", t, t);
        when(driftRepository.findArtifactById(ARTIFACT_ID, ORG_ID)).thenReturn(Optional.of(artifact));
        when(driftRepository.findReportById(REPORT_ID, ORG_ID))
            .thenReturn(Optional.of(reportRow(REPORT_ID)));

        DriftModels.DriftResult result = driftService.calculateArtifactDrift(ARTIFACT_ID, ORG_ID);

        assertThat(result.driftStatus()).isEqualTo(DriftModels.DriftStatus.RASTREABILIDADE_INCOMPLETA);
        assertThat(signalCodes(result)).contains(DriftModels.DriftSignalCode.INCOMPLETE_TRACEABILITY);
    }

    @Test
    void sourceItemIndexPresent_noIncompleteTraceabilitySignal() {
        Instant t = Instant.parse("2024-01-01T10:00:00Z");
        var artifact = artifactRow(ARTIFACT_ID, REPORT_ID, "req", 0, "DRAFT", t, t);
        when(driftRepository.findArtifactById(ARTIFACT_ID, ORG_ID)).thenReturn(Optional.of(artifact));
        when(driftRepository.findReportById(REPORT_ID, ORG_ID))
            .thenReturn(Optional.of(reportRow(REPORT_ID)));

        DriftModels.DriftResult result = driftService.calculateArtifactDrift(ARTIFACT_ID, ORG_ID);

        assertThat(signalCodes(result)).doesNotContain(DriftModels.DriftSignalCode.INCOMPLETE_TRACEABILITY);
    }

    // ── SOURCE_UNAVAILABLE ─────────────────────────────────────────────────────

    @Test
    void reportNotFoundInOrg_triggersSourceUnavailable() {
        Instant t = Instant.parse("2024-01-01T10:00:00Z");
        var artifact = artifactRow(ARTIFACT_ID, REPORT_ID, "req", 0, "DRAFT", t, t);
        when(driftRepository.findArtifactById(ARTIFACT_ID, ORG_ID)).thenReturn(Optional.of(artifact));
        when(driftRepository.findReportById(REPORT_ID, ORG_ID)).thenReturn(Optional.empty());

        DriftModels.DriftResult result = driftService.calculateArtifactDrift(ARTIFACT_ID, ORG_ID);

        assertThat(result.driftStatus()).isEqualTo(DriftModels.DriftStatus.RELATORIO_INDISPONIVEL);
        assertThat(signalCodes(result)).contains(DriftModels.DriftSignalCode.SOURCE_UNAVAILABLE);
    }

    // ── Severity hierarchy ─────────────────────────────────────────────────────

    @Test
    void sourceUnavailableAndIncompleteTraceability_statusIsRelatorioIndisponivel() {
        Instant t = Instant.parse("2024-01-01T10:00:00Z");
        // sourceItemIndex null = INCOMPLETE_TRACEABILITY; report absent = SOURCE_UNAVAILABLE
        var artifact = artifactRow(ARTIFACT_ID, REPORT_ID, "req", null, "DRAFT", t, t);
        when(driftRepository.findArtifactById(ARTIFACT_ID, ORG_ID)).thenReturn(Optional.of(artifact));
        when(driftRepository.findReportById(REPORT_ID, ORG_ID)).thenReturn(Optional.empty());

        DriftModels.DriftResult result = driftService.calculateArtifactDrift(ARTIFACT_ID, ORG_ID);

        assertThat(result.driftStatus()).isEqualTo(DriftModels.DriftStatus.RELATORIO_INDISPONIVEL);
        assertThat(signalCodes(result)).contains(
            DriftModels.DriftSignalCode.SOURCE_UNAVAILABLE,
            DriftModels.DriftSignalCode.INCOMPLETE_TRACEABILITY
        );
    }

    @Test
    void incompleteTraceabilityAndPossibleDrift_statusIsRastreabilidadeIncompleta() {
        Instant created = Instant.parse("2024-01-01T10:00:00Z");
        Instant updated = Instant.parse("2024-01-01T11:00:00Z");
        // sourceItemIndex null = INCOMPLETE_TRACEABILITY; updatedAt > createdAt = EDITED
        var artifact = artifactRow(ARTIFACT_ID, REPORT_ID, "req", null, "DRAFT", created, updated);
        when(driftRepository.findArtifactById(ARTIFACT_ID, ORG_ID)).thenReturn(Optional.of(artifact));
        when(driftRepository.findReportById(REPORT_ID, ORG_ID))
            .thenReturn(Optional.of(reportRow(REPORT_ID)));

        DriftModels.DriftResult result = driftService.calculateArtifactDrift(ARTIFACT_ID, ORG_ID);

        assertThat(result.driftStatus()).isEqualTo(DriftModels.DriftStatus.RASTREABILIDADE_INCOMPLETA);
        assertThat(signalCodes(result)).contains(
            DriftModels.DriftSignalCode.INCOMPLETE_TRACEABILITY,
            DriftModels.DriftSignalCode.EDITED_AFTER_CREATION
        );
    }

    @Test
    void editedAndStatusChanged_statusIsPossivelDrift() {
        Instant created = Instant.parse("2024-01-01T10:00:00Z");
        Instant updated = Instant.parse("2024-01-01T11:00:00Z");
        var artifact = artifactRow(ARTIFACT_ID, REPORT_ID, "req", 0, "ACCEPTED", created, updated);
        when(driftRepository.findArtifactById(ARTIFACT_ID, ORG_ID)).thenReturn(Optional.of(artifact));
        when(driftRepository.findReportById(REPORT_ID, ORG_ID))
            .thenReturn(Optional.of(reportRow(REPORT_ID)));

        DriftModels.DriftResult result = driftService.calculateArtifactDrift(ARTIFACT_ID, ORG_ID);

        assertThat(result.driftStatus()).isEqualTo(DriftModels.DriftStatus.POSSIVEL_DRIFT);
        assertThat(signalCodes(result)).contains(
            DriftModels.DriftSignalCode.EDITED_AFTER_CREATION,
            DriftModels.DriftSignalCode.STATUS_CHANGED
        );
    }

    // ── reasonPtBr messages ────────────────────────────────────────────────────

    @Test
    void editedAfterCreation_hasCorrectReasonPtBr() {
        Instant created = Instant.parse("2024-01-01T10:00:00Z");
        Instant updated = Instant.parse("2024-01-01T11:00:00Z");
        var artifact = artifactRow(ARTIFACT_ID, REPORT_ID, "req", 0, "DRAFT", created, updated);
        when(driftRepository.findArtifactById(ARTIFACT_ID, ORG_ID)).thenReturn(Optional.of(artifact));
        when(driftRepository.findReportById(REPORT_ID, ORG_ID))
            .thenReturn(Optional.of(reportRow(REPORT_ID)));

        DriftModels.DriftResult result = driftService.calculateArtifactDrift(ARTIFACT_ID, ORG_ID);
        String reason = signalReason(result, DriftModels.DriftSignalCode.EDITED_AFTER_CREATION);

        assertThat(reason).isEqualTo("Título ou descrição editados após criação");
    }

    @Test
    void statusChanged_hasCorrectReasonPtBr() {
        Instant t = Instant.parse("2024-01-01T10:00:00Z");
        var artifact = artifactRow(ARTIFACT_ID, REPORT_ID, "req", 0, "REVIEWED", t, t);
        when(driftRepository.findArtifactById(ARTIFACT_ID, ORG_ID)).thenReturn(Optional.of(artifact));
        when(driftRepository.findReportById(REPORT_ID, ORG_ID))
            .thenReturn(Optional.of(reportRow(REPORT_ID)));

        DriftModels.DriftResult result = driftService.calculateArtifactDrift(ARTIFACT_ID, ORG_ID);
        String reason = signalReason(result, DriftModels.DriftSignalCode.STATUS_CHANGED);

        assertThat(reason).isEqualTo("Status alterado desde a criação");
    }

    // ── calculateReportDrift — US2 tests ──────────────────────────────────────

    @Test
    void reportNotFoundInOrg_reportDrift_throws404() {
        when(driftRepository.findReportById(REPORT_ID, ORG_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> driftService.calculateReportDrift(REPORT_ID, ORG_ID))
            .isInstanceOf(DriftModels.DriftNotFoundException.class);
    }

    @Test
    void reportWithNoArtifacts_returnsTotalZeroAndMissingSections() {
        when(driftRepository.findReportById(REPORT_ID, ORG_ID))
            .thenReturn(Optional.of(reportRowWithCounts(REPORT_ID, 2, 1, 0, 0, 0, 0)));
        // No artifacts in any table
        when(driftRepository.findArtifactsBySourceReport(REPORT_ID, ORG_ID)).thenReturn(List.of());
        mockAllSectionCounts(REPORT_ID, ORG_ID, 0);

        DriftModels.DriftSummary summary = driftService.calculateReportDrift(REPORT_ID, ORG_ID);

        assertThat(summary.reportId()).isEqualTo(REPORT_ID);
        assertThat(summary.totalAnalyzed()).isEqualTo(0);
        assertThat(summary.countByStatus().values().stream().mapToInt(Integer::intValue).sum()).isEqualTo(0);
        assertThat(summary.missingSections()).isNotEmpty();
    }

    @Test
    void reportWithArtifacts_countsByStatusCorrect() {
        Instant t = Instant.parse("2024-01-01T10:00:00Z");
        Instant later = Instant.parse("2024-01-01T11:00:00Z");
        var artNoDrift = artifactRow("a1", REPORT_ID, "req", 0, "DRAFT", t, t);
        var artEdited = artifactRow("a2", REPORT_ID, "req", 1, "DRAFT", t, later);

        when(driftRepository.findReportById(REPORT_ID, ORG_ID))
            .thenReturn(Optional.of(reportRow(REPORT_ID)));
        when(driftRepository.findArtifactsBySourceReport(REPORT_ID, ORG_ID))
            .thenReturn(List.of(artNoDrift, artEdited));
        // findReportById per artifact (for SOURCE_UNAVAILABLE check) — already set up above
        mockAllSectionCounts(REPORT_ID, ORG_ID, 0);

        DriftModels.DriftSummary summary = driftService.calculateReportDrift(REPORT_ID, ORG_ID);

        assertThat(summary.totalAnalyzed()).isEqualTo(2);
        assertThat(summary.countByStatus().get(DriftModels.DriftStatus.SEM_DRIFT)).isEqualTo(1);
        assertThat(summary.countByStatus().get(DriftModels.DriftStatus.POSSIVEL_DRIFT)).isEqualTo(1);
    }

    @Test
    void reportDrift_missingSectionsDetected_whenEligibleItemsNotConverted() {
        when(driftRepository.findReportById(REPORT_ID, ORG_ID))
            .thenReturn(Optional.of(reportRowWithCounts(REPORT_ID, 2, 1, 0, 0, 0, 0)));
        when(driftRepository.findArtifactsBySourceReport(REPORT_ID, ORG_ID)).thenReturn(List.of());
        mockAllSectionCounts(REPORT_ID, ORG_ID, 0);

        DriftModels.DriftSummary summary = driftService.calculateReportDrift(REPORT_ID, ORG_ID);

        // missing_or_unclear_requirements: 2 eligible, 0 existing → missing
        assertThat(summary.missingSections())
            .anyMatch(s -> s.sectionName().equals("missing_or_unclear_requirements")
                && s.eligibleItemCount() == 2
                && s.existingArtifactCount() == 0);
    }

    @Test
    void reportDrift_orgIsolation_differentOrgFindsNothing() {
        when(driftRepository.findReportById(REPORT_ID, "org_other")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> driftService.calculateReportDrift(REPORT_ID, "org_other"))
            .isInstanceOf(DriftModels.DriftNotFoundException.class);
    }

    // ── US3: hierarchy combinations ────────────────────────────────────────────

    @Test
    void allSignalsActive_highestSeverityWins_relatorioIndisponivel() {
        Instant created = Instant.parse("2024-01-01T10:00:00Z");
        Instant updated = Instant.parse("2024-01-01T11:00:00Z");
        // sourceItemIndex null + updated after creation + non-DRAFT status + report unavailable
        var artifact = artifactRow(ARTIFACT_ID, REPORT_ID, "req", null, "ACCEPTED", created, updated);
        when(driftRepository.findArtifactById(ARTIFACT_ID, ORG_ID)).thenReturn(Optional.of(artifact));
        when(driftRepository.findReportById(REPORT_ID, ORG_ID)).thenReturn(Optional.empty());

        DriftModels.DriftResult result = driftService.calculateArtifactDrift(ARTIFACT_ID, ORG_ID);

        assertThat(result.driftStatus()).isEqualTo(DriftModels.DriftStatus.RELATORIO_INDISPONIVEL);
        assertThat(result.signals()).hasSizeGreaterThanOrEqualTo(3);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private DriftRepository.ArtifactRow artifactRow(String id, String reportId, String section,
                                                     Integer itemIndex, String status,
                                                     Instant createdAt, Instant updatedAt) {
        return new DriftRepository.ArtifactRow(id, ORG_ID, reportId, section, itemIndex,
            status, createdAt, updatedAt);
    }

    private DriftRepository.ReportRow reportRow(String id) {
        return new DriftRepository.ReportRow(id, ORG_ID, 0, 0, 0, 0, 0, 0);
    }

    private DriftRepository.ReportRow reportRowWithCounts(String id,
            int missingOrUnclearReqs, int qualityRisks, int uxRisks,
            int releaseNotes, int testScenarios, int testCases) {
        return new DriftRepository.ReportRow(id, ORG_ID,
            missingOrUnclearReqs, qualityRisks, uxRisks, releaseNotes, testScenarios, testCases);
    }

    private void mockAllSectionCounts(String reportId, String orgId, int count) {
        // Use lenient to avoid UnnecessaryStubbing when only some table queries are triggered
        lenient().when(driftRepository.countArtifactsInWorkspaceBySection(eq(reportId), anyString(), eq(orgId)))
            .thenReturn(count);
        lenient().when(driftRepository.countArtifactsInTestScenariosBySection(eq(reportId), anyString(), eq(orgId)))
            .thenReturn(count);
        lenient().when(driftRepository.countArtifactsInTestCasesBySection(eq(reportId), anyString(), eq(orgId)))
            .thenReturn(count);
    }

    private List<DriftModels.DriftSignalCode> signalCodes(DriftModels.DriftResult result) {
        return result.signals().stream().map(DriftModels.DriftSignal::code).toList();
    }

    private String signalReason(DriftModels.DriftResult result, DriftModels.DriftSignalCode code) {
        return result.signals().stream()
            .filter(s -> s.code() == code)
            .map(DriftModels.DriftSignal::reasonPtBr)
            .findFirst()
            .orElse(null);
    }
}
