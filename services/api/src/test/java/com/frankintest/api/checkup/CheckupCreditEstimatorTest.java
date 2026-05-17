package com.frankintest.api.checkup;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CheckupCreditEstimatorTest {

    private final CheckupCreditEstimator estimator = new CheckupCreditEstimator();

    @Test
    void quick_reportOnly_returns10() {
        long credits = estimator.estimate(CheckupModels.CheckupDepth.QUICK, CheckupModels.OutputMode.REPORT_ONLY);
        assertThat(credits).isEqualTo(10);
    }

    @Test
    void quick_reportWithScenarios_returns15() {
        long credits = estimator.estimate(CheckupModels.CheckupDepth.QUICK, CheckupModels.OutputMode.REPORT_WITH_SCENARIOS);
        assertThat(credits).isEqualTo(15);
    }

    @Test
    void standard_reportOnly_returns20() {
        long credits = estimator.estimate(CheckupModels.CheckupDepth.STANDARD, CheckupModels.OutputMode.REPORT_ONLY);
        assertThat(credits).isEqualTo(20);
    }

    @Test
    void standard_reportWithScenarios_returns30() {
        long credits = estimator.estimate(CheckupModels.CheckupDepth.STANDARD, CheckupModels.OutputMode.REPORT_WITH_SCENARIOS);
        assertThat(credits).isEqualTo(30);
    }

    @Test
    void deep_reportOnly_returns35() {
        long credits = estimator.estimate(CheckupModels.CheckupDepth.DEEP, CheckupModels.OutputMode.REPORT_ONLY);
        assertThat(credits).isEqualTo(35);
    }

    @Test
    void deep_reportWithScenarios_returns53() {
        long credits = estimator.estimate(CheckupModels.CheckupDepth.DEEP, CheckupModels.OutputMode.REPORT_WITH_SCENARIOS);
        assertThat(credits).isEqualTo(53); // ceil(35 * 1.5) = ceil(52.5) = 53
    }

    @Test
    void validateRequest_rejectsWhenAuthorizationNotConfirmed() {
        var request = new CheckupModels.CheckupRequest(
            CheckupModels.TargetType.URL, "https://example.com", false,
            "Contexto de teste suficiente para validar", "Objetivo de teste",
            CheckupModels.CheckupDepth.QUICK, CheckupModels.OutputMode.REPORT_ONLY,
            null, null, null, null
        );
        assertThatThrownBy(() -> estimator.validateRequest(request))
            .isInstanceOf(CheckupModels.AuthorizationNotConfirmedException.class);
    }

    @Test
    void validateRequest_rejectsWhenContextTooShort() {
        var request = new CheckupModels.CheckupRequest(
            CheckupModels.TargetType.URL, "https://example.com", true,
            "Curto", "Objetivo",
            CheckupModels.CheckupDepth.QUICK, CheckupModels.OutputMode.REPORT_ONLY,
            null, null, null, null
        );
        assertThatThrownBy(() -> estimator.validateRequest(request))
            .isInstanceOf(CheckupModels.CheckupValidationException.class)
            .hasMessageContaining("context");
    }

    @Test
    void validateRequest_rejectsWhenGoalTooShort() {
        var request = new CheckupModels.CheckupRequest(
            CheckupModels.TargetType.URL, "https://example.com", true,
            "Contexto de teste suficiente para validar", "Curto",
            CheckupModels.CheckupDepth.QUICK, CheckupModels.OutputMode.REPORT_ONLY,
            null, null, null, null
        );
        assertThatThrownBy(() -> estimator.validateRequest(request))
            .isInstanceOf(CheckupModels.CheckupValidationException.class)
            .hasMessageContaining("goal");
    }

    @Test
    void validateRequest_rejectsWhenTargetValueEmptyForUrl() {
        var request = new CheckupModels.CheckupRequest(
            CheckupModels.TargetType.URL, "", true,
            "Contexto de teste suficiente para validar", "Objetivo válido",
            CheckupModels.CheckupDepth.QUICK, CheckupModels.OutputMode.REPORT_ONLY,
            null, null, null, null
        );
        assertThatThrownBy(() -> estimator.validateRequest(request))
            .isInstanceOf(CheckupModels.CheckupValidationException.class)
            .hasMessageContaining("targetValue");
    }

    @Test
    void validateRequest_acceptsValidRequest() {
        var request = new CheckupModels.CheckupRequest(
            CheckupModels.TargetType.FEATURE_DESCRIPTION,
            "Descrição da feature de login", true,
            "Módulo de autenticação de um SaaS de gestão de projetos",
            "Identificar riscos de segurança",
            CheckupModels.CheckupDepth.STANDARD, CheckupModels.OutputMode.REPORT_WITH_SCENARIOS,
            null, null, null, null
        );
        estimator.validateRequest(request); // should not throw
    }
}
