package com.frankintest.api.ai.provider;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class AiProviderSelector {

    private final AiProviderPort anthropicProvider;
    private final MockAiProvider mockProvider;
    private final boolean mockEnabled;

    public AiProviderSelector(
        @Qualifier("structuredAnthropicAiProvider") AiProviderPort anthropicProvider,
        MockAiProvider mockProvider,
        @Value("${ai.mock-enabled:false}") boolean mockEnabled
    ) {
        this.anthropicProvider = anthropicProvider;
        this.mockProvider = mockProvider;
        this.mockEnabled = mockEnabled;
    }

    public AiProviderPort getProvider() {
        return mockEnabled ? mockProvider : anthropicProvider;
    }

    public MockAiProvider getMockProvider() {
        return mockProvider;
    }
}
