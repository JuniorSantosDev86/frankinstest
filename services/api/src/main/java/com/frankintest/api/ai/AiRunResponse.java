package com.frankintest.api.ai;

public record AiRunResponse(
        String aiRunId,
        String status,
        String outputArtifactType,
        String output,
        long consumedCredits,
        String errorMessage
) {}
