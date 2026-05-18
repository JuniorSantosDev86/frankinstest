package com.frankintest.api.conversion;

import com.frankintest.api.system.WorkspaceAccessService;
import com.frankintest.api.system.security.AuthenticatedPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/checkup/reports")
public class ConversionController {

    private final ConversionService conversionService;
    private final WorkspaceAccessService workspaceAccessService;

    public ConversionController(ConversionService conversionService,
                                WorkspaceAccessService workspaceAccessService) {
        this.conversionService = conversionService;
        this.workspaceAccessService = workspaceAccessService;
    }

    @PostMapping("/{reportId}/conversion/preview")
    public ResponseEntity<?> preview(
            @PathVariable String reportId,
            @RequestBody ConversionModels.ConversionPreviewRequest request,
            @AuthenticationPrincipal AuthenticatedPrincipal principal,
            @RequestHeader(value = "X-Organization-Id", required = false) String organizationId) {

        try {
            workspaceAccessService.requireOrgAccess(principal, organizationId);
            return ResponseEntity.ok(conversionService.preview(reportId, organizationId, request));
        } catch (WorkspaceAccessService.MissingOrgHeaderException e) {
            return ResponseEntity.badRequest().body(error("VALIDATION_ERROR", e.getMessage()));
        } catch (WorkspaceAccessService.AccessDeniedException |
                 org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error("FORBIDDEN", e.getMessage()));
        } catch (ConversionModels.ReportNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error("NOT_FOUND", e.getMessage()));
        } catch (ConversionModels.ReportNotEligibleException e) {
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                .body(error("NOT_ELIGIBLE", e.getMessage()));
        } catch (ConversionModels.ConversionValidationException e) {
            return ResponseEntity.badRequest().body(errorField("VALIDATION_ERROR", e.getMessage(), e.field));
        }
    }

    @PostMapping("/{reportId}/conversion/confirm")
    public ResponseEntity<?> confirm(
            @PathVariable String reportId,
            @RequestBody ConversionModels.ConversionConfirmRequest request,
            @AuthenticationPrincipal AuthenticatedPrincipal principal,
            @RequestHeader(value = "X-Organization-Id", required = false) String organizationId) {

        try {
            workspaceAccessService.requireOrgAccess(principal, organizationId);
            String userId = principal.userId();
            return ResponseEntity.ok(conversionService.confirm(reportId, organizationId, userId, request));
        } catch (WorkspaceAccessService.MissingOrgHeaderException e) {
            return ResponseEntity.badRequest().body(error("VALIDATION_ERROR", e.getMessage()));
        } catch (WorkspaceAccessService.AccessDeniedException |
                 org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error("FORBIDDEN", e.getMessage()));
        } catch (ConversionModels.ReportNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error("NOT_FOUND", e.getMessage()));
        } catch (ConversionModels.ReportNotEligibleException e) {
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                .body(error("NOT_ELIGIBLE", e.getMessage()));
        } catch (ConversionModels.ConversionValidationException e) {
            return ResponseEntity.badRequest().body(errorField("VALIDATION_ERROR", e.getMessage(), e.field));
        }
    }

    private Map<String, String> error(String code, String message) {
        return Map.of("error", code, "message", message);
    }

    private Map<String, String> errorField(String code, String message, String field) {
        return Map.of("error", code, "message", message, "field", field);
    }
}
