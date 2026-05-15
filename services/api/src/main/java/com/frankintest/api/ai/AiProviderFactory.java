package com.frankintest.api.ai;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class AiProviderFactory {

    private final AiProvider anthropicProvider;
    private final AiProvider mockProvider;
    private final boolean mockEnabled;

    public AiProviderFactory(
            @Qualifier("anthropicAiProvider") AiProvider anthropicProvider,
            @Qualifier("mockAiProvider") AiProvider mockProvider,
            @Value("${ai.mock-enabled:false}") boolean mockEnabled
    ) {
        this.anthropicProvider = anthropicProvider;
        this.mockProvider = mockProvider;
        this.mockEnabled = mockEnabled;
    }

    public AiProvider getProvider() {
        if (mockEnabled) {
            return mockProvider;
        }
        return anthropicProvider;
    }
}
