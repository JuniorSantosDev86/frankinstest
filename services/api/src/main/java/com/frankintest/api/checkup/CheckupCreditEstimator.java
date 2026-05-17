package com.frankintest.api.checkup;

import org.springframework.stereotype.Component;

@Component
public class CheckupCreditEstimator {

    public long estimate(CheckupModels.CheckupDepth depth, CheckupModels.OutputMode outputMode) {
        long base = switch (depth) {
            case QUICK -> 10L;
            case STANDARD -> 20L;
            case DEEP -> 35L;
        };
        double multiplier = switch (outputMode) {
            case REPORT_ONLY -> 1.0;
            case REPORT_WITH_SCENARIOS -> 1.5;
        };
        return (long) Math.ceil(base * multiplier);
    }

    public void validateRequest(CheckupModels.CheckupRequest request) {
        if (!request.userAuthorizationConfirmed()) {
            throw new CheckupModels.AuthorizationNotConfirmedException();
        }
        if (request.targetType() != CheckupModels.TargetType.OTHER
                && (request.targetValue() == null || request.targetValue().isBlank())) {
            throw new CheckupModels.CheckupValidationException(
                "targetValue", "Campo targetValue é obrigatório para o tipo de alvo informado.");
        }
        if (request.context() == null || request.context().length() < 20) {
            throw new CheckupModels.CheckupValidationException(
                "context", "O campo context deve ter no mínimo 20 caracteres.");
        }
        if (request.goal() == null || request.goal().length() < 10) {
            throw new CheckupModels.CheckupValidationException(
                "goal", "O campo goal deve ter no mínimo 10 caracteres.");
        }
    }
}
