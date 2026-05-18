package com.frankintest.api.checkup;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CheckupPromptBuilderDisclaimerTest {

    private final CheckupPromptBuilder builder = new CheckupPromptBuilder();

    private CheckupModels.CheckupRequest request() {
        return new CheckupModels.CheckupRequest(
            CheckupModels.TargetType.FEATURE_DESCRIPTION,
            "Login com e-mail e senha",
            true, "MVP SaaS B2B", "Identificar riscos de QA",
            CheckupModels.CheckupDepth.STANDARD,
            CheckupModels.OutputMode.REPORT_WITH_SCENARIOS,
            null, null, null, null
        );
    }

    @Test
    void prompt_containsUncertaintyDisclaimer() {
        String prompt = builder.build(request());
        boolean hasDisclaimer =
            prompt.contains("não afirme") ||
            prompt.contains("risco potencial") ||
            prompt.contains("validação recomendada") ||
            prompt.contains("requer confirmação");

        assertThat(hasDisclaimer)
            .as("CheckupPromptBuilder must include at least one uncertainty disclaimer phrase per FR-022")
            .isTrue();
    }
}
