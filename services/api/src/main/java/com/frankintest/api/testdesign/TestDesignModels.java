package com.frankintest.api.testdesign;

import java.time.Instant;

public class TestDesignModels {

    public record TestScenario(
        String id,
        String organizationId,
        String projectId,
        String moduleId,
        String requirementId,
        String businessRuleId,
        String title,
        String description,
        String scenarioType,
        String priority,
        String status,
        boolean aiAssisted,
        String aiRunId,
        String reviewedBy,
        Instant reviewedAt,
        Instant createdAt,
        Instant updatedAt
    ) {}

    public record TestCase(
        String id,
        String organizationId,
        String projectId,
        String moduleId,
        String requirementId,
        String businessRuleId,
        String scenarioId,
        String title,
        String preconditions,
        String steps,
        String expectedResult,
        String testType,
        String priority,
        boolean automationCandidate,
        String status,
        boolean aiAssisted,
        String aiRunId,
        String reviewedBy,
        Instant reviewedAt,
        Instant createdAt,
        Instant updatedAt
    ) {}

    public record GeneratedQaArtifact(
        String id,
        String title,
        String description,
        String status,
        boolean aiAssisted
    ) {}
}
