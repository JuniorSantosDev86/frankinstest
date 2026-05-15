package com.frankintest.api.ai.provider;

import org.springframework.stereotype.Component;

@Component("structuredMockAiProvider")
public class MockAiProvider implements AiProviderPort {

    @Override
    public AiProviderResponse generate(String prompt) {
        String content = buildMockContent(prompt);
        int inputTokens = Math.max(1, prompt.length() / 4);
        int outputTokens = Math.max(64, content.length() / 4);
        return AiProviderResponse.success(content, inputTokens, outputTokens);
    }

    @Override
    public String getProviderName() {
        return "mock";
    }

    private String buildMockContent(String prompt) {
        // Test cases check FIRST — prompt contains "casos de teste" but also "scenarioId"
        if (prompt.contains("casos de teste")) {
            return """
                {
                  "testCases": [
                    {
                      "title": "Validação com dado válido",
                      "preconditions": "Sistema disponível, usuário autenticado, dados válidos preparados",
                      "steps": "1. Navegar para a funcionalidade\\n2. Preencher com dados válidos\\n3. Confirmar ação",
                      "expectedResult": "Operação executada com sucesso, feedback visual confirmado",
                      "testType": "manual",
                      "automationCandidate": true
                    },
                    {
                      "title": "Validação com dado inválido",
                      "preconditions": "Sistema disponível, usuário autenticado",
                      "steps": "1. Navegar para a funcionalidade\\n2. Preencher com dados inválidos\\n3. Tentar confirmar",
                      "expectedResult": "Mensagem de erro clara exibida, operação bloqueada",
                      "testType": "manual",
                      "automationCandidate": false
                    }
                  ]
                }
                """;
        }

        if (prompt.contains("cenários") || prompt.contains("Gere cenários")) {
            return """
                {
                  "scenarios": [
                    {
                      "title": "Fluxo principal bem-sucedido",
                      "description": "Dado que o usuário fornece dados válidos\\nQuando a ação é executada\\nEntão o sistema deve confirmar o sucesso",
                      "scenarioType": "positive"
                    },
                    {
                      "title": "Entrada inválida rejeitada",
                      "description": "Dado que o usuário fornece dados inválidos\\nQuando a ação é executada\\nEntão o sistema deve exibir mensagem de erro clara",
                      "scenarioType": "negative"
                    },
                    {
                      "title": "Caso de borda no limite",
                      "description": "Dado que os dados estão nos limites permitidos\\nQuando a ação é executada\\nEntão o sistema deve lidar corretamente",
                      "scenarioType": "edge"
                    }
                  ]
                }
                """;
        }

        return """
            {
              "content": "Conteúdo gerado por IA. Requer revisão humana antes de uso.",
              "note": "Sugestão inicial baseada no contexto fornecido."
            }
            """;
    }

    public AiProviderResponse generateWithForcedFailure() {
        return AiProviderResponse.failure("Falha simulada do provedor para testes de lifecycle");
    }
}
