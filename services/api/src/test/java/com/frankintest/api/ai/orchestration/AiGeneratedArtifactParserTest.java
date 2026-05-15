package com.frankintest.api.ai.orchestration;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AiGeneratedArtifactParserTest {

    private AiGeneratedArtifactParser parser;

    @BeforeEach
    void setUp() {
        parser = new AiGeneratedArtifactParser();
    }

    @Test
    void parseScenarios_validJson_returnsScenarios() {
        String input = """
            {
              "scenarios": [
                {"title": "Cenário 1", "description": "Dado/Quando/Então 1", "scenarioType": "positive"},
                {"title": "Cenário 2", "description": "Dado/Quando/Então 2", "scenarioType": "negative"}
              ]
            }
            """;

        List<AiTestDesignDtos.ParsedScenario> result = parser.parseScenarios(input);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).title()).isEqualTo("Cenário 1");
        assertThat(result.get(0).scenarioType()).isEqualTo("positive");
        assertThat(result.get(1).title()).isEqualTo("Cenário 2");
    }

    @Test
    void parseScenarios_jsonEmbeddedInText_extractsSuccessfully() {
        String input = "Aqui está o resultado:\n" +
            "{\"scenarios\":[{\"title\":\"Título\",\"description\":\"Desc\",\"scenarioType\":\"edge\"}]}\n" +
            "Fim.";

        List<AiTestDesignDtos.ParsedScenario> result = parser.parseScenarios(input);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).title()).isEqualTo("Título");
    }

    @Test
    void parseScenarios_emptyOutput_throwsInvalidAiOutputException() {
        assertThatThrownBy(() -> parser.parseScenarios(""))
            .isInstanceOf(AiGeneratedArtifactParser.InvalidAiOutputException.class);
    }

    @Test
    void parseScenarios_noJsonInOutput_throwsInvalidAiOutputException() {
        assertThatThrownBy(() -> parser.parseScenarios("Sem JSON aqui."))
            .isInstanceOf(AiGeneratedArtifactParser.InvalidAiOutputException.class);
    }

    @Test
    void parseScenarios_emptyScenariosArray_throwsInvalidAiOutputException() {
        assertThatThrownBy(() -> parser.parseScenarios("{\"scenarios\":[]}"))
            .isInstanceOf(AiGeneratedArtifactParser.InvalidAiOutputException.class);
    }

    @Test
    void parseScenarios_missingTitle_throwsInvalidAiOutputException() {
        String input = "{\"scenarios\":[{\"description\":\"desc\",\"scenarioType\":\"positive\"}]}";
        assertThatThrownBy(() -> parser.parseScenarios(input))
            .isInstanceOf(AiGeneratedArtifactParser.InvalidAiOutputException.class);
    }

    @Test
    void parseTestCases_validJson_returnsTestCases() {
        String input = """
            {
              "testCases": [
                {
                  "title": "CT-001",
                  "preconditions": "Sistema disponível",
                  "steps": "1. Navegar 2. Preencher 3. Confirmar",
                  "expectedResult": "Sucesso",
                  "testType": "manual",
                  "automationCandidate": true
                }
              ]
            }
            """;

        List<AiTestDesignDtos.ParsedTestCase> result = parser.parseTestCases(input);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).title()).isEqualTo("CT-001");
        assertThat(result.get(0).automationCandidate()).isTrue();
    }

    @Test
    void parseTestCases_missingSteps_throwsInvalidAiOutputException() {
        String input = "{\"testCases\":[{\"title\":\"CT\",\"expectedResult\":\"ok\"}]}";
        assertThatThrownBy(() -> parser.parseTestCases(input))
            .isInstanceOf(AiGeneratedArtifactParser.InvalidAiOutputException.class);
    }

    @Test
    void parseTestCases_emptyOutput_throwsInvalidAiOutputException() {
        assertThatThrownBy(() -> parser.parseTestCases(null))
            .isInstanceOf(AiGeneratedArtifactParser.InvalidAiOutputException.class);
    }
}
