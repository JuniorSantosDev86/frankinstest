package com.frankintest.api.airuns;

import java.time.Instant;
import java.util.List;

public class AiRunModels {

    public enum AiRunFeature {
        test_scenario_generation,
        test_case_generation
    }

    public enum AiRunStatus {
        estimated, reserved, running, completed, failed, cancelled
    }

    public enum AiRunFailureCategory {
        none, validation, permission, insufficient_credits, provider, platform, output_validation
    }

    public enum SourceArtifactType {
        business_rule, test_scenario
    }

    public enum OutputArtifactType {
        test_scenario, test_case
    }

    public record AiRun(
        String id,
        String organizationId,
        String projectId,
        String userId,
        AiRunFeature feature,
        SourceArtifactType sourceArtifactType,
        String sourceArtifactId,
        String inputSummary,
        long estimatedCredits,
        long reservedCredits,
        long consumedCredits,
        AiRunStatus status,
        AiRunFailureCategory failureCategory,
        OutputArtifactType outputArtifactType,
        List<String> outputArtifactIds,
        Instant createdAt,
        Instant startedAt,
        Instant completedAt
    ) {}

    public record AiRunStatusResponse(
        String aiRunId,
        String status,
        long estimatedCredits,
        long consumedCredits,
        String failureCategory,
        String outputArtifactType,
        List<String> outputArtifactIds
    ) {}
}
