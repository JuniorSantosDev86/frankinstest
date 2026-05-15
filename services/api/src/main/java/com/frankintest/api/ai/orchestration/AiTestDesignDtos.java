package com.frankintest.api.ai.orchestration;

import com.frankintest.api.testdesign.TestDesignModels;

import java.util.List;

public class AiTestDesignDtos {

    // ---- Estimate ----

    public record EstimateRequest(
        String organizationId,
        String projectId,
        String userId,
        String generationType,
        String sourceArtifactId,
        String context
    ) {}

    public record EstimateResponse(
        int estimatedCredits,
        String pricingNote,
        String expiresAt
    ) {}

    // ---- Scenario generation ----

    public record GenerateScenariosRequest(
        String organizationId,
        String projectId,
        String userId,
        String businessRuleId,
        int confirmedEstimatedCredits,
        String context
    ) {}

    // ---- Test case generation ----

    public record GenerateTestCasesRequest(
        String organizationId,
        String projectId,
        String userId,
        String scenarioId,
        int confirmedEstimatedCredits,
        String context
    ) {}

    // ---- Generation result ----

    public record AiGenerationResult(
        String aiRunId,
        String status,
        String outputArtifactType,
        List<TestDesignModels.GeneratedQaArtifact> artifacts,
        long consumedCredits,
        String creditNote
    ) {}

    // ---- AI run status ----

    public record AiRunStatusResponse(
        String aiRunId,
        String status,
        long estimatedCredits,
        long consumedCredits,
        String failureCategory,
        String outputArtifactType,
        List<String> outputArtifactIds
    ) {}

    // ---- Parser output DTOs ----

    public record ParsedScenario(
        String title,
        String description,
        String scenarioType
    ) {}

    public record ParsedTestCase(
        String title,
        String preconditions,
        String steps,
        String expectedResult,
        String testType,
        boolean automationCandidate
    ) {}
}
