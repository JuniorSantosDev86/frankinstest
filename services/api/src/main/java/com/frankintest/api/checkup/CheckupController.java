package com.frankintest.api.checkup;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/checkup")
public class CheckupController {

    private final CheckupService checkupService;

    public CheckupController(CheckupService checkupService) {
        this.checkupService = checkupService;
    }

    @PostMapping("/estimate")
    public ResponseEntity<?> estimate(@RequestBody CheckupModels.CheckupRequest request) {
        if (request == null || request.goal() == null || request.context() == null
                || request.targetType() == null || request.depth() == null || request.outputMode() == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "VALIDATION_ERROR",
                "message", "Campos obrigatórios ausentes."
            ));
        }
        try {
            return ResponseEntity.ok(checkupService.estimate(request));
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
    public ResponseEntity<?> run(@RequestBody CheckupModels.CheckupRequest request) {
        if (request == null || request.goal() == null || request.context() == null
                || request.targetType() == null || request.depth() == null || request.outputMode() == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "VALIDATION_ERROR",
                "message", "Campos obrigatórios ausentes."
            ));
        }
        String organizationId = "org_mock";
        String userId = "user_mock";
        try {
            CheckupModels.CheckupRunResponse response = checkupService.run(request, organizationId, userId);
            return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
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
                "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/runs/{aiRunId}")
    public ResponseEntity<?> getRunStatus(@PathVariable String aiRunId) {
        String organizationId = "org_mock";
        try {
            return ResponseEntity.ok(checkupService.getRunStatus(aiRunId, organizationId));
        } catch (CheckupService.CheckupNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "error", "NOT_FOUND",
                "message", e.getMessage()
            ));
        }
    }
}
