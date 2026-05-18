package com.frankintest.api.checkup;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CheckupReportParserMalformedJsonTest {

    private final CheckupReportParser parser = new CheckupReportParser(new ObjectMapper());

    private CheckupModels.CheckupRequest request() {
        return new CheckupModels.CheckupRequest(
            CheckupModels.TargetType.FEATURE_DESCRIPTION,
            "Login com e-mail",
            true, "contexto", "objetivo",
            CheckupModels.CheckupDepth.QUICK,
            CheckupModels.OutputMode.REPORT_ONLY,
            null, null, null, null
        );
    }

    @Test
    void malformedJson_throwsInsteadOfReturningEmptyReport() {
        assertThatThrownBy(() ->
            parser.parse("report-id", "run-id", "org-id", "user-id", request(), "not valid json {{{"))
            .isInstanceOf(CheckupService.CheckupExecutionException.class);
    }

    @Test
    void plainTextOutput_throwsInsteadOfReturningEmptyReport() {
        assertThatThrownBy(() ->
            parser.parse("report-id", "run-id", "org-id", "user-id", request(),
                "Desculpe, não posso gerar o relatório solicitado."))
            .isInstanceOf(CheckupService.CheckupExecutionException.class);
    }

    @Test
    void emptyString_throwsInsteadOfReturningEmptyReport() {
        assertThatThrownBy(() ->
            parser.parse("report-id", "run-id", "org-id", "user-id", request(), ""))
            .isInstanceOf(CheckupService.CheckupExecutionException.class);
    }
}
