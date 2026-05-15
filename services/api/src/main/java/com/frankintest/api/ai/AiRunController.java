package com.frankintest.api.ai;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class AiRunController {

    private final AiOrchestrationService orchestrationService;

    public AiRunController(AiOrchestrationService orchestrationService) {
        this.orchestrationService = orchestrationService;
    }

    @PostMapping("/estimate")
    public ResponseEntity<?> estimate(@RequestBody AiEstimateRequest request) {
        if (request.feature() == null || request.feature().isBlank()) {
            return ResponseEntity.badRequest().body("Campo 'feature' é obrigatório");
        }
        if (request.context() == null || request.context().isBlank()) {
            return ResponseEntity.badRequest().body("Campo 'context' é obrigatório");
        }

        long credits = orchestrationService.estimateCredits(request.feature(), request.context());
        return ResponseEntity.ok(new AiEstimateResponse(credits, orchestrationService.getPricingNote()));
    }

    @PostMapping("/scenarios/generate")
    public ResponseEntity<?> generateScenarios(@RequestBody AiGenerateScenariosRequest request) {
        if (request.projectId() == null || request.projectId().isBlank()) {
            return ResponseEntity.badRequest().body("Campo 'projectId' é obrigatório");
        }
        if (request.businessRuleId() == null || request.businessRuleId().isBlank()) {
            return ResponseEntity.badRequest().body("Campo 'businessRuleId' é obrigatório");
        }
        if (request.businessRuleTitle() == null || request.businessRuleTitle().isBlank()) {
            return ResponseEntity.badRequest().body("Campo 'businessRuleTitle' é obrigatório");
        }

        String orgId = resolveOrgId(request.organizationId());
        String userId = resolveUserId(request.userId());

        AiGenerateScenariosRequest resolved = new AiGenerateScenariosRequest(
                orgId, request.projectId(), userId,
                request.businessRuleId(), request.businessRuleTitle(), request.context()
        );

        AiRunResponse response = orchestrationService.generateScenarios(resolved);

        if ("failed".equals(response.status())) {
            return ResponseEntity.internalServerError().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/test-cases/generate")
    public ResponseEntity<?> generateTestCases(@RequestBody AiGenerateTestCasesRequest request) {
        if (request.projectId() == null || request.projectId().isBlank()) {
            return ResponseEntity.badRequest().body("Campo 'projectId' é obrigatório");
        }
        if (request.scenarioId() == null || request.scenarioId().isBlank()) {
            return ResponseEntity.badRequest().body("Campo 'scenarioId' é obrigatório");
        }
        if (request.scenarioTitle() == null || request.scenarioTitle().isBlank()) {
            return ResponseEntity.badRequest().body("Campo 'scenarioTitle' é obrigatório");
        }

        String orgId = resolveOrgId(request.organizationId());
        String userId = resolveUserId(request.userId());

        AiGenerateTestCasesRequest resolved = new AiGenerateTestCasesRequest(
                orgId, request.projectId(), userId,
                request.scenarioId(), request.scenarioTitle(), request.context()
        );

        AiRunResponse response = orchestrationService.generateTestCases(resolved);

        if ("failed".equals(response.status())) {
            return ResponseEntity.internalServerError().body(response);
        }
        return ResponseEntity.ok(response);
    }

    private String resolveOrgId(String orgId) {
        return (orgId != null && !orgId.isBlank()) ? orgId : "org_default";
    }

    private String resolveUserId(String userId) {
        return (userId != null && !userId.isBlank()) ? userId : "user_default";
    }
}
