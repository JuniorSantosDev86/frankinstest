package com.frankintest.api.ai;

public record AiGenerateTestCasesRequest(
        String organizationId,
        String projectId,
        String userId,
        String scenarioId,
        String scenarioTitle,
        String context
) {}
