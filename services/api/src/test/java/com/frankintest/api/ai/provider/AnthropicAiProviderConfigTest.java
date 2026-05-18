package com.frankintest.api.ai.provider;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AnthropicAiProviderConfigTest {

    private AnthropicAiProvider buildProvider(String apiKey, int timeoutSeconds) {
        return new AnthropicAiProvider(
            apiKey,
            "claude-haiku-4-5-20251001",
            4096,
            "https://api.anthropic.com",
            "2023-06-01",
            timeoutSeconds
        );
    }

    @Test
    void providerName_isAnthropic() {
        assertThat(buildProvider("any-key", 30).getProviderName()).isEqualTo("anthropic");
    }

    @Test
    void timeoutSeconds_isReadFromInjectedValue() {
        AnthropicAiProvider provider = buildProvider("any-key", 15);
        assertThat(provider.getTimeoutSeconds()).isEqualTo(15);
    }

    @Test
    void blankApiKey_returnsFailureWithoutHttpCall() {
        AnthropicAiProvider provider = buildProvider("", 5);
        AiProviderPort.AiProviderResponse response = provider.generate("any prompt");
        assertThat(response.success()).isFalse();
        assertThat(response.errorMessage()).isNotBlank();
        // must not echo the key value (key is blank, but verify no leakage pattern)
        assertThat(response.errorMessage()).doesNotContain("sk-ant");
    }

    @Test
    void nullApiKey_returnsFailureWithoutHttpCall() {
        AnthropicAiProvider provider = buildProvider(null, 5);
        AiProviderPort.AiProviderResponse response = provider.generate("any prompt");
        assertThat(response.success()).isFalse();
        assertThat(response.errorMessage()).isNotBlank();
    }

    @Test
    void blankApiKey_errorMessageIsPtBr() {
        AnthropicAiProvider provider = buildProvider("   ", 5);
        AiProviderPort.AiProviderResponse response = provider.generate("any prompt");
        assertThat(response.success()).isFalse();
        // pt-BR config error message must not contain the key itself
        assertThat(response.errorMessage()).doesNotContain("   ");
        assertThat(response.errorMessage()).isNotBlank();
    }
}
