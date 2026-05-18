package com.frankintest.api.ai.provider;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.time.Duration;

@Component("structuredAnthropicAiProvider")
public class AnthropicAiProvider implements AiProviderPort {

    private static final Logger log = LoggerFactory.getLogger(AnthropicAiProvider.class);

    private final String apiKey;
    private final String model;
    private final int maxTokens;
    private final String baseUrl;
    private final String apiVersion;
    private final int timeoutSeconds;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public AnthropicAiProvider(
        @Value("${ai.anthropic.api-key:}") String apiKey,
        @Value("${ai.anthropic.model:claude-haiku-4-5-20251001}") String model,
        @Value("${ai.anthropic.max-tokens:4096}") int maxTokens,
        @Value("${ai.anthropic.base-url:https://api.anthropic.com}") String baseUrl,
        @Value("${ai.anthropic.version:2023-06-01}") String apiVersion,
        @Value("${ai.anthropic.timeout-seconds:30}") int timeoutSeconds
    ) {
        this.apiKey = apiKey;
        this.model = model;
        this.maxTokens = maxTokens;
        this.baseUrl = baseUrl;
        this.apiVersion = apiVersion;
        this.timeoutSeconds = timeoutSeconds;
        this.objectMapper = new ObjectMapper();
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(timeoutSeconds))
            .build();
    }

    @Override
    public AiProviderResponse generate(String prompt) {
        // security: never log api key
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("ANTHROPIC_API_KEY não configurada — chamada ao provedor bloqueada");
            return AiProviderResponse.failure(
                "Chave de API do provedor de IA não configurada. Configure ANTHROPIC_API_KEY para usar IA real.");
        }

        try {
            String requestBody = buildRequestBody(prompt);
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/v1/messages"))
                .header("Content-Type", "application/json")
                .header("x-api-key", apiKey)
                .header("anthropic-version", apiVersion)
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                return AiProviderResponse.failure(
                    "Provedor de IA retornou status inesperado: " + response.statusCode());
            }

            return parseResponse(response.body());
        } catch (HttpTimeoutException e) {
            return AiProviderResponse.failure("Timeout ao chamar provedor de IA após " + timeoutSeconds + " segundos.");
        } catch (Exception e) {
            return AiProviderResponse.failure("Erro ao chamar provedor de IA. Tente novamente mais tarde.");
        }
    }

    @Override
    public String getProviderName() {
        return "anthropic";
    }

    int getTimeoutSeconds() {
        return timeoutSeconds;
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

    private AiProviderResponse parseResponse(String responseBody) throws Exception {
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode content = root.path("content");

        if (!content.isArray() || content.isEmpty()) {
            return AiProviderResponse.failure("Resposta do provedor de IA não contém conteúdo.");
        }

        String text = content.get(0).path("text").asText("");
        int inputTokens = root.path("usage").path("input_tokens").asInt(0);
        int outputTokens = root.path("usage").path("output_tokens").asInt(0);

        return AiProviderResponse.success(text, inputTokens, outputTokens);
    }
}
