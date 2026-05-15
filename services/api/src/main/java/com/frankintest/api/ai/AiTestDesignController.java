package com.frankintest.api.ai;

import com.frankintest.api.ai.orchestration.AiGeneratedArtifactParser;
import com.frankintest.api.ai.orchestration.AiTestDesignDtos;
import com.frankintest.api.ai.orchestration.AiTestDesignOrchestrationService;
import com.frankintest.api.credits.CreditModels;
import com.frankintest.api.system.ApiErrorResponse;
import com.frankintest.api.system.WorkspaceAccessService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai/test-design")
public class AiTestDesignController {

    private final AiTestDesignOrchestrationService orchestrationService;

    public AiTestDesignController(AiTestDesignOrchestrationService orchestrationService) {
        this.orchestrationService = orchestrationService;
    }

    @PostMapping("/estimate")
    public ResponseEntity<?> estimate(@RequestBody EstimateRequestBody body) {
        if (body.organizationId() == null || body.organizationId().isBlank()) {
            return badRequest("INVALID_INPUT", "organizationId é obrigatório");
        }
        if (body.projectId() == null || body.projectId().isBlank()) {
            return badRequest("INVALID_INPUT", "projectId é obrigatório");
        }
        if (body.generationType() == null || body.generationType().isBlank()) {
            return badRequest("INVALID_INPUT", "generationType é obrigatório");
        }
        if (body.sourceArtifactId() == null || body.sourceArtifactId().isBlank()) {
            return badRequest("INVALID_INPUT", "sourceArtifactId é obrigatório");
        }

        try {
            AiTestDesignDtos.EstimateRequest req = new AiTestDesignDtos.EstimateRequest(
                body.organizationId(), body.projectId(),
                resolveUserId(body.userId()),
                body.generationType(), body.sourceArtifactId(), body.context()
            );
            return ResponseEntity.ok(orchestrationService.estimate(req));
        } catch (WorkspaceAccessService.AccessDeniedException e) {
            return forbidden(e.getMessage());
        }
    }

    @PostMapping("/scenarios")
    public ResponseEntity<?> generateScenarios(@RequestBody GenerateScenariosRequestBody body) {
        if (body.organizationId() == null || body.organizationId().isBlank()) {
            return badRequest("INVALID_INPUT", "organizationId é obrigatório");
        }
        if (body.projectId() == null || body.projectId().isBlank()) {
            return badRequest("INVALID_INPUT", "projectId é obrigatório");
        }
        if (body.businessRuleId() == null || body.businessRuleId().isBlank()) {
            return badRequest("INVALID_INPUT", "businessRuleId é obrigatório");
        }
        if (body.confirmedEstimatedCredits() <= 0) {
            return badRequest("INVALID_INPUT", "confirmedEstimatedCredits deve ser maior que zero");
        }

        try {
            AiTestDesignDtos.GenerateScenariosRequest req = new AiTestDesignDtos.GenerateScenariosRequest(
                body.organizationId(), body.projectId(), resolveUserId(body.userId()),
                body.businessRuleId(), body.confirmedEstimatedCredits(), body.context()
            );
            AiTestDesignDtos.AiGenerationResult result = orchestrationService.generateScenarios(req);
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (WorkspaceAccessService.AccessDeniedException e) {
            return forbidden(e.getMessage());
        } catch (CreditModels.InsufficientCreditsException e) {
            return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED)
                .body(ApiErrorResponse.of("INSUFFICIENT_CREDITS", e.getMessage()));
        } catch (AiTestDesignOrchestrationService.ProviderFailureException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(ApiErrorResponse.of("PROVIDER_FAILURE",
                    "Falha no provedor de IA. Créditos não foram consumidos. Tente novamente."));
        } catch (AiGeneratedArtifactParser.InvalidAiOutputException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(ApiErrorResponse.of("OUTPUT_VALIDATION_FAILURE",
                    "Output do provedor inválido. Créditos não foram consumidos."));
        }
    }

    @PostMapping("/test-cases")
    public ResponseEntity<?> generateTestCases(@RequestBody GenerateTestCasesRequestBody body) {
        if (body.organizationId() == null || body.organizationId().isBlank()) {
            return badRequest("INVALID_INPUT", "organizationId é obrigatório");
        }
        if (body.projectId() == null || body.projectId().isBlank()) {
            return badRequest("INVALID_INPUT", "projectId é obrigatório");
        }
        if (body.scenarioId() == null || body.scenarioId().isBlank()) {
            return badRequest("INVALID_INPUT", "scenarioId é obrigatório");
        }
        if (body.confirmedEstimatedCredits() <= 0) {
            return badRequest("INVALID_INPUT", "confirmedEstimatedCredits deve ser maior que zero");
        }

        try {
            AiTestDesignDtos.GenerateTestCasesRequest req = new AiTestDesignDtos.GenerateTestCasesRequest(
                body.organizationId(), body.projectId(), resolveUserId(body.userId()),
                body.scenarioId(), body.confirmedEstimatedCredits(), body.context()
            );
            AiTestDesignDtos.AiGenerationResult result = orchestrationService.generateTestCases(req);
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (WorkspaceAccessService.AccessDeniedException e) {
            return forbidden(e.getMessage());
        } catch (CreditModels.InsufficientCreditsException e) {
            return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED)
                .body(ApiErrorResponse.of("INSUFFICIENT_CREDITS", e.getMessage()));
        } catch (AiTestDesignOrchestrationService.ProviderFailureException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(ApiErrorResponse.of("PROVIDER_FAILURE",
                    "Falha no provedor de IA. Créditos não foram consumidos. Tente novamente."));
        } catch (AiGeneratedArtifactParser.InvalidAiOutputException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(ApiErrorResponse.of("OUTPUT_VALIDATION_FAILURE",
                    "Output do provedor inválido. Créditos não foram consumidos."));
        }
    }

    private String resolveUserId(String userId) {
        return (userId != null && !userId.isBlank()) ? userId : "user_default";
    }

    private ResponseEntity<ApiErrorResponse> badRequest(String code, String message) {
        return ResponseEntity.badRequest().body(ApiErrorResponse.of(code, message));
    }

    private ResponseEntity<ApiErrorResponse> forbidden(String message) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(ApiErrorResponse.of("ACCESS_DENIED", message));
    }

    // ---- Request body records ----

    record EstimateRequestBody(
        String organizationId,
        String projectId,
        String userId,
        String generationType,
        String sourceArtifactId,
        String context
    ) {}

    record GenerateScenariosRequestBody(
        String organizationId,
        String projectId,
        String userId,
        String businessRuleId,
        int confirmedEstimatedCredits,
        String context
    ) {}

    record GenerateTestCasesRequestBody(
        String organizationId,
        String projectId,
        String userId,
        String scenarioId,
        int confirmedEstimatedCredits,
        String context
    ) {}
}
