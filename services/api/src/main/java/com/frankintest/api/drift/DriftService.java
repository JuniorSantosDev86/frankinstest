package com.frankintest.api.drift;

import com.frankintest.api.conversion.ConversionEligibility;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class DriftService {

    private final DriftRepository driftRepository;

    public DriftService(DriftRepository driftRepository) {
        this.driftRepository = driftRepository;
    }

    // ── US1: artifact drift ────────────────────────────────────────────────────

    public DriftModels.DriftResult calculateArtifactDrift(String artifactId, String organizationId) {
        DriftRepository.ArtifactRow artifact = driftRepository.findArtifactById(artifactId, organizationId)
            .orElseThrow(() -> new DriftModels.DriftNotFoundException("Artefato não encontrado: " + artifactId));

        if (artifact.sourceCheckupReportId() == null || artifact.sourceCheckupReportId().isBlank()) {
            throw new DriftModels.DriftNotFoundException(
                "Artefato não é derivado de Check-up: " + artifactId);
        }

        List<DriftModels.DriftSignal> signals = new ArrayList<>();

        // SOURCE_UNAVAILABLE — report not accessible in org
        Optional<DriftRepository.ReportRow> reportOpt =
            driftRepository.findReportById(artifact.sourceCheckupReportId(), organizationId);
        if (reportOpt.isEmpty()) {
            signals.add(new DriftModels.DriftSignal(
                DriftModels.DriftSignalCode.SOURCE_UNAVAILABLE,
                "Relatório de origem indisponível"
            ));
        }

        // INCOMPLETE_TRACEABILITY — sourceCheckupReportId present but sourceItemIndex absent
        if (artifact.sourceItemIndex() == null) {
            signals.add(new DriftModels.DriftSignal(
                DriftModels.DriftSignalCode.INCOMPLETE_TRACEABILITY,
                "Campos de rastreabilidade ausentes"
            ));
        }

        // EDITED_AFTER_CREATION — updatedAt > createdAt
        if (isEdited(artifact.createdAt(), artifact.updatedAt())) {
            signals.add(new DriftModels.DriftSignal(
                DriftModels.DriftSignalCode.EDITED_AFTER_CREATION,
                "Título ou descrição editados após criação"
            ));
        }

        // STATUS_CHANGED — status != DRAFT
        if (!"DRAFT".equalsIgnoreCase(artifact.status())) {
            signals.add(new DriftModels.DriftSignal(
                DriftModels.DriftSignalCode.STATUS_CHANGED,
                "Status alterado desde a criação"
            ));
        }

        DriftModels.DriftStatus status = aggregateStatus(signals);
        return new DriftModels.DriftResult(artifactId, status, signals);
    }

    // ── US2: report drift summary ──────────────────────────────────────────────

    public DriftModels.DriftSummary calculateReportDrift(String reportId, String organizationId) {
        driftRepository.findReportById(reportId, organizationId)
            .orElseThrow(() -> new DriftModels.DriftNotFoundException(
                "Relatório não encontrado: " + reportId));

        List<DriftRepository.ArtifactRow> artifacts =
            driftRepository.findArtifactsBySourceReport(reportId, organizationId);

        Map<DriftModels.DriftStatus, Integer> countByStatus = buildCountMap();

        for (DriftRepository.ArtifactRow artifact : artifacts) {
            // Compute individual drift using the same logic (re-use calculateArtifactDrift
            // but inline to avoid double-fetch of artifact by ID)
            DriftModels.DriftResult result = calculateArtifactDriftForRow(artifact, organizationId);
            countByStatus.merge(result.driftStatus(), 1, Integer::sum);
        }

        List<DriftModels.MissingSection> missingSections =
            calculateMissingSections(reportId, organizationId);

        return new DriftModels.DriftSummary(reportId, artifacts.size(), countByStatus, missingSections);
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private DriftModels.DriftResult calculateArtifactDriftForRow(
            DriftRepository.ArtifactRow artifact, String organizationId) {

        List<DriftModels.DriftSignal> signals = new ArrayList<>();

        Optional<DriftRepository.ReportRow> reportOpt =
            driftRepository.findReportById(artifact.sourceCheckupReportId(), organizationId);
        if (reportOpt.isEmpty()) {
            signals.add(new DriftModels.DriftSignal(
                DriftModels.DriftSignalCode.SOURCE_UNAVAILABLE, "Relatório de origem indisponível"));
        }

        if (artifact.sourceItemIndex() == null) {
            signals.add(new DriftModels.DriftSignal(
                DriftModels.DriftSignalCode.INCOMPLETE_TRACEABILITY, "Campos de rastreabilidade ausentes"));
        }

        if (isEdited(artifact.createdAt(), artifact.updatedAt())) {
            signals.add(new DriftModels.DriftSignal(
                DriftModels.DriftSignalCode.EDITED_AFTER_CREATION,
                "Título ou descrição editados após criação"));
        }

        if (!"DRAFT".equalsIgnoreCase(artifact.status())) {
            signals.add(new DriftModels.DriftSignal(
                DriftModels.DriftSignalCode.STATUS_CHANGED, "Status alterado desde a criação"));
        }

        return new DriftModels.DriftResult(artifact.id(), aggregateStatus(signals), signals);
    }

    private List<DriftModels.MissingSection> calculateMissingSections(
            String reportId, String organizationId) {

        DriftRepository.ReportRow report =
            driftRepository.findReportById(reportId, organizationId).orElseThrow();

        List<DriftModels.MissingSection> missing = new ArrayList<>();

        for (ConversionEligibility.SectionMapping mapping : ConversionEligibility.ELIGIBLE_SECTIONS) {
            int eligible = eligibleCount(report, mapping.sectionName());
            if (eligible == 0) continue;

            int existing = countExistingArtifacts(reportId, mapping.sectionName(),
                mapping.targetTable(), organizationId);

            if (existing < eligible) {
                missing.add(new DriftModels.MissingSection(mapping.sectionName(), eligible, existing));
            }
        }
        return missing;
    }

    private int eligibleCount(DriftRepository.ReportRow report, String sectionName) {
        return switch (sectionName) {
            case "missing_or_unclear_requirements" -> report.missingOrUnclearRequirementsCount();
            case "quality_risks"                   -> report.qualityRisksCount();
            case "ux_product_risks"                -> report.uxProductRisksCount();
            case "release_readiness_notes"         -> report.releaseReadinessNotesCount();
            case "suggested_test_scenarios"        -> report.suggestedTestScenariosCount();
            case "suggested_test_cases"            -> report.suggestedTestCasesCount();
            default -> 0;
        };
    }

    private int countExistingArtifacts(String reportId, String sectionName,
                                        String targetTable, String organizationId) {
        return switch (targetTable) {
            case "test_scenarios" ->
                driftRepository.countArtifactsInTestScenariosBySection(reportId, sectionName, organizationId);
            case "test_cases" ->
                driftRepository.countArtifactsInTestCasesBySection(reportId, sectionName, organizationId);
            default ->
                driftRepository.countArtifactsInWorkspaceBySection(reportId, sectionName, organizationId);
        };
    }

    private boolean isEdited(Instant createdAt, Instant updatedAt) {
        if (createdAt == null || updatedAt == null) return false;
        return updatedAt.isAfter(createdAt);
    }

    private DriftModels.DriftStatus aggregateStatus(List<DriftModels.DriftSignal> signals) {
        if (signals.isEmpty()) return DriftModels.DriftStatus.SEM_DRIFT;
        // Hierarchy: SOURCE_UNAVAILABLE > INCOMPLETE_TRACEABILITY > EDITED/STATUS_CHANGED
        boolean hasSourceUnavailable = signals.stream()
            .anyMatch(s -> s.code() == DriftModels.DriftSignalCode.SOURCE_UNAVAILABLE);
        boolean hasIncomplete = signals.stream()
            .anyMatch(s -> s.code() == DriftModels.DriftSignalCode.INCOMPLETE_TRACEABILITY);
        if (hasSourceUnavailable) return DriftModels.DriftStatus.RELATORIO_INDISPONIVEL;
        if (hasIncomplete)        return DriftModels.DriftStatus.RASTREABILIDADE_INCOMPLETA;
        return DriftModels.DriftStatus.POSSIVEL_DRIFT;
    }

    private Map<DriftModels.DriftStatus, Integer> buildCountMap() {
        Map<DriftModels.DriftStatus, Integer> map = new EnumMap<>(DriftModels.DriftStatus.class);
        for (DriftModels.DriftStatus s : DriftModels.DriftStatus.values()) {
            map.put(s, 0);
        }
        return map;
    }
}
