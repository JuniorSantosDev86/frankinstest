package com.frankintest.api.toolrecommendation;

import com.frankintest.api.system.WorkspaceAccessService;
import com.frankintest.api.system.security.AuthenticatedPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/tool-recommendations")
public class ToolRecommendationController {

    private final ToolRecommendationService service;
    private final WorkspaceAccessService workspaceAccessService;

    public ToolRecommendationController(ToolRecommendationService service,
                                        WorkspaceAccessService workspaceAccessService) {
        this.service = service;
        this.workspaceAccessService = workspaceAccessService;
    }

    @PostMapping("/{reportId}")
    public ResponseEntity<?> generate(
            @PathVariable String reportId,
            @AuthenticationPrincipal AuthenticatedPrincipal principal,
            @RequestHeader(value = "X-Organization-Id", required = false) String organizationId) {

        try {
            workspaceAccessService.requireOrgAccess(principal, organizationId);
            return ResponseEntity.ok(service.generate(reportId, organizationId));
        } catch (WorkspaceAccessService.MissingOrgHeaderException |
                 WorkspaceAccessService.AccessDeniedException |
                 org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error("Acesso negado."));
        } catch (ToolRecommendationModels.ReportNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error("Relatório não encontrado."));
        } catch (ToolRecommendationModels.ReportNotReadyException e) {
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                .body(error("Relatório ainda não está concluído."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(error("Erro interno do servidor."));
        }
    }

    @PostMapping("/{reportId}/save")
    public ResponseEntity<?> save(
            @PathVariable String reportId,
            @AuthenticationPrincipal AuthenticatedPrincipal principal,
            @RequestHeader(value = "X-Organization-Id", required = false) String organizationId) {

        try {
            workspaceAccessService.requireOrgAccess(principal, organizationId);
            ToolRecommendationModels.WorkspaceArtifactSaveResponse response =
                service.save(reportId, organizationId, principal.userId());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (WorkspaceAccessService.MissingOrgHeaderException |
                 WorkspaceAccessService.AccessDeniedException |
                 org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error("Acesso negado."));
        } catch (ToolRecommendationModels.ReportNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error("Relatório não encontrado."));
        } catch (ToolRecommendationModels.ReportNotReadyException e) {
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                .body(error("Relatório ainda não está concluído."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(error("Erro interno do servidor."));
        }
    }

    private Map<String, String> error(String message) {
        return Map.of("message", message);
    }
}
