package com.frankintest.api.ai;

import com.frankintest.api.airuns.AiRunModels;
import com.frankintest.api.airuns.AiRunRepository;
import com.frankintest.api.ai.orchestration.AiTestDesignDtos;
import com.frankintest.api.system.ApiErrorResponse;
import com.frankintest.api.system.WorkspaceAccessService;
import com.frankintest.api.system.security.AuthenticatedPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/ai/runs")
public class AiRunStatusController {

    private final AiRunRepository aiRunRepository;
    private final WorkspaceAccessService workspaceAccessService;

    public AiRunStatusController(AiRunRepository aiRunRepository,
                                  WorkspaceAccessService workspaceAccessService) {
        this.aiRunRepository = aiRunRepository;
        this.workspaceAccessService = workspaceAccessService;
    }

    @GetMapping("/{aiRunId}")
    public ResponseEntity<?> getRunStatus(
            @PathVariable String aiRunId,
            @AuthenticationPrincipal AuthenticatedPrincipal principal,
            @RequestHeader(value = "X-Organization-Id", required = false) String organizationId) {

        try {
            workspaceAccessService.requireOrgAccess(principal, organizationId);
        } catch (WorkspaceAccessService.MissingOrgHeaderException e) {
            return ResponseEntity.badRequest().body(
                ApiErrorResponse.of("VALIDATION_ERROR", e.getMessage()));
        } catch (WorkspaceAccessService.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                ApiErrorResponse.of("FORBIDDEN", e.getMessage()));
        }

        Optional<AiRunModels.AiRun> runOpt = aiRunRepository.findById(aiRunId);

        if (runOpt.isEmpty()) {
            return ResponseEntity.status(404)
                .body(ApiErrorResponse.of("RUN_NOT_FOUND", "AI run não encontrado: " + aiRunId));
        }

        AiRunModels.AiRun run = runOpt.get();

        // Org-ownership check: the run's org must match the validated org
        if (!organizationId.equals(run.organizationId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                ApiErrorResponse.of("FORBIDDEN", "Acesso negado a este recurso."));
        }

        return ResponseEntity.ok(new AiTestDesignDtos.AiRunStatusResponse(
            run.id(),
            run.status().name(),
            run.estimatedCredits(),
            run.consumedCredits(),
            run.failureCategory() != null ? run.failureCategory().name() : null,
            run.outputArtifactType() != null ? run.outputArtifactType().name() : null,
            run.outputArtifactIds()
        ));
    }
}
