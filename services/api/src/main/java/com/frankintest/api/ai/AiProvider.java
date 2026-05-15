package com.frankintest.api.ai;

public interface AiProvider {
    AiResponse generateContent(String prompt);
    String getProviderName();
}
