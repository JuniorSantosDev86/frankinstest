package com.frankintest.api.checkup;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CheckupTargetTypeValidationTest {

    private final CheckupCreditEstimator estimator = new CheckupCreditEstimator();

    private CheckupModels.CheckupRequest requestWith(CheckupModels.TargetType type, String value) {
        return new CheckupModels.CheckupRequest(
            type, value, true,
            "Módulo de autenticação de um SaaS de gestão de projetos",
            "Identificar riscos de segurança",
            CheckupModels.CheckupDepth.QUICK,
            CheckupModels.OutputMode.REPORT_ONLY,
            null, null, null, null
        );
    }

    @ParameterizedTest
    @EnumSource(value = CheckupModels.TargetType.class, names = {"OTHER"}, mode = EnumSource.Mode.EXCLUDE)
    void validateRequest_nonOtherType_requiresNonEmptyTargetValue(CheckupModels.TargetType type) {
        assertThatThrownBy(() -> estimator.validateRequest(requestWith(type, "")))
            .isInstanceOf(CheckupModels.CheckupValidationException.class)
            .hasMessageContaining("targetValue");
    }

    @Test
    void validateRequest_otherType_allowsEmptyTargetValue() {
        assertThatCode(() -> estimator.validateRequest(requestWith(CheckupModels.TargetType.OTHER, "")))
            .doesNotThrowAnyException();
    }

    @ParameterizedTest
    @EnumSource(CheckupModels.TargetType.class)
    void validateRequest_allTypes_acceptValidInput(CheckupModels.TargetType type) {
        String value = type == CheckupModels.TargetType.OTHER ? "" : "Descrição válida do alvo";
        assertThatCode(() -> estimator.validateRequest(requestWith(type, value)))
            .doesNotThrowAnyException();
    }
}
