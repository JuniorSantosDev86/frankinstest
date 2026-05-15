package com.frankintest.api.ai;

public record AiGenerateScenariosRequest(
        String organizationId,
        String projectId,
        String userId,
        String businessRuleId,
        String businessRuleTitle,
        String context
) {}
