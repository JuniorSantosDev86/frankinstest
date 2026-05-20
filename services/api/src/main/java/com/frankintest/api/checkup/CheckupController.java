package com.frankintest.api.checkup;

import com.frankintest.api.system.WorkspaceAccessService;
import com.frankintest.api.system.security.AuthenticatedPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/checkup")
public class CheckupController {

    private final CheckupService checkupService;
    private final WorkspaceAccessService workspaceAccessService;

    public CheckupController(CheckupService checkupService, WorkspaceAccessService workspaceAccessService) {
        this.checkupService = checkupService;
        this.workspaceAccessService = workspaceAccessService;
    }

    @PostMapping("/estimate")
    public ResponseEntity<?> estimate(
            @RequestBody CheckupModels.CheckupRequest request,
            @AuthenticationPrincipal AuthenticatedPrincipal principal,
            @RequestHeader(value = "X-Organization-Id", required = false) String organizationId) {

        if (request == null || request.goal() == null || request.context() == null
                || request.targetType() == null || request.depth() == null || request.outputMode() == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "VALIDATION_ERROR",
                "message", "Campos obrigatórios ausentes."
            ));
        }
        try {
            workspaceAccessService.requireOrgAccess(principal, organizationId);
            return ResponseEntity.ok(checkupService.estimate(request));
        } catch (WorkspaceAccessService.MissingOrgHeaderException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "VALIDATION_ERROR",
                "message", e.getMessage(),
                "field", "X-Organization-Id"
            ));
        } catch (WorkspaceAccessService.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "error", "FORBIDDEN",
                "message", e.getMessage()
            ));
        } catch (CheckupModels.AuthorizationNotConfirmedException e) {
            return ResponseEntity.unprocessableEntity().body(Map.of(
                "error", "AUTHORIZATION_REQUIRED",
                "message", e.getMessage()
            ));
        } catch (CheckupModels.CheckupValidationException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "VALIDATION_ERROR",
                "message", e.getMessage(),
                "field", e.field
            ));
        }
    }

    @PostMapping("/run")
    public ResponseEntity<?> run(
            @RequestBody CheckupModels.CheckupRequest request,
            @AuthenticationPrincipal AuthenticatedPrincipal principal,
            @RequestHeader(value = "X-Organization-Id", required = false) String organizationId) {

        if (request == null || request.goal() == null || request.context() == null
                || request.targetType() == null || request.depth() == null || request.outputMode() == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "VALIDATION_ERROR",
                "message", "Campos obrigatórios ausentes."
            ));
        }
        try {
            workspaceAccessService.requireOrgAccess(principal, organizationId);
            CheckupModels.CheckupRunResponse response =
                checkupService.run(request, organizationId, principal.userId());
            return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
        } catch (WorkspaceAccessService.MissingOrgHeaderException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "VALIDATION_ERROR",
                "message", e.getMessage(),
                "field", "X-Organization-Id"
            ));
        } catch (WorkspaceAccessService.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "error", "FORBIDDEN",
                "message", e.getMessage()
            ));
        } catch (CheckupModels.AuthorizationNotConfirmedException e) {
            return ResponseEntity.unprocessableEntity().body(Map.of(
                "error", "AUTHORIZATION_REQUIRED",
                "message", e.getMessage()
            ));
        } catch (CheckupModels.CheckupValidationException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "VALIDATION_ERROR",
                "message", e.getMessage(),
                "field", e.field
            ));
        } catch (CheckupService.InsufficientCheckupCreditsException e) {
            return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(Map.of(
                "error", "INSUFFICIENT_CREDITS",
                "message", "Saldo de créditos insuficiente para executar este Check-up.",
                "required", e.required,
                "available", e.available
            ));
        } catch (CheckupService.CheckupExecutionException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "EXECUTION_FAILED",
                "message", e.getMessage(),
                "aiRunId", e.aiRunId
            ));
        }
    }

    // ── Bloco 16: history list & command center ───────────────────────────────
    // NOTE: /runs/summary and /runs MUST be registered before /runs/{aiRunId}
    // to avoid Spring treating "summary" or an empty path segment as a path variable.

    @GetMapping("/runs/summary")
    public ResponseEntity<?> getRunsSummary(
            @AuthenticationPrincipal AuthenticatedPrincipal principal,
            @RequestHeader(value = "X-Organization-Id", required = false) String organizationId) {
        try {
            workspaceAccessService.requireOrgAccess(principal, organizationId);
            return ResponseEntity.ok(checkupService.getRunsSummary(organizationId));
        } catch (WorkspaceAccessService.MissingOrgHeaderException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "VALIDATION_ERROR",
                "message", e.getMessage(),
                "field", "X-Organization-Id"
            ));
        } catch (WorkspaceAccessService.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "error", "FORBIDDEN",
                "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/runs")
    public ResponseEntity<?> listRuns(
            @AuthenticationPrincipal AuthenticatedPrincipal principal,
            @RequestHeader(value = "X-Organization-Id", required = false) String organizationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            workspaceAccessService.requireOrgAccess(principal, organizationId);
            int clampedSize = Math.min(Math.max(size, 1), 50);
            return ResponseEntity.ok(checkupService.listRuns(organizationId, page, clampedSize));
        } catch (WorkspaceAccessService.MissingOrgHeaderException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "VALIDATION_ERROR",
                "message", e.getMessage(),
                "field", "X-Organization-Id"
            ));
        } catch (WorkspaceAccessService.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "error", "FORBIDDEN",
                "message", e.getMessage()
            ));
        }
    }

    // ── end Bloco 16 ──────────────────────────────────────────────────────────

    @GetMapping("/runs/{aiRunId}")
    public ResponseEntity<?> getRunStatus(
            @PathVariable String aiRunId,
            @AuthenticationPrincipal AuthenticatedPrincipal principal,
            @RequestHeader(value = "X-Organization-Id", required = false) String organizationId) {
        try {
            workspaceAccessService.requireOrgAccess(principal, organizationId);
            return ResponseEntity.ok(checkupService.getRunStatus(aiRunId, organizationId));
        } catch (WorkspaceAccessService.MissingOrgHeaderException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "VALIDATION_ERROR",
                "message", e.getMessage(),
                "field", "X-Organization-Id"
            ));
        } catch (WorkspaceAccessService.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "error", "FORBIDDEN",
                "message", e.getMessage()
            ));
        } catch (CheckupService.CheckupNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "error", "NOT_FOUND",
                "message", e.getMessage()
            ));
        }
    }
}
