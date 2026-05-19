package com.frankintest.api.conversion;

import java.time.Instant;
import java.util.List;

public class ConversionModels {

    public enum ArtifactType {
        REQUIREMENT, TEST_SCENARIO, TEST_CASE, RISK_ITEM, QA_ACTION
    }

    public enum ConversionIntent {
        CREATE_NEW, SKIP
    }

    // ─── Request / Response DTOs ───────────────────────────────────────────────

    public record ConversionSelectedItem(
        String sourceSection,
        int sourceItemIndex
    ) {}

    public record ConversionPreviewRequest(
        List<ConversionSelectedItem> selectedItems
    ) {}

    public record ConversionPreviewItem(
        String sourceSection,
        int sourceItemIndex,
        ArtifactType artifactType,
        String targetTable,
        String title,
        String description,
        boolean alreadyConverted,
        String existingArtifactId,
        String existingArtifactTable
    ) {}

    public record ConversionPreviewResponse(
        String reportId,
        String organizationId,
        String projectId,
        List<ConversionPreviewItem> items
    ) {}

    public record ConversionConfirmItem(
        String sourceSection,
        int sourceItemIndex,
        ConversionIntent intent
    ) {}

    public record ConversionConfirmRequest(
        List<ConversionConfirmItem> items
    ) {}

    public record CreatedArtifact(
        String artifactId,
        ArtifactType artifactType,
        String targetTable,
        String sourceSection,
        int sourceItemIndex
    ) {}

    public record ConversionResult(
        String reportId,
        List<CreatedArtifact> createdArtifacts,
        int skippedCount
    ) {}

    // ─── Internal row model ────────────────────────────────────────────────────

    public record WorkspaceArtifactRow(
        String id,
        String organizationId,
        String projectId,
        String artifactType,
        String title,
        String description,
        String status,
        boolean aiAssisted,
        String sourceCheckupReportId,
        String sourceAiRunId,
        String sourceSection,
        Integer sourceItemIndex,
        String details,
        String createdBy,
        Instant createdAt,
        Instant updatedAt
    ) {}

    public record ExistingArtifactRef(
        String artifactId,
        String tableName
    ) {}

    // ─── Exceptions ────────────────────────────────────────────────────────────

    public static class ConversionValidationException extends RuntimeException {
        public final String field;
        public ConversionValidationException(String field, String message) {
            super(message);
            this.field = field;
        }
    }

    public static class ReportNotFoundException extends RuntimeException {
        public ReportNotFoundException(String reportId) {
            super("Relatório de Check-up não encontrado: " + reportId);
        }
    }

    public static class ReportNotEligibleException extends RuntimeException {
        public ReportNotEligibleException() {
            super("Este Check-up ainda não foi concluído. Aguarde a finalização da análise de IA antes de converter os itens.");
        }
    }
}
