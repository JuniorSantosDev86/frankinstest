package com.frankintest.api.checkup;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CheckupPromptBuilderTest {

    private final CheckupPromptBuilder builder = new CheckupPromptBuilder();

    private CheckupModels.CheckupRequest request(CheckupModels.TargetType type, String value) {
        return new CheckupModels.CheckupRequest(
            type, value, true,
            "Módulo de autenticação de um SaaS de gestão de projetos",
            "Identificar riscos de segurança",
            CheckupModels.CheckupDepth.STANDARD,
            CheckupModels.OutputMode.REPORT_WITH_SCENARIOS,
            "PMEs brasileiras", "Cadastro, login", null, "React"
        );
    }

    @Test
    void build_containsAllMandatoryFields() {
        String prompt = builder.build(request(CheckupModels.TargetType.URL, "https://example.com"));

        assertThat(prompt).contains("URL");
        assertThat(prompt).contains("https://example.com");
        assertThat(prompt).contains("Módulo de autenticação");
        assertThat(prompt).contains("Identificar riscos");
        assertThat(prompt).contains("STANDARD");
        assertThat(prompt).contains("REPORT_WITH_SCENARIOS");
    }

    @Test
    void build_instructsJsonOutput() {
        String prompt = builder.build(request(CheckupModels.TargetType.FEATURE_DESCRIPTION, "Login"));

        assertThat(prompt).containsIgnoringCase("json");
        assertThat(prompt).contains("qualityRisks");
        assertThat(prompt).contains("suggestedTestScenarios");
        assertThat(prompt).contains("recommendedNextActions");
    }

    @Test
    void build_instructsNotToClaimNoBugs() {
        String prompt = builder.build(request(CheckupModels.TargetType.FEATURE_DESCRIPTION, "Login"));

        // Prompt must instruct the AI not to guarantee absence of bugs — not make that claim itself
        assertThat(prompt).containsAnyOf("risco potencial", "validação recomendada", "requer confirmação", "Não afirme");
        assertThat(prompt.toLowerCase()).doesNotContain("garantimos que não há bugs");
        assertThat(prompt.toLowerCase()).doesNotContain("o sistema não tem bugs");
    }

    @Test
    void build_includesOptionalFieldsWhenPresent() {
        String prompt = builder.build(request(CheckupModels.TargetType.URL, "https://x.com"));

        assertThat(prompt).contains("PMEs brasileiras");
        assertThat(prompt).contains("Cadastro, login");
        assertThat(prompt).contains("React");
    }

    @Test
    void build_omitsOptionalFieldsWhenBlank() {
        var req = new CheckupModels.CheckupRequest(
            CheckupModels.TargetType.FEATURE_DESCRIPTION, "Sistema", true,
            "Módulo de autenticação de um SaaS de gestão de projetos",
            "Identificar riscos de segurança",
            CheckupModels.CheckupDepth.QUICK, CheckupModels.OutputMode.REPORT_ONLY,
            null, null, null, null
        );
        String prompt = builder.build(req);

        assertThat(prompt).doesNotContain("Público-alvo:");
        assertThat(prompt).doesNotContain("Fluxos críticos:");
    }
}
