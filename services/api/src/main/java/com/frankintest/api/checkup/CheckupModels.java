package com.frankintest.api.checkup;

import java.time.Instant;
import java.util.List;

public class CheckupModels {

    public enum TargetType {
        URL, FEATURE_DESCRIPTION, API_DESCRIPTION, DOCUMENT, MOBILE_FLOW, OTHER
    }

    public enum CheckupDepth {
        QUICK, STANDARD, DEEP
    }

    public enum OutputMode {
        REPORT_ONLY, REPORT_WITH_SCENARIOS
    }

    public enum ReportStatus {
        DRAFT, REVIEWED
    }

    public enum Severity {
        LOW, MEDIUM, HIGH, CRITICAL
    }

    public enum ScenarioType {
        POSITIVE, NEGATIVE, EDGE_CASE
    }

    public enum Priority {
        LOW, MEDIUM, HIGH
    }

    public record CheckupRequest(
        TargetType targetType,
        String targetValue,
        boolean userAuthorizationConfirmed,
        String context,
        String goal,
        CheckupDepth depth,
        OutputMode outputMode,
        String targetAudience,
        String criticalFlows,
        String knownRisks,
        String technologies
    ) {}

    public record CheckupEstimateResponse(
        long estimatedCredits,
        CreditBreakdown breakdown,
        String currency
    ) {
        public record CreditBreakdown(long base, double outputMultiplier, long total) {}
    }

    public record CheckupRunResponse(
        String aiRunId,
        String reportId,
        String status,
        long estimatedCredits
    ) {}

    public record CheckupRunStatusResponse(
        String aiRunId,
        String status,
        long creditsConsumed,
        CheckupReportView report,
        String errorMessage
    ) {}

    public record FindingItem(
        String title,
        String description,
        Severity severity
    ) {}

    public record ScenarioItem(
        String title,
        String description,
        ScenarioType type
    ) {}

    public record TestCaseItem(
        String title,
        String preconditions,
        List<String> steps,
        String expectedResult
    ) {}

    public record ActionItem(
        String action,
        String rationale,
        Priority priority
    ) {}

    public record CheckupReport(
        String id,
        String aiRunId,
        String organizationId,
        String userId,
        ReportStatus status,
        TargetType targetType,
        String targetValue,
        String context,
        String goal,
        CheckupDepth depth,
        List<FindingItem> qualityRisks,
        List<FindingItem> missingOrUnclearRequirements,
        List<ScenarioItem> suggestedTestScenarios,
        List<TestCaseItem> suggestedTestCases,
        List<FindingItem> uxProductRisks,
        List<FindingItem> releaseReadinessNotes,
        List<ActionItem> recommendedNextActions,
        String rawAiOutput,
        Instant createdAt,
        Instant updatedAt
    ) {}

    public record CheckupReportView(
        String id,
        String status,
        String targetType,
        String targetValue,
        String depth,
        List<FindingItem> qualityRisks,
        List<FindingItem> missingOrUnclearRequirements,
        List<ScenarioItem> suggestedTestScenarios,
        List<TestCaseItem> suggestedTestCases,
        List<FindingItem> uxProductRisks,
        List<FindingItem> releaseReadinessNotes,
        List<ActionItem> recommendedNextActions,
        Instant createdAt,
        Instant updatedAt,
        boolean aiAssisted
    ) {}

    public static class AuthorizationNotConfirmedException extends RuntimeException {
        public AuthorizationNotConfirmedException() {
            super("É necessário confirmar autorização para analisar o alvo informado.");
        }
    }

    public static class CheckupValidationException extends RuntimeException {
        public final String field;

        public CheckupValidationException(String field, String message) {
            super(message);
            this.field = field;
        }
    }

    // ── Bloco 16: history & command center ────────────────────────────────────

    public record CheckupRunListItem(
        String aiRunId,
        String reportId,
        String status,
        String targetType,
        String targetValue,
        String depth,
        long estimatedCredits,
        long consumedCredits,
        long artifactCount,
        java.time.Instant createdAt,
        java.time.Instant completedAt
    ) {}

    public record CheckupRunsPage(
        java.util.List<CheckupRunListItem> content,
        long totalElements,
        int totalPages,
        int page,
        int size
    ) {}

    public record CheckupRunsSummary(
        long totalRuns,
        long completedRuns,
        long runningRuns,
        long failedRuns,
        long totalConsumedCredits,
        long totalArtifacts
    ) {}

    // ── end Bloco 16 ──────────────────────────────────────────────────────────
}
