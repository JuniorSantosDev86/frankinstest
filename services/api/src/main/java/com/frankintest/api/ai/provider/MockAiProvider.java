package com.frankintest.api.ai.provider;

import org.springframework.stereotype.Component;

@Component("structuredMockAiProvider")
public class MockAiProvider implements AiProviderPort {

    @Override
    public AiProviderResponse generate(String prompt) {
        if (prompt.contains("force-provider-failure")) {
            return generateWithForcedFailure();
        }
        if (prompt.contains("force-invalid-output")) {
            return AiProviderResponse.success("{\"content\":\"sem artefatos estruturados\"}", 100, 100);
        }
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
        if (prompt.contains("qualityRisks") && prompt.contains("suggestedTestScenarios")) {
            return buildCheckupMockReport();
        }

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

    private String buildCheckupMockReport() {
        return """
            {
              "qualityRisks": [
                {"title": "Validação de campos obrigatórios ausente", "description": "O formulário pode aceitar submissões sem validar campos obrigatórios no backend.", "severity": "HIGH"},
                {"title": "Tratamento de erros de rede não implementado", "description": "Falhas de conectividade podem deixar o usuário sem feedback adequado.", "severity": "MEDIUM"}
              ],
              "missingOrUnclearRequirements": [
                {"title": "Critérios de aceitação de senha indefinidos", "description": "Não está especificado o tamanho mínimo e complexidade exigidos para a senha.", "severity": "MEDIUM"},
                {"title": "Comportamento após expiração de sessão não documentado", "description": "Não há requisito claro sobre o que acontece quando a sessão expira durante o fluxo.", "severity": "LOW"}
              ],
              "suggestedTestScenarios": [
                {"title": "Cadastro com dados válidos", "description": "Dado que o usuário preenche todos os campos corretamente\\nQuando submete o formulário\\nEntão deve ser redirecionado para a tela de confirmação", "type": "POSITIVE"},
                {"title": "Cadastro com e-mail duplicado", "description": "Dado que o e-mail já está cadastrado\\nQuando o usuário tenta se registrar\\nEntão deve ver mensagem de erro clara", "type": "NEGATIVE"},
                {"title": "Cadastro com campo no limite máximo", "description": "Dado que o usuário preenche o nome com exatamente o limite de caracteres\\nQuando submete\\nEntão o sistema deve aceitar sem truncar", "type": "EDGE_CASE"}
              ],
              "suggestedTestCases": [
                {"title": "Submissão com todos os campos preenchidos", "preconditions": "Usuário acessa a página de cadastro, nenhum dado pré-preenchido", "steps": ["Preencher nome completo", "Preencher e-mail válido", "Preencher senha válida", "Clicar em Cadastrar"], "expectedResult": "Usuário é redirecionado para tela de boas-vindas e recebe e-mail de confirmação"},
                {"title": "Submissão sem e-mail", "preconditions": "Usuário acessa a página de cadastro", "steps": ["Preencher nome e senha", "Deixar campo de e-mail vazio", "Clicar em Cadastrar"], "expectedResult": "Mensagem de validação exibida próxima ao campo de e-mail, formulário não submetido"}
              ],
              "uxProductRisks": [
                {"title": "Ausência de feedback visual durante carregamento", "description": "O botão de submit não indica estado de carregamento, podendo causar cliques duplos.", "severity": "MEDIUM"},
                {"title": "Mensagens de erro genéricas", "description": "Erros de validação podem não indicar claramente qual campo precisa de correção.", "severity": "LOW"}
              ],
              "releaseReadinessNotes": [
                {"title": "Testes de regressão recomendados antes do release", "description": "Fluxo de cadastro é crítico e deve ser coberto por testes automatizados antes de qualquer deploy.", "severity": "HIGH"},
                {"title": "Validação em dispositivos móveis necessária", "description": "O formulário não foi testado em viewports menores que 375px.", "severity": "MEDIUM"}
              ],
              "recommendedNextActions": [
                {"action": "Implementar validação no backend para todos os campos obrigatórios", "rationale": "Validação apenas no frontend é contornável e representa risco de segurança.", "priority": "HIGH"},
                {"action": "Adicionar indicador de carregamento no botão de submit", "rationale": "Reduz risco de dupla submissão e melhora percepção de qualidade.", "priority": "MEDIUM"},
                {"action": "Documentar critérios de aceitação de senha na especificação", "rationale": "Requisito indefinido impede testes completos e pode gerar retrabalho.", "priority": "LOW"}
              ]
            }
            """;
    }

    public AiProviderResponse generateWithForcedFailure() {
        return AiProviderResponse.failure("Falha simulada do provedor para testes de lifecycle");
    }
}
