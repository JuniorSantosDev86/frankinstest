package com.frankintest.api.toolrecommendation;

import java.time.Instant;
import java.util.List;

public class ToolRecommendationModels {

    public enum ToolCategory {
        PERFORMANCE
    }

    public enum ToolPriority {
        PRIMARY, SECONDARY
    }

    public record RecommendedTool(
        String name,
        String url,
        ToolPriority priority,
        String rationale
    ) {}

    public record ToolRecommendationCategory(
        String categoryCode,
        String categoryLabel,
        List<RecommendedTool> tools,
        String justification,
        List<String> nextSteps
    ) {}

    public record ToolRecommendationResult(
        String reportId,
        Instant generatedAt,
        List<ToolRecommendationCategory> categories
    ) {}

    public record WorkspaceArtifactSaveResponse(
        String artifactId,
        String artifactType,
        String title,
        String status,
        Instant createdAt
    ) {}

    public static class ReportNotFoundException extends RuntimeException {
        public ReportNotFoundException(String reportId) {
            super("Relatório não encontrado: " + reportId);
        }
    }

    public static class ReportNotReadyException extends RuntimeException {
        public ReportNotReadyException(String reportId) {
            super("Relatório ainda não está concluído: " + reportId);
        }
    }
}
