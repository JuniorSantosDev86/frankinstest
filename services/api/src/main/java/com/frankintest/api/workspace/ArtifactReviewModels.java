package com.frankintest.api.workspace;

import com.frankintest.api.conversion.ConversionModels.WorkspaceArtifactRow;

import java.util.List;

public class ArtifactReviewModels {

    public enum ArtifactStatus {
        DRAFT, REVIEWED, ACCEPTED, ARCHIVED
    }

    public record ArtifactPatch(
        String title,
        String description,
        String status,
        String details
    ) {}

    public record ArtifactListFilters(
        String organizationId,
        String projectId,
        String sourceCheckupReportId,
        String artifactType,
        String status
    ) {}

    public record ArtifactListResponse(
        List<WorkspaceArtifactRow> artifacts,
        boolean limitReached
    ) {}

    public static class ArtifactNotFoundException extends RuntimeException {
        public ArtifactNotFoundException(String id) {
            super("Artefato não encontrado: " + id);
        }
    }

    public static class ArtifactValidationException extends RuntimeException {
        public final String field;
        public ArtifactValidationException(String field, String message) {
            super(message);
            this.field = field;
        }
    }

    public static class ImmutableFieldException extends RuntimeException {
        public final List<String> fields;
        public ImmutableFieldException(List<String> fields) {
            super("Os seguintes campos não podem ser alterados: " + String.join(", ", fields));
            this.fields = fields;
        }
    }
}
