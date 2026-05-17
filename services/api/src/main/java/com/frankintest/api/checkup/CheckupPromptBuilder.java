package com.frankintest.api.checkup;

import org.springframework.stereotype.Component;

@Component
public class CheckupPromptBuilder {

    public String build(CheckupModels.CheckupRequest request) {
        var sb = new StringBuilder();
        sb.append("Você é um QA Lead experiente. Analise o alvo descrito abaixo e gere um relatório de QA estruturado em JSON.\n\n");
        sb.append("IMPORTANTE: Não afirme que o sistema garante ausência de bugs. Use termos como \"risco potencial\", \"validação recomendada\" e \"requer confirmação\".\n\n");
        sb.append("Tipo do alvo: ").append(request.targetType().name()).append("\n");
        sb.append("Alvo: ").append(request.targetValue()).append("\n");
        sb.append("Contexto: ").append(request.context()).append("\n");
        sb.append("Objetivo: ").append(request.goal()).append("\n");
        sb.append("Profundidade: ").append(request.depth().name()).append("\n");
        sb.append("Modo de output: ").append(request.outputMode().name()).append("\n");

        if (notBlank(request.targetAudience())) sb.append("Público-alvo: ").append(request.targetAudience()).append("\n");
        if (notBlank(request.criticalFlows())) sb.append("Fluxos críticos: ").append(request.criticalFlows()).append("\n");
        if (notBlank(request.knownRisks())) sb.append("Riscos conhecidos: ").append(request.knownRisks()).append("\n");
        if (notBlank(request.technologies())) sb.append("Tecnologias: ").append(request.technologies()).append("\n");

        appendTargetTypeFocus(sb, request.targetType());

        sb.append("""

Gere um JSON com exatamente estas seções (listas podem ser vazias se não houver itens):
{
  "qualityRisks": [{"title":"","description":"","severity":"LOW|MEDIUM|HIGH|CRITICAL"}],
  "missingOrUnclearRequirements": [{"title":"","description":"","severity":"LOW|MEDIUM|HIGH|CRITICAL"}],
  "suggestedTestScenarios": [{"title":"","description":"","type":"POSITIVE|NEGATIVE|EDGE_CASE"}],
  "suggestedTestCases": [{"title":"","preconditions":"","steps":[],"expectedResult":""}],
  "uxProductRisks": [{"title":"","description":"","severity":"LOW|MEDIUM|HIGH|CRITICAL"}],
  "releaseReadinessNotes": [{"title":"","description":"","severity":"LOW|MEDIUM|HIGH|CRITICAL"}],
  "recommendedNextActions": [{"action":"","rationale":"","priority":"LOW|MEDIUM|HIGH"}]
}

Responda APENAS com o JSON, sem markdown, sem texto adicional.
""");
        return sb.toString();
    }

    private void appendTargetTypeFocus(StringBuilder sb, CheckupModels.TargetType type) {
        sb.append("\nFoco especial para este tipo de alvo:\n");
        switch (type) {
            case URL -> sb.append("- Clareza da proposta de valor, visibilidade do CTA, riscos de formulário, acessibilidade básica, performance percebida, sinais de confiança.\n");
            case API_DESCRIPTION -> sb.append("- Cobertura de endpoints, cenários positivos e negativos, status codes esperados, validação de schema, autenticação/autorização, rate limit e tratamento de erros.\n");
            case MOBILE_FLOW -> sb.append("- Considerações de dispositivo e resolução, permissões, comportamento offline/conexão ruim, notificações push, riscos específicos de plataforma, navegação e persistência de estado.\n");
            case FEATURE_DESCRIPTION -> sb.append("- Riscos do caminho crítico, validação de inputs, estados de erro/vazio/loading, persistência de dados, lacunas de regra de negócio, edge cases.\n");
            default -> sb.append("- Analise os riscos mais relevantes com base no contexto fornecido.\n");
        }
    }

    private boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }
}
