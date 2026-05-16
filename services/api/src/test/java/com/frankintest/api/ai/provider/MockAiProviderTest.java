package com.frankintest.api.ai.provider;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class MockAiProviderTest {

    private final MockAiProvider provider = new MockAiProvider();

    @Test
    void generate_returnsStructuredScenarioPayload() {
        AiProviderPort.AiProviderResponse response =
            provider.generate("Gere cenários de teste para esta regra");

        assertThat(response.success()).isTrue();
        assertThat(response.content()).contains("\"scenarios\"");
        assertThat(response.content()).contains("\"scenarioType\"");
        assertThat(response.inputTokens()).isPositive();
        assertThat(response.outputTokens()).isPositive();
    }

    @Test
    void generate_returnsStructuredTestCasePayload() {
        AiProviderPort.AiProviderResponse response =
            provider.generate("Gere casos de teste para o cenário");

        assertThat(response.success()).isTrue();
        assertThat(response.content()).contains("\"testCases\"");
        assertThat(response.content()).contains("\"expectedResult\"");
    }

    @Test
    void providerName_isMock() {
        assertThat(provider.getProviderName()).isEqualTo("mock");
    }

    @Test
    void forcedFailure_isDeterministicForLifecycleTests() {
        AiProviderPort.AiProviderResponse response = provider.generateWithForcedFailure();

        assertThat(response.success()).isFalse();
        assertThat(response.errorMessage()).contains("Falha simulada");
    }
}
