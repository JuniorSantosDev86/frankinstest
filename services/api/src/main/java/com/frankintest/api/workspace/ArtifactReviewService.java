package com.frankintest.api.workspace;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.frankintest.api.audit.AuditService;
import com.frankintest.api.conversion.ConversionModels.WorkspaceArtifactRow;
import com.frankintest.api.conversion.WorkspaceArtifactRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class ArtifactReviewService {

    static final int LIST_LIMIT = 200;

    private static final Set<String> IMMUTABLE_FIELDS = Set.of(
        "id", "organizationId", "projectId", "artifactType",
        "aiAssisted", "sourceCheckupReportId", "sourceAiRunId", "sourceSection",
        "sourceItemIndex", "createdBy", "createdAt"
    );

    private static final Set<String> VALID_STATUSES = Set.of(
        "DRAFT", "REVIEWED", "ACCEPTED", "ARCHIVED"
    );

    private final WorkspaceArtifactRepository repository;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    public ArtifactReviewService(WorkspaceArtifactRepository repository,
                                  AuditService auditService,
                                  ObjectMapper objectMapper) {
        this.repository = repository;
        this.auditService = auditService;
        this.objectMapper = objectMapper;
    }

    // ── List ──────────────────────────────────────────────────────────────────

    public ArtifactReviewModels.ArtifactListResponse listArtifacts(
            String organizationId,
            ArtifactReviewModels.ArtifactListFilters filters) {

        if (filters.artifactType() != null && !filters.artifactType().isBlank()) {
            validateArtifactType(filters.artifactType());
        }
        if (filters.status() != null && !filters.status().isBlank()) {
            validateStatus(filters.status());
        }

        List<WorkspaceArtifactRow> rows = repository.findByOrganization(
            organizationId,
            filters.projectId(),
            filters.sourceCheckupReportId(),
            filters.artifactType(),
            filters.status()
        );

        boolean limitReached = false;
        if (rows.size() == LIST_LIMIT) {
            long total = repository.countByOrganization(
                organizationId,
                filters.projectId(),
                filters.sourceCheckupReportId(),
                filters.artifactType(),
                filters.status()
            );
            limitReached = total > LIST_LIMIT;
        }

        return new ArtifactReviewModels.ArtifactListResponse(rows, limitReached);
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    public WorkspaceArtifactRow getArtifact(String id, String organizationId) {
        return repository.findById(id, organizationId)
            .orElseThrow(() -> new ArtifactReviewModels.ArtifactNotFoundException(id));
    }

    // ── Update ────────────────────────────────────────────────────────────────

    public WorkspaceArtifactRow updateArtifact(
            String id,
            String organizationId,
            String userId,
            Map<String, Object> rawPatch,
            ArtifactReviewModels.ArtifactPatch patch) {

        // 1. Reject immutable fields in raw payload
        List<String> forbidden = rawPatch.keySet().stream()
            .filter(IMMUTABLE_FIELDS::contains)
            .sorted()
            .toList();
        if (!forbidden.isEmpty()) {
            throw new ArtifactReviewModels.ImmutableFieldException(forbidden);
        }

        // 2. Fetch artifact (returns 404 for not-found and cross-org)
        WorkspaceArtifactRow current = getArtifact(id, organizationId);

        // 3. Validate title
        if (patch.title() != null && patch.title().isBlank()) {
            throw new ArtifactReviewModels.ArtifactValidationException(
                "title", "O campo título não pode estar vazio.");
        }

        // 4. Validate status
        if (patch.status() != null) {
            validateStatus(patch.status());
        }

        // 5. Validate details schema
        if (patch.details() != null) {
            validateDetails(current.artifactType(), patch.details());
        }

        // 6. Compute changedFields
        List<String> changedFields = new ArrayList<>();
        if (patch.title() != null && !patch.title().equals(current.title())) {
            changedFields.add("title");
        }
        if (patch.description() != null && !patch.description().equals(current.description())) {
            changedFields.add("description");
        }
        if (patch.status() != null && !patch.status().equals(current.status())) {
            changedFields.add("status");
        }
        if (patch.details() != null) {
            changedFields.add("details");
        }

        // 7. Persist
        String detailsJson = null;
        if (patch.details() != null) {
            try {
                detailsJson = objectMapper.writeValueAsString(patch.details());
            } catch (Exception e) {
                throw new ArtifactReviewModels.ArtifactValidationException(
                    "details", "Formato de details inválido.");
            }
        }
        repository.updateEditableFields(id, organizationId,
            patch.title(), patch.description(), patch.status(), detailsJson);

        // 8. Record audit event
        recordAuditEvent(id, organizationId, userId, changedFields,
            current.status(), patch.status());

        // 9. Return updated artifact
        return getArtifact(id, organizationId);
    }

    // ── Validation helpers ────────────────────────────────────────────────────

    private void validateStatus(String status) {
        if (!VALID_STATUSES.contains(status)) {
            throw new ArtifactReviewModels.ArtifactValidationException(
                "status",
                "Status inválido: '" + status + "'. Valores aceitos: DRAFT, REVIEWED, ACCEPTED, ARCHIVED.");
        }
    }

    private void validateArtifactType(String artifactType) {
        Set<String> valid = Set.of("REQUIREMENT", "RISK_ITEM", "QA_ACTION");
        if (!valid.contains(artifactType)) {
            throw new ArtifactReviewModels.ArtifactValidationException(
                "artifactType",
                "Tipo de artefato inválido: '" + artifactType + "'. Valores aceitos: REQUIREMENT, RISK_ITEM, QA_ACTION.");
        }
    }

    void validateDetails(String artifactType, Object detailsObj) {
        Map<String, Object> details;
        try {
            details = objectMapper.convertValue(detailsObj,
                new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            throw new ArtifactReviewModels.ArtifactValidationException(
                "details", "O campo details deve ser um objeto JSON válido.");
        }

        switch (artifactType) {
            case "REQUIREMENT" -> {
                requireField(details, "severity", "details.severity");
                requireField(details, "originalText", "details.originalText");
                validateEnum(details, "severity",
                    Set.of("HIGH", "MEDIUM", "LOW"), "details.severity");
            }
            case "RISK_ITEM" -> {
                requireField(details, "severity", "details.severity");
                requireField(details, "riskCategory", "details.riskCategory");
                requireField(details, "originalText", "details.originalText");
                validateEnum(details, "severity",
                    Set.of("CRITICAL", "HIGH", "MEDIUM", "LOW"), "details.severity");
                validateEnum(details, "riskCategory",
                    Set.of("QUALITY", "UX_PRODUCT", "RELEASE_READINESS"), "details.riskCategory");
            }
            case "QA_ACTION" -> {
                requireField(details, "priority", "details.priority");
                requireField(details, "action", "details.action");
                requireField(details, "rationale", "details.rationale");
                requireField(details, "originalText", "details.originalText");
                validateEnum(details, "priority",
                    Set.of("HIGH", "MEDIUM", "LOW"), "details.priority");
            }
            default -> { /* unknown type — pass through */ }
        }
    }

    private void requireField(Map<String, Object> map, String key, String fieldPath) {
        Object val = map.get(key);
        if (val == null || val.toString().isBlank()) {
            throw new ArtifactReviewModels.ArtifactValidationException(
                fieldPath, "Campo obrigatório ausente ou vazio: " + fieldPath);
        }
    }

    private void validateEnum(Map<String, Object> map, String key,
                               Set<String> allowed, String fieldPath) {
        Object val = map.get(key);
        if (val != null && !allowed.contains(val.toString())) {
            throw new ArtifactReviewModels.ArtifactValidationException(
                fieldPath,
                "Valor inválido para " + fieldPath + ": '" + val + "'. Valores aceitos: " + allowed);
        }
    }

    // ── Audit ─────────────────────────────────────────────────────────────────

    private void recordAuditEvent(String artifactId, String organizationId,
                                   String userId, List<String> changedFields,
                                   String previousStatus, String newStatus) {
        try {
            Map<String, Object> meta = new java.util.LinkedHashMap<>();
            meta.put("changedFields", changedFields);
            if (changedFields.contains("status") && previousStatus != null) {
                meta.put("previousStatus", previousStatus);
                meta.put("newStatus", newStatus);
            }
            String metadata = objectMapper.writeValueAsString(meta);
            auditService.record(AuditService.AuditEvent.of(
                organizationId, userId,
                "ARTIFACT_UPDATED", "workspace_artifact", artifactId,
                metadata
            ));
        } catch (Exception ignored) {
            // audit failure must not mask the primary update success
        }
    }
}
