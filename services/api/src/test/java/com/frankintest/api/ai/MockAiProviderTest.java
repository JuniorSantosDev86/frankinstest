package com.frankintest.api.ai;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class MockAiProviderTest {

    private final MockAiProvider provider = new MockAiProvider();

    @Test
    void generateContent_returnsSuccessForScenarioPrompt() {
        AiResponse response = provider.generateContent("Gere cenários de teste para esta regra");

        assertThat(response.success()).isTrue();
        assertThat(response.content()).isNotBlank();
        assertThat(response.content()).contains("SUGESTÃO IA");
        assertThat(response.content()).contains("validação humana");
        assertThat(response.inputTokens()).isPositive();
        assertThat(response.outputTokens()).isPositive();
    }

    @Test
    void generateContent_returnsSuccessForTestCasePrompt() {
        AiResponse response = provider.generateContent("Gere caso de teste para o cenário");

        assertThat(response.success()).isTrue();
        assertThat(response.content()).contains("SUGESTÃO IA");
    }

    @Test
    void generateContent_returnsSuccessForGenericPrompt() {
        AiResponse response = provider.generateContent("Analise este artefato de QA");

        assertThat(response.success()).isTrue();
        assertThat(response.content()).isNotBlank();
    }

    @Test
    void providerName_isMock() {
        assertThat(provider.getProviderName()).isEqualTo("mock");
    }
}
