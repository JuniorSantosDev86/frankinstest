package com.frankintest.api.ai;

import org.springframework.stereotype.Component;

@Component("mockAiProvider")
public class MockAiProvider implements AiProvider {

    @Override
    public AiResponse generateContent(String prompt) {
        String content = buildMockContent(prompt);
        int inputTokens = Math.max(1, prompt.length() / 4);
        int outputTokens = Math.max(64, content.length() / 4);
        return AiResponse.success(content, inputTokens, outputTokens);
    }

    @Override
    public String getProviderName() {
        return "mock";
    }

    private String buildMockContent(String prompt) {
        if (prompt.contains("cenário") || prompt.contains("scenario")) {
            return """
                    [SUGESTÃO IA — requer validação humana]

                    **Cenário 1: Fluxo principal bem-sucedido**
                    Dado que o usuário fornece dados válidos
                    Quando a ação é executada
                    Então o sistema deve confirmar o sucesso

                    **Cenário 2: Entrada inválida**
                    Dado que o usuário fornece dados inválidos
                    Quando a ação é executada
                    Então o sistema deve exibir mensagem de erro clara

                    **Cenário 3: Caso de borda**
                    Dado que os dados estão nos limites permitidos
                    Quando a ação é executada
                    Então o sistema deve lidar corretamente com o limite

                    Nota: Estes cenários são sugestões iniciais baseadas no contexto fornecido. \
                    Requerem revisão e validação por QA antes de uso em produção.
                    """;
        }

        if (prompt.contains("caso de teste") || prompt.contains("test case")) {
            return """
                    [SUGESTÃO IA — requer validação humana]

                    **Caso de Teste 1: Validação com dado válido**
                    - Pré-condição: sistema disponível, dados válidos preparados
                    - Passos: 1) Navegar para a funcionalidade; 2) Inserir dado válido; 3) Confirmar ação
                    - Resultado esperado: operação executada com sucesso, feedback visual confirmado

                    **Caso de Teste 2: Validação com dado inválido**
                    - Pré-condição: sistema disponível
                    - Passos: 1) Navegar para a funcionalidade; 2) Inserir dado inválido; 3) Tentar confirmar
                    - Resultado esperado: mensagem de erro exibida, operação bloqueada

                    Nota: Casos gerados por IA. Validação manual obrigatória antes de execução em produção.
                    """;
        }

        return """
                [SUGESTÃO IA — requer validação humana]

                Baseado no contexto fornecido, os seguintes pontos de atenção foram identificados:
                1. Validar comportamento esperado
                2. Verificar casos de borda
                3. Confirmar critérios de aceite

                Nota: Conteúdo gerado por IA. Requer revisão humana antes de uso.
                """;
    }
}
