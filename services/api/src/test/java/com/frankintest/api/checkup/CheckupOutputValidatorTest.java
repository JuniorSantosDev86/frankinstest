package com.frankintest.api.checkup;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.frankintest.api.ai.provider.MockAiProvider;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CheckupOutputValidatorTest {

    private final CheckupOutputValidator validator = new CheckupOutputValidator();
    private final ObjectMapper mapper = new ObjectMapper();

    private static final String VALID_FULL_JSON = """
        {
          "qualityRisks": [{"title":"T","description":"D","severity":"HIGH"}],
          "missingOrUnclearRequirements": [{"title":"T","description":"D","severity":"LOW"}],
          "suggestedTestScenarios": [{"title":"T","description":"D","type":"POSITIVE"}],
          "suggestedTestCases": [{"title":"T","preconditions":"P","steps":["s1"],"expectedResult":"E"}],
          "uxProductRisks": [{"title":"T","description":"D","severity":"MEDIUM"}],
          "releaseReadinessNotes": [{"title":"T","description":"D","severity":"CRITICAL"}],
          "recommendedNextActions": [{"action":"A","rationale":"R","priority":"HIGH"}]
        }
        """;

    @Test
    void validFullReport_passes() throws Exception {
        var result = validator.validate(mapper.readTree(VALID_FULL_JSON));
        assertThat(result.valid()).isTrue();
    }

    @Test
    void validEmptyArraySections_passes() throws Exception {
        String json = """
            {
              "qualityRisks": [],
              "missingOrUnclearRequirements": [],
              "suggestedTestScenarios": [],
              "suggestedTestCases": [],
              "uxProductRisks": [],
              "releaseReadinessNotes": [],
              "recommendedNextActions": []
            }
            """;
        var result = validator.validate(mapper.readTree(json));
        assertThat(result.valid()).isTrue();
    }

    @Test
    void missingQualityRisks_fails() throws Exception {
        ObjectNode root = (ObjectNode) mapper.readTree(VALID_FULL_JSON);
        root.remove("qualityRisks");
        var result = validator.validate(root);
        assertThat(result.valid()).isFalse();
        assertThat(result.reason()).contains("qualityRisks");
    }

    @Test
    void missingMissingOrUnclearRequirements_fails() throws Exception {
        ObjectNode root = (ObjectNode) mapper.readTree(VALID_FULL_JSON);
        root.remove("missingOrUnclearRequirements");
        var result = validator.validate(root);
        assertThat(result.valid()).isFalse();
    }

    @Test
    void missingSuggestedTestScenarios_fails() throws Exception {
        ObjectNode root = (ObjectNode) mapper.readTree(VALID_FULL_JSON);
        root.remove("suggestedTestScenarios");
        var result = validator.validate(root);
        assertThat(result.valid()).isFalse();
    }

    @Test
    void missingSuggestedTestCases_fails() throws Exception {
        ObjectNode root = (ObjectNode) mapper.readTree(VALID_FULL_JSON);
        root.remove("suggestedTestCases");
        var result = validator.validate(root);
        assertThat(result.valid()).isFalse();
    }

    @Test
    void missingUxProductRisks_fails() throws Exception {
        ObjectNode root = (ObjectNode) mapper.readTree(VALID_FULL_JSON);
        root.remove("uxProductRisks");
        var result = validator.validate(root);
        assertThat(result.valid()).isFalse();
    }

    @Test
    void missingReleaseReadinessNotes_fails() throws Exception {
        ObjectNode root = (ObjectNode) mapper.readTree(VALID_FULL_JSON);
        root.remove("releaseReadinessNotes");
        var result = validator.validate(root);
        assertThat(result.valid()).isFalse();
    }

    @Test
    void missingRecommendedNextActions_fails() throws Exception {
        ObjectNode root = (ObjectNode) mapper.readTree(VALID_FULL_JSON);
        root.remove("recommendedNextActions");
        var result = validator.validate(root);
        assertThat(result.valid()).isFalse();
    }

    @Test
    void blankTitleInFinding_fails() throws Exception {
        String json = """
            {
              "qualityRisks": [{"title":"","description":"D","severity":"HIGH"}],
              "missingOrUnclearRequirements": [],
              "suggestedTestScenarios": [],
              "suggestedTestCases": [],
              "uxProductRisks": [],
              "releaseReadinessNotes": [],
              "recommendedNextActions": []
            }
            """;
        var result = validator.validate(mapper.readTree(json));
        assertThat(result.valid()).isFalse();
    }

    @Test
    void invalidSeverityInFinding_fails() throws Exception {
        String json = """
            {
              "qualityRisks": [{"title":"T","description":"D","severity":"EXTREME"}],
              "missingOrUnclearRequirements": [],
              "suggestedTestScenarios": [],
              "suggestedTestCases": [],
              "uxProductRisks": [],
              "releaseReadinessNotes": [],
              "recommendedNextActions": []
            }
            """;
        var result = validator.validate(mapper.readTree(json));
        assertThat(result.valid()).isFalse();
    }

    @Test
    void invalidScenarioType_fails() throws Exception {
        String json = """
            {
              "qualityRisks": [],
              "missingOrUnclearRequirements": [],
              "suggestedTestScenarios": [{"title":"T","description":"D","type":"INVALID"}],
              "suggestedTestCases": [],
              "uxProductRisks": [],
              "releaseReadinessNotes": [],
              "recommendedNextActions": []
            }
            """;
        var result = validator.validate(mapper.readTree(json));
        assertThat(result.valid()).isFalse();
    }

    @Test
    void emptyStepsArray_fails() throws Exception {
        String json = """
            {
              "qualityRisks": [],
              "missingOrUnclearRequirements": [],
              "suggestedTestScenarios": [],
              "suggestedTestCases": [{"title":"T","preconditions":"P","steps":[],"expectedResult":"E"}],
              "uxProductRisks": [],
              "releaseReadinessNotes": [],
              "recommendedNextActions": []
            }
            """;
        var result = validator.validate(mapper.readTree(json));
        assertThat(result.valid()).isFalse();
    }

    @Test
    void invalidPriorityInActions_fails() throws Exception {
        String json = """
            {
              "qualityRisks": [],
              "missingOrUnclearRequirements": [],
              "suggestedTestScenarios": [],
              "suggestedTestCases": [],
              "uxProductRisks": [],
              "releaseReadinessNotes": [],
              "recommendedNextActions": [{"action":"A","rationale":"R","priority":"URGENT"}]
            }
            """;
        var result = validator.validate(mapper.readTree(json));
        assertThat(result.valid()).isFalse();
    }

    @Test
    void mockAiProviderCheckupOutput_passesValidator() throws Exception {
        MockAiProvider mock = new MockAiProvider();
        var response = mock.generate("qualityRisks suggestedTestScenarios checkup");
        assertThat(response.success()).isTrue();
        var result = validator.validate(mapper.readTree(response.content()));
        assertThat(result.valid())
            .as("MockAiProvider checkup output must pass CheckupOutputValidator — fix mock if this fails")
            .isTrue();
    }
}
