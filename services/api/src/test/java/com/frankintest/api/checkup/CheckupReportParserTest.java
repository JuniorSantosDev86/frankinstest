package com.frankintest.api.checkup;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CheckupReportParserTest {

    private final CheckupReportParser parser = new CheckupReportParser(new ObjectMapper());

    private CheckupModels.CheckupRequest validRequest() {
        return new CheckupModels.CheckupRequest(
            CheckupModels.TargetType.FEATURE_DESCRIPTION,
            "Sistema de login",
            true,
            "Módulo de autenticação de um SaaS de gestão de projetos",
            "Identificar riscos de segurança",
            CheckupModels.CheckupDepth.STANDARD,
            CheckupModels.OutputMode.REPORT_WITH_SCENARIOS,
            null, null, null, null
        );
    }

    @Test
    void parse_validJson_populatesAllSections() {
        String raw = """
            {
              "qualityRisks": [{"title":"Risco 1","description":"Desc 1","severity":"HIGH"}],
              "missingOrUnclearRequirements": [],
              "suggestedTestScenarios": [{"title":"Cenário 1","description":"Desc","type":"POSITIVE"}],
              "suggestedTestCases": [{"title":"TC1","preconditions":"Pre","steps":["Passo 1"],"expectedResult":"OK"}],
              "uxProductRisks": [],
              "releaseReadinessNotes": [{"title":"Nota","description":"Desc","severity":"LOW"}],
              "recommendedNextActions": [{"action":"Ação","rationale":"Motivo","priority":"HIGH"}]
            }
            """;

        var report = parser.parse("r1", "run1", "org1", "u1", validRequest(), raw);

        assertThat(report.qualityRisks()).hasSize(1);
        assertThat(report.qualityRisks().get(0).severity()).isEqualTo(CheckupModels.Severity.HIGH);
        assertThat(report.suggestedTestScenarios()).hasSize(1);
        assertThat(report.suggestedTestCases()).hasSize(1);
        assertThat(report.releaseReadinessNotes()).hasSize(1);
        assertThat(report.recommendedNextActions()).hasSize(1);
        assertThat(report.rawAiOutput()).isEqualTo(raw);
        assertThat(report.status()).isEqualTo(CheckupModels.ReportStatus.DRAFT);
    }

    @Test
    void parse_oneSectionInvalid_otherSectionsPreserved() {
        String raw = """
            {
              "qualityRisks": [{"title":"Risco","description":"Desc","severity":"MEDIUM"}],
              "missingOrUnclearRequirements": "INVALID_NOT_AN_ARRAY",
              "suggestedTestScenarios": [],
              "suggestedTestCases": [],
              "uxProductRisks": [],
              "releaseReadinessNotes": [],
              "recommendedNextActions": []
            }
            """;

        var report = parser.parse("r2", "run2", "org1", "u1", validRequest(), raw);

        assertThat(report.qualityRisks()).hasSize(1);
        assertThat(report.missingOrUnclearRequirements()).isEmpty();
        assertThat(report.rawAiOutput()).isEqualTo(raw);
    }

    @Test
    void parse_totallyInvalidJson_throwsCheckupExecutionException() {
        // T009: parser no longer silently swallows parse errors — it throws so CheckupService can handle
        assertThatThrownBy(() ->
            parser.parse("r3", "run3", "org1", "u1", validRequest(), "NOT JSON AT ALL"))
            .isInstanceOf(CheckupService.CheckupExecutionException.class);
    }
}
