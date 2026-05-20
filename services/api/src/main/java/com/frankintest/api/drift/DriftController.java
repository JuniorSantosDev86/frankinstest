package com.frankintest.api.drift;

import com.frankintest.api.system.WorkspaceAccessService;
import com.frankintest.api.system.security.AuthenticatedPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/drift")
public class DriftController {

    private final DriftService driftService;
    private final WorkspaceAccessService workspaceAccessService;

    public DriftController(DriftService driftService,
                           WorkspaceAccessService workspaceAccessService) {
        this.driftService = driftService;
        this.workspaceAccessService = workspaceAccessService;
    }

    @GetMapping("/artifacts/{artifactId}")
    public ResponseEntity<?> getArtifactDrift(
            @PathVariable String artifactId,
            @AuthenticationPrincipal AuthenticatedPrincipal principal,
            @RequestHeader(value = "X-Organization-Id", required = false) String organizationId) {

        try {
            workspaceAccessService.requireOrgAccess(principal, organizationId);
            return ResponseEntity.ok(driftService.calculateArtifactDrift(artifactId, organizationId));
        } catch (WorkspaceAccessService.MissingOrgHeaderException |
                 WorkspaceAccessService.AccessDeniedException |
                 org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error("Forbidden"));
        } catch (DriftModels.DriftNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error("Not found"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(error("Internal server error"));
        }
    }

    @GetMapping("/reports/{reportId}")
    public ResponseEntity<?> getReportDrift(
            @PathVariable String reportId,
            @AuthenticationPrincipal AuthenticatedPrincipal principal,
            @RequestHeader(value = "X-Organization-Id", required = false) String organizationId) {

        try {
            workspaceAccessService.requireOrgAccess(principal, organizationId);
            return ResponseEntity.ok(driftService.calculateReportDrift(reportId, organizationId));
        } catch (WorkspaceAccessService.MissingOrgHeaderException |
                 WorkspaceAccessService.AccessDeniedException |
                 org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error("Forbidden"));
        } catch (DriftModels.DriftNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error("Not found"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(error("Internal server error"));
        }
    }

    private Map<String, String> error(String message) {
        return Map.of("error", message);
    }
}
