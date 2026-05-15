package com.frankintest.api.ai.provider;

public interface AiProviderPort {

    AiProviderResponse generate(String prompt);

    String getProviderName();

    record AiProviderResponse(
        String content,
        int inputTokens,
        int outputTokens,
        boolean success,
        String errorMessage
    ) {
        public static AiProviderResponse success(String content, int inputTokens, int outputTokens) {
            return new AiProviderResponse(content, inputTokens, outputTokens, true, null);
        }

        public static AiProviderResponse failure(String errorMessage) {
            return new AiProviderResponse(null, 0, 0, false, errorMessage);
        }
    }
}
