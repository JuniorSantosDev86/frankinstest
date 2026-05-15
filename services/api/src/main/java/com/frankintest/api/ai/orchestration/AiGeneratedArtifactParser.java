package com.frankintest.api.ai.orchestration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class AiGeneratedArtifactParser {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<AiTestDesignDtos.ParsedScenario> parseScenarios(String providerOutput) {
        if (providerOutput == null || providerOutput.isBlank()) {
            throw new InvalidAiOutputException("Output do provedor está vazio");
        }

        try {
            String json = extractJson(providerOutput);
            JsonNode root = objectMapper.readTree(json);
            JsonNode scenariosNode = root.path("scenarios");

            if (!scenariosNode.isArray() || scenariosNode.isEmpty()) {
                throw new InvalidAiOutputException("Output não contém array 'scenarios' válido");
            }

            List<AiTestDesignDtos.ParsedScenario> results = new ArrayList<>();
            for (JsonNode node : scenariosNode) {
                String title = node.path("title").asText("").trim();
                String description = node.path("description").asText("").trim();
                String scenarioType = node.path("scenarioType").asText("positive").trim();

                if (title.isBlank()) {
                    throw new InvalidAiOutputException("Cenário sem título no output do provedor");
                }

                results.add(new AiTestDesignDtos.ParsedScenario(title, description, scenarioType));
            }

            return results;
        } catch (InvalidAiOutputException e) {
            throw e;
        } catch (Exception e) {
            throw new InvalidAiOutputException("Falha ao parsear output de cenários: " + e.getMessage());
        }
    }

    public List<AiTestDesignDtos.ParsedTestCase> parseTestCases(String providerOutput) {
        if (providerOutput == null || providerOutput.isBlank()) {
            throw new InvalidAiOutputException("Output do provedor está vazio");
        }

        try {
            String json = extractJson(providerOutput);
            JsonNode root = objectMapper.readTree(json);
            JsonNode testCasesNode = root.path("testCases");

            if (!testCasesNode.isArray() || testCasesNode.isEmpty()) {
                throw new InvalidAiOutputException("Output não contém array 'testCases' válido");
            }

            List<AiTestDesignDtos.ParsedTestCase> results = new ArrayList<>();
            for (JsonNode node : testCasesNode) {
                String title = node.path("title").asText("").trim();
                String preconditions = node.path("preconditions").asText("").trim();
                String steps = node.path("steps").asText("").trim();
                String expectedResult = node.path("expectedResult").asText("").trim();
                String testType = node.path("testType").asText("manual").trim();
                boolean automationCandidate = node.path("automationCandidate").asBoolean(false);

                if (title.isBlank()) {
                    throw new InvalidAiOutputException("Caso de teste sem título no output do provedor");
                }
                if (steps.isBlank()) {
                    throw new InvalidAiOutputException("Caso de teste sem passos no output do provedor");
                }

                results.add(new AiTestDesignDtos.ParsedTestCase(
                    title, preconditions, steps, expectedResult, testType, automationCandidate));
            }

            return results;
        } catch (InvalidAiOutputException e) {
            throw e;
        } catch (Exception e) {
            throw new InvalidAiOutputException("Falha ao parsear output de casos de teste: " + e.getMessage());
        }
    }

    private String extractJson(String raw) {
        int start = raw.indexOf('{');
        int end = raw.lastIndexOf('}');
        if (start < 0 || end < 0 || end <= start) {
            throw new InvalidAiOutputException("Nenhum JSON encontrado no output do provedor");
        }
        return raw.substring(start, end + 1);
    }

    public static class InvalidAiOutputException extends RuntimeException {
        public InvalidAiOutputException(String message) {
            super(message);
        }
    }
}
