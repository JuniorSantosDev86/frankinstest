package com.frankintest.api.checkup;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Component
public class CheckupReportParser {

    private final ObjectMapper mapper;

    public CheckupReportParser(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public CheckupModels.CheckupReport parse(
        String reportId,
        String aiRunId,
        String organizationId,
        String userId,
        CheckupModels.CheckupRequest request,
        String rawOutput
    ) {
        JsonNode root;
        try {
            root = mapper.readTree(rawOutput);
        } catch (Exception e) {
            root = mapper.createObjectNode();
        }

        Instant now = Instant.now();
        return new CheckupModels.CheckupReport(
            reportId, aiRunId, organizationId, userId,
            CheckupModels.ReportStatus.DRAFT,
            request.targetType(), request.targetValue(),
            request.context(), request.goal(), request.depth(),
            parseFindings(root, "qualityRisks"),
            parseFindings(root, "missingOrUnclearRequirements"),
            parseScenarios(root),
            parseTestCases(root),
            parseFindings(root, "uxProductRisks"),
            parseFindings(root, "releaseReadinessNotes"),
            parseActions(root),
            rawOutput,
            now, now
        );
    }

    private List<CheckupModels.FindingItem> parseFindings(JsonNode root, String field) {
        try {
            JsonNode node = root.get(field);
            if (node == null || !node.isArray()) return List.of();
            return mapper.convertValue(node, new TypeReference<List<CheckupModels.FindingItem>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    private List<CheckupModels.ScenarioItem> parseScenarios(JsonNode root) {
        try {
            JsonNode node = root.get("suggestedTestScenarios");
            if (node == null || !node.isArray()) return List.of();
            return mapper.convertValue(node, new TypeReference<List<CheckupModels.ScenarioItem>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    private List<CheckupModels.TestCaseItem> parseTestCases(JsonNode root) {
        try {
            JsonNode node = root.get("suggestedTestCases");
            if (node == null || !node.isArray()) return List.of();
            return mapper.convertValue(node, new TypeReference<List<CheckupModels.TestCaseItem>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    private List<CheckupModels.ActionItem> parseActions(JsonNode root) {
        try {
            JsonNode node = root.get("recommendedNextActions");
            if (node == null || !node.isArray()) return List.of();
            return mapper.convertValue(node, new TypeReference<List<CheckupModels.ActionItem>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }
}
