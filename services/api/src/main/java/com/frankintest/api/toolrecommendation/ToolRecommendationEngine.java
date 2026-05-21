package com.frankintest.api.toolrecommendation;

import com.frankintest.api.checkup.CheckupModels;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Component
public class ToolRecommendationEngine {

    private static final List<String> PERFORMANCE_KEYWORDS = List.of(
        "performance", "latência", "latencia", "carga", "load", "stress",
        "throughput", "rps", "tempo de resposta", "response time",
        "escalabilidade", "concorrência", "concurrent"
    );

    private static final List<String> JMETER_PROMOTION_KEYWORDS = List.of(
        "jmeter", "enterprise", "java", "legado", "legacy", "soap", "wsdl",
        "ftp", "jdbc", "distribuída", "distributed", "corporativo", "corporate"
    );

    public ToolRecommendationModels.ToolRecommendationResult compute(CheckupModels.CheckupReport report) {
        String inspectionText = buildInspectionText(report);

        List<ToolRecommendationModels.ToolRecommendationCategory> categories = new ArrayList<>();

        if (hasPerformanceKeywords(inspectionText)) {
            categories.add(buildPerformanceCategory(inspectionText));
        }

        return new ToolRecommendationModels.ToolRecommendationResult(
            report.id(),
            Instant.now(),
            categories
        );
    }

    private String buildInspectionText(CheckupModels.CheckupReport report) {
        StringBuilder sb = new StringBuilder();
        if (report.qualityRisks() != null) {
            for (CheckupModels.FindingItem item : report.qualityRisks()) {
                if (item.title() != null) sb.append(item.title()).append(" ");
                if (item.description() != null) sb.append(item.description()).append(" ");
            }
        }
        if (report.suggestedTestScenarios() != null) {
            for (CheckupModels.ScenarioItem item : report.suggestedTestScenarios()) {
                if (item.title() != null) sb.append(item.title()).append(" ");
                if (item.description() != null) sb.append(item.description()).append(" ");
            }
        }
        return sb.toString().toLowerCase();
    }

    private boolean hasPerformanceKeywords(String text) {
        return PERFORMANCE_KEYWORDS.stream().anyMatch(text::contains);
    }

    private boolean hasJmeterPromotionKeywords(String text) {
        return JMETER_PROMOTION_KEYWORDS.stream().anyMatch(text::contains);
    }

    private ToolRecommendationModels.ToolRecommendationCategory buildPerformanceCategory(String inspectionText) {
        boolean promoteJmeter = hasJmeterPromotionKeywords(inspectionText);

        ToolRecommendationModels.RecommendedTool k6;
        ToolRecommendationModels.RecommendedTool jmeter;

        if (promoteJmeter) {
            jmeter = new ToolRecommendationModels.RecommendedTool(
                "JMeter",
                "https://jmeter.apache.org/",
                ToolRecommendationModels.ToolPriority.PRIMARY,
                "JMeter é a escolha principal para este contexto enterprise, ambientes corporativos ou stacks Java/legado, com suporte a múltiplos protocolos (SOAP, WSDL, FTP, JDBC) e cenários de carga distribuída."
            );
            k6 = new ToolRecommendationModels.RecommendedTool(
                "k6",
                "https://k6.io/docs/",
                ToolRecommendationModels.ToolPriority.SECONDARY,
                "k6 é uma alternativa moderna recomendada para APIs REST e pipelines CI/CD, caso a equipe deseje adotar uma ferramenta baseada em JavaScript no futuro."
            );
        } else {
            k6 = new ToolRecommendationModels.RecommendedTool(
                "k6",
                "https://k6.io/docs/",
                ToolRecommendationModels.ToolPriority.PRIMARY,
                "k6 é a escolha recomendada para testes de performance em APIs REST e aplicações web modernas, com suporte a scripting em JavaScript e integração nativa com CI/CD."
            );
            jmeter = new ToolRecommendationModels.RecommendedTool(
                "JMeter",
                "https://jmeter.apache.org/",
                ToolRecommendationModels.ToolPriority.SECONDARY,
                "JMeter é uma alternativa consolidada, especialmente útil em ambientes enterprise com múltiplos protocolos ou equipes com histórico nesta ferramenta."
            );
        }

        String justification = promoteJmeter
            ? "O relatório indica contexto enterprise, stack Java/legado ou necessidade de múltiplos protocolos. JMeter é promovido como ferramenta principal para este cenário."
            : "O relatório apresenta riscos de performance. Testes de carga e stress são recomendados para validar comportamento sob demanda.";

        List<String> nextSteps = promoteJmeter
            ? List.of(
                "Instalar JMeter: https://jmeter.apache.org/download_jmeter.cgi",
                "Criar plano de teste (.jmx) para o endpoint ou serviço principal identificado no relatório",
                "Definir cenário de carga: threads, ramp-up e duração do teste",
                "Estabelecer thresholds de aprovação/reprovação: p95 < 500ms, taxa de erro < 1%",
                "Integrar execução ao pipeline de CI como etapa opcional de validação"
            )
            : List.of(
                "Instalar k6: https://k6.io/docs/get-started/installation/",
                "Criar script base de carga para o endpoint principal identificado no relatório",
                "Definir cenário de carga: usuários virtuais (VUs), ramp-up e duração",
                "Estabelecer thresholds de aprovação/reprovação: p95 < 500ms, taxa de erro < 1%",
                "Integrar execução ao pipeline de CI como etapa opcional de validação"
            );

        return new ToolRecommendationModels.ToolRecommendationCategory(
            "PERFORMANCE",
            "Testes de Performance",
            promoteJmeter ? List.of(jmeter, k6) : List.of(k6, jmeter),
            justification,
            nextSteps
        );
    }
}
