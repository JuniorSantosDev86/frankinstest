package com.frankintest.api.checkup;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class CheckupOutputValidator {

    private static final Set<String> SEVERITY_VALUES = Set.of("LOW", "MEDIUM", "HIGH", "CRITICAL");
    private static final Set<String> SCENARIO_TYPE_VALUES = Set.of("POSITIVE", "NEGATIVE", "EDGE_CASE");
    private static final Set<String> PRIORITY_VALUES = Set.of("LOW", "MEDIUM", "HIGH");

    public record ValidationResult(boolean valid, String reason) {}

    public ValidationResult validate(JsonNode root) {
        if (root == null || root.isNull() || root.isMissingNode()) {
            return fail("Saída do provedor não contém JSON válido.");
        }

        ValidationResult qr = validateFindingsSection(root, "qualityRisks", SEVERITY_VALUES);
        if (!qr.valid()) return qr;

        ValidationResult mu = validateFindingsSection(root, "missingOrUnclearRequirements", SEVERITY_VALUES);
        if (!mu.valid()) return mu;

        ValidationResult ts = validateScenarioSection(root);
        if (!ts.valid()) return ts;

        ValidationResult tc = validateTestCaseSection(root);
        if (!tc.valid()) return tc;

        ValidationResult ux = validateFindingsSection(root, "uxProductRisks", SEVERITY_VALUES);
        if (!ux.valid()) return ux;

        ValidationResult rr = validateFindingsSection(root, "releaseReadinessNotes", SEVERITY_VALUES);
        if (!rr.valid()) return rr;

        ValidationResult na = validateActionsSection(root);
        if (!na.valid()) return na;

        return new ValidationResult(true, null);
    }

    private ValidationResult validateFindingsSection(JsonNode root, String key, Set<String> enumValues) {
        JsonNode section = root.get(key);
        if (section == null || section.isNull() || !section.isArray()) {
            return fail("Seção obrigatória ausente ou inválida: " + key);
        }
        for (JsonNode item : section) {
            if (isBlankText(item, "title") || isBlankText(item, "description")) {
                return fail("Item em '" + key + "' com campo obrigatório ausente ou vazio.");
            }
            String sev = item.path("severity").asText("");
            if (!enumValues.contains(sev)) {
                return fail("Valor de 'severity' inválido em '" + key + "'.");
            }
        }
        return ok();
    }

    private ValidationResult validateScenarioSection(JsonNode root) {
        JsonNode section = root.get("suggestedTestScenarios");
        if (section == null || section.isNull() || !section.isArray()) {
            return fail("Seção obrigatória ausente ou inválida: suggestedTestScenarios");
        }
        for (JsonNode item : section) {
            if (isBlankText(item, "title") || isBlankText(item, "description")) {
                return fail("Item em 'suggestedTestScenarios' com campo obrigatório ausente ou vazio.");
            }
            String type = item.path("type").asText("");
            if (!SCENARIO_TYPE_VALUES.contains(type)) {
                return fail("Valor de 'type' inválido em 'suggestedTestScenarios'.");
            }
        }
        return ok();
    }

    private ValidationResult validateTestCaseSection(JsonNode root) {
        JsonNode section = root.get("suggestedTestCases");
        if (section == null || section.isNull() || !section.isArray()) {
            return fail("Seção obrigatória ausente ou inválida: suggestedTestCases");
        }
        for (JsonNode item : section) {
            if (isBlankText(item, "title") || isBlankText(item, "preconditions") || isBlankText(item, "expectedResult")) {
                return fail("Item em 'suggestedTestCases' com campo obrigatório ausente ou vazio.");
            }
            JsonNode steps = item.get("steps");
            if (steps == null || !steps.isArray() || steps.isEmpty()) {
                return fail("Campo 'steps' em 'suggestedTestCases' deve ser array não vazio.");
            }
        }
        return ok();
    }

    private ValidationResult validateActionsSection(JsonNode root) {
        JsonNode section = root.get("recommendedNextActions");
        if (section == null || section.isNull() || !section.isArray()) {
            return fail("Seção obrigatória ausente ou inválida: recommendedNextActions");
        }
        for (JsonNode item : section) {
            if (isBlankText(item, "action") || isBlankText(item, "rationale")) {
                return fail("Item em 'recommendedNextActions' com campo obrigatório ausente ou vazio.");
            }
            String priority = item.path("priority").asText("");
            if (!PRIORITY_VALUES.contains(priority)) {
                return fail("Valor de 'priority' inválido em 'recommendedNextActions'.");
            }
        }
        return ok();
    }

    private boolean isBlankText(JsonNode item, String field) {
        JsonNode node = item.get(field);
        return node == null || node.isNull() || node.asText("").isBlank();
    }

    private ValidationResult ok() {
        return new ValidationResult(true, null);
    }

    private ValidationResult fail(String reason) {
        return new ValidationResult(false, reason);
    }
}
