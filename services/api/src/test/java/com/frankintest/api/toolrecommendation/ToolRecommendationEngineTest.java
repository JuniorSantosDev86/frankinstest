package com.frankintest.api.toolrecommendation;

import com.frankintest.api.checkup.CheckupModels;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ToolRecommendationEngineTest {

    private ToolRecommendationEngine engine;

    @BeforeEach
    void setUp() {
        engine = new ToolRecommendationEngine();
    }

    // ── Testes de detecção de keywords de performance ─────────────────────────

    @Test
    void qualityRisks_comPerformance_retornaCategoriaPERFORMANCE_k6Primary() {
        CheckupModels.CheckupReport report = buildReport(
            List.of(new CheckupModels.FindingItem("Risco de performance", "latência elevada", CheckupModels.Severity.HIGH)),
            List.of()
        );

        var result = engine.compute(report);

        assertThat(result.categories()).hasSize(1);
        assertThat(result.categories().get(0).categoryCode()).isEqualTo("PERFORMANCE");
        assertThat(result.categories().get(0).tools().get(0).name()).isEqualTo("k6");
        assertThat(result.categories().get(0).tools().get(0).priority()).isEqualTo(ToolRecommendationModels.ToolPriority.PRIMARY);
    }

    @Test
    void qualityRisks_comLatencia_acentuada_retornaPERFORMANCE_k6Primary() {
        CheckupModels.CheckupReport report = buildReport(
            List.of(new CheckupModels.FindingItem("Latência alta", "tempo de resposta elevado", CheckupModels.Severity.MEDIUM)),
            List.of()
        );

        var result = engine.compute(report);

        assertThat(result.categories()).hasSize(1);
        assertThat(result.categories().get(0).categoryCode()).isEqualTo("PERFORMANCE");
        assertThat(result.categories().get(0).tools().get(0).name()).isEqualTo("k6");
        assertThat(result.categories().get(0).tools().get(0).priority()).isEqualTo(ToolRecommendationModels.ToolPriority.PRIMARY);
    }

    @Test
    void qualityRisks_comJavaEEnterprise_retornaJMeterPrimary() {
        CheckupModels.CheckupReport report = buildReport(
            List.of(new CheckupModels.FindingItem("Performance enterprise", "sistema java com carga distribuída", CheckupModels.Severity.HIGH)),
            List.of()
        );

        var result = engine.compute(report);

        assertThat(result.categories()).hasSize(1);
        assertThat(result.categories().get(0).categoryCode()).isEqualTo("PERFORMANCE");
        assertThat(result.categories().get(0).tools().get(0).name()).isEqualTo("JMeter");
        assertThat(result.categories().get(0).tools().get(0).priority()).isEqualTo(ToolRecommendationModels.ToolPriority.PRIMARY);
    }

    @Test
    void qualityRisks_comLegado_retornaJMeterPrimary() {
        CheckupModels.CheckupReport report = buildReport(
            List.of(new CheckupModels.FindingItem("Sistema legado", "carga em sistema legado soap", CheckupModels.Severity.MEDIUM)),
            List.of()
        );

        var result = engine.compute(report);

        assertThat(result.categories()).hasSize(1);
        assertThat(result.categories().get(0).tools().get(0).name()).isEqualTo("JMeter");
        assertThat(result.categories().get(0).tools().get(0).priority()).isEqualTo(ToolRecommendationModels.ToolPriority.PRIMARY);
    }

    @Test
    void suggestedTestScenarios_comCarga_qualityRisksVazio_retornaPERFORMANCE() {
        CheckupModels.CheckupReport report = buildReport(
            List.of(),
            List.of(new CheckupModels.ScenarioItem("Cenário de carga", "teste de carga no endpoint", CheckupModels.ScenarioType.NEGATIVE))
        );

        var result = engine.compute(report);

        assertThat(result.categories()).hasSize(1);
        assertThat(result.categories().get(0).categoryCode()).isEqualTo("PERFORMANCE");
    }

    @Test
    void semKeywordsDePerformance_retornaCategoriesVazia() {
        CheckupModels.CheckupReport report = buildReport(
            List.of(new CheckupModels.FindingItem("Bug UI", "botão não responde", CheckupModels.Severity.LOW)),
            List.of()
        );

        var result = engine.compute(report);

        assertThat(result.categories()).isEmpty();
    }

    @Test
    void keywordsCaseInsensitive_PERFORMANCE_maiusculo_detecta() {
        CheckupModels.CheckupReport report = buildReport(
            List.of(new CheckupModels.FindingItem("PERFORMANCE ISSUE", "LATÊNCIA ALTA", CheckupModels.Severity.HIGH)),
            List.of()
        );

        var result = engine.compute(report);

        assertThat(result.categories()).hasSize(1);
        assertThat(result.categories().get(0).categoryCode()).isEqualTo("PERFORMANCE");
    }

    @Test
    void keywordsCaseInsensitive_JAVA_maiusculo_promoveJMeter() {
        CheckupModels.CheckupReport report = buildReport(
            List.of(new CheckupModels.FindingItem("Carga JAVA", "sistema JAVA enterprise com LOAD test", CheckupModels.Severity.HIGH)),
            List.of()
        );

        var result = engine.compute(report);

        assertThat(result.categories()).hasSize(1);
        assertThat(result.categories().get(0).tools().get(0).name()).isEqualTo("JMeter");
    }

    @Test
    void targetTypeURL_semKeywords_retornaCategoriesVazia() {
        CheckupModels.CheckupReport report = new CheckupModels.CheckupReport(
            "rpt_test", "run_test", "org_test", "user_test",
            CheckupModels.ReportStatus.DRAFT,
            CheckupModels.TargetType.URL,
            "https://example.com", null, null, CheckupModels.CheckupDepth.STANDARD,
            List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), List.of(),
            null, Instant.now(), Instant.now()
        );

        var result = engine.compute(report);

        assertThat(result.categories()).isEmpty();
    }

    @Test
    void resultado_contem_reportIdEGeneratedAtNaoNulos() {
        CheckupModels.CheckupReport report = buildReport(
            List.of(new CheckupModels.FindingItem("performance", "stress", CheckupModels.Severity.HIGH)),
            List.of()
        );

        var result = engine.compute(report);

        assertThat(result.reportId()).isEqualTo("rpt_test");
        assertThat(result.generatedAt()).isNotNull();
    }

    @Test
    void nextSteps_naoVazio_quandoPERFORMANCEPresente() {
        CheckupModels.CheckupReport report = buildReport(
            List.of(new CheckupModels.FindingItem("throughput", "rps alto", CheckupModels.Severity.HIGH)),
            List.of()
        );

        var result = engine.compute(report);

        assertThat(result.categories()).hasSize(1);
        assertThat(result.categories().get(0).nextSteps()).isNotEmpty();
        assertThat(result.categories().get(0).nextSteps().size()).isGreaterThanOrEqualTo(4);
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private CheckupModels.CheckupReport buildReport(
            List<CheckupModels.FindingItem> qualityRisks,
            List<CheckupModels.ScenarioItem> scenarios) {
        return new CheckupModels.CheckupReport(
            "rpt_test", "run_test", "org_test", "user_test",
            CheckupModels.ReportStatus.DRAFT,
            CheckupModels.TargetType.FEATURE_DESCRIPTION,
            "minha feature", null, null, CheckupModels.CheckupDepth.STANDARD,
            qualityRisks, List.of(), scenarios, List.of(), List.of(), List.of(), List.of(),
            null, Instant.now(), Instant.now()
        );
    }
}
