package com.frankintest.api.ai;

public record AiResponse(
        String content,
        int inputTokens,
        int outputTokens,
        boolean success,
        String errorMessage
) {
    public static AiResponse success(String content, int inputTokens, int outputTokens) {
        return new AiResponse(content, inputTokens, outputTokens, true, null);
    }

    public static AiResponse failure(String errorMessage) {
        return new AiResponse(null, 0, 0, false, errorMessage);
    }
}
