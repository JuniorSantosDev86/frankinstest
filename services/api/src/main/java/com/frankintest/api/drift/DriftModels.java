package com.frankintest.api.drift;

import java.util.List;
import java.util.Map;

public class DriftModels {

    public enum DriftStatus {
        SEM_DRIFT,
        POSSIVEL_DRIFT,
        RASTREABILIDADE_INCOMPLETA,
        RELATORIO_INDISPONIVEL
    }

    public enum DriftSignalCode {
        EDITED_AFTER_CREATION,
        STATUS_CHANGED,
        INCOMPLETE_TRACEABILITY,
        SOURCE_UNAVAILABLE
    }

    public record DriftSignal(
        DriftSignalCode code,
        String reasonPtBr
    ) {}

    public record DriftResult(
        String artifactId,
        DriftStatus driftStatus,
        List<DriftSignal> signals
    ) {}

    public record MissingSection(
        String sectionName,
        int eligibleItemCount,
        int existingArtifactCount
    ) {}

    public record DriftSummary(
        String reportId,
        int totalAnalyzed,
        Map<DriftStatus, Integer> countByStatus,
        List<MissingSection> missingSections
    ) {}

    public static class DriftNotFoundException extends RuntimeException {
        public DriftNotFoundException(String message) {
            super(message);
        }
    }
}
