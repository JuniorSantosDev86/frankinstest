package com.frankintest.api.workspace;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.frankintest.api.system.WorkspaceAccessService;
import com.frankintest.api.system.security.AuthenticatedPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/workspace/artifacts")
public class ArtifactReviewController {

    private final ArtifactReviewService service;
    private final WorkspaceAccessService workspaceAccessService;
    private final ObjectMapper objectMapper;

    public ArtifactReviewController(ArtifactReviewService service,
                                     WorkspaceAccessService workspaceAccessService,
                                     ObjectMapper objectMapper) {
        this.service = service;
        this.workspaceAccessService = workspaceAccessService;
        this.objectMapper = objectMapper;
    }

    @GetMapping
    public ResponseEntity<?> list(
            @AuthenticationPrincipal AuthenticatedPrincipal principal,
            @RequestHeader(value = "X-Organization-Id", required = false) String organizationId,
            @RequestParam(required = false) String projectId,
            @RequestParam(required = false) String sourceCheckupReportId,
            @RequestParam(required = false) String artifactType,
            @RequestParam(required = false) String status) {

        try {
            workspaceAccessService.requireOrgAccess(principal, organizationId);
            var filters = new ArtifactReviewModels.ArtifactListFilters(
                organizationId, projectId, sourceCheckupReportId, artifactType, status);
            return ResponseEntity.ok(service.listArtifacts(organizationId, filters));
        } catch (WorkspaceAccessService.MissingOrgHeaderException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(error("FORBIDDEN", e.getMessage()));
        } catch (WorkspaceAccessService.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(error("FORBIDDEN", e.getMessage()));
        } catch (ArtifactReviewModels.ArtifactValidationException e) {
            return ResponseEntity.badRequest()
                .body(errorField("VALIDATION_ERROR", e.getMessage(), e.field));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(
            @PathVariable String id,
            @AuthenticationPrincipal AuthenticatedPrincipal principal,
            @RequestHeader(value = "X-Organization-Id", required = false) String organizationId) {

        try {
            workspaceAccessService.requireOrgAccess(principal, organizationId);
            return ResponseEntity.ok(service.getArtifact(id, organizationId));
        } catch (WorkspaceAccessService.MissingOrgHeaderException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(error("FORBIDDEN", e.getMessage()));
        } catch (WorkspaceAccessService.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(error("FORBIDDEN", e.getMessage()));
        } catch (ArtifactReviewModels.ArtifactNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(error("NOT_FOUND", e.getMessage()));
        }
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> patch(
            @PathVariable String id,
            @AuthenticationPrincipal AuthenticatedPrincipal principal,
            @RequestHeader(value = "X-Organization-Id", required = false) String organizationId,
            @RequestBody String rawBody) {

        try {
            workspaceAccessService.requireOrgAccess(principal, organizationId);

            // Parse raw body twice: once for forbidden-key detection, once for typed access
            Map<String, Object> rawPatch = objectMapper.readValue(
                rawBody, new TypeReference<Map<String, Object>>() {});
            ArtifactReviewModels.ArtifactPatch patch = objectMapper.readValue(
                rawBody, ArtifactReviewModels.ArtifactPatch.class);

            String userId = principal.userId();
            return ResponseEntity.ok(
                service.updateArtifact(id, organizationId, userId, rawPatch, patch));

        } catch (WorkspaceAccessService.MissingOrgHeaderException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(error("FORBIDDEN", e.getMessage()));
        } catch (WorkspaceAccessService.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(error("FORBIDDEN", e.getMessage()));
        } catch (ArtifactReviewModels.ArtifactNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(error("NOT_FOUND", e.getMessage()));
        } catch (ArtifactReviewModels.ImmutableFieldException e) {
            return ResponseEntity.badRequest()
                .body(errorFields("IMMUTABLE_FIELD", e.getMessage(), e.fields));
        } catch (ArtifactReviewModels.ArtifactValidationException e) {
            return ResponseEntity.badRequest()
                .body(errorField("VALIDATION_ERROR", e.getMessage(), e.field));
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            return ResponseEntity.badRequest()
                .body(error("VALIDATION_ERROR", "Corpo da requisição inválido: JSON malformado."));
        }
    }

    private Map<String, Object> error(String code, String message) {
        return Map.of("error", code, "message", message);
    }

    private Map<String, Object> errorField(String code, String message, String field) {
        return Map.of("error", code, "message", message, "field", field);
    }

    private Map<String, Object> errorFields(String code, String message, java.util.List<String> fields) {
        return Map.of("error", code, "message", message, "fields", fields);
    }
}
