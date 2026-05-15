package com.frankintest.api.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Component("anthropicAiProvider")
public class AnthropicAiProvider implements AiProvider {

    private final String apiKey;
    private final String model;
    private final int maxTokens;
    private final String baseUrl;
    private final String apiVersion;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public AnthropicAiProvider(
            @Value("${ai.anthropic.api-key:}") String apiKey,
            @Value("${ai.anthropic.model:claude-sonnet-4-6}") String model,
            @Value("${ai.anthropic.max-tokens:1024}") int maxTokens,
            @Value("${ai.anthropic.base-url:https://api.anthropic.com}") String baseUrl,
            @Value("${ai.anthropic.version:2023-06-01}") String apiVersion
    ) {
        this.apiKey = apiKey;
        this.model = model;
        this.maxTokens = maxTokens;
        this.baseUrl = baseUrl;
        this.apiVersion = apiVersion;
        this.objectMapper = new ObjectMapper();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(30))
                .build();
    }

    @Override
    public AiResponse generateContent(String prompt) {
        if (apiKey == null || apiKey.isBlank()) {
            return AiResponse.failure("ANTHROPIC_API_KEY não configurada. Configure a variável de ambiente para usar IA real.");
        }

        try {
            String requestBody = buildRequestBody(prompt);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/v1/messages"))
                    .header("Content-Type", "application/json")
                    .header("x-api-key", apiKey)
                    .header("anthropic-version", apiVersion)
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .timeout(Duration.ofSeconds(60))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                return AiResponse.failure("Anthropic API retornou status " + response.statusCode() + ": " + response.body());
            }

            return parseResponse(response.body());
        } catch (Exception e) {
            return AiResponse.failure("Erro ao chamar Anthropic API: " + e.getMessage());
        }
    }

    @Override
    public String getProviderName() {
        return "anthropic";
    }

    private String buildRequestBody(String prompt) throws Exception {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", model);
        body.put("max_tokens", maxTokens);

        ArrayNode messages = objectMapper.createArrayNode();
        ObjectNode message = objectMapper.createObjectNode();
        message.put("role", "user");
        message.put("content", prompt);
        messages.add(message);
        body.set("messages", messages);

        return objectMapper.writeValueAsString(body);
    }

    private AiResponse parseResponse(String responseBody) throws Exception {
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode content = root.path("content");

        if (!content.isArray() || content.isEmpty()) {
            return AiResponse.failure("Resposta da Anthropic API não contém conteúdo");
        }

        String text = content.get(0).path("text").asText("");
        int inputTokens = root.path("usage").path("input_tokens").asInt(0);
        int outputTokens = root.path("usage").path("output_tokens").asInt(0);

        return AiResponse.success(text, inputTokens, outputTokens);
    }
}
