import type {
  AiEstimateRequest,
  AiEstimateResponse,
  AiGenerateScenariosRequest,
  AiGenerateTestCasesRequest,
  AiRunResult,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_AI === "true";

export async function estimateGeneration(request: AiEstimateRequest): Promise<AiEstimateResponse> {
  if (USE_MOCK) {
    return mockEstimate(request.context);
  }

  const response = await fetch(`${API_BASE}/api/ai/estimate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Erro ao estimar créditos: ${response.status}`);
  }

  return response.json() as Promise<AiEstimateResponse>;
}

export async function generateScenarios(request: AiGenerateScenariosRequest): Promise<AiRunResult> {
  if (USE_MOCK) {
    return mockGenerateScenarios(request.businessRuleTitle);
  }

  const response = await fetch(`${API_BASE}/api/ai/scenarios/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      aiRunId: "",
      status: "failed",
      outputArtifactType: null,
      output: null,
      consumedCredits: 0,
      errorMessage: data?.errorMessage ?? "Erro ao gerar cenários",
    };
  }

  return data as AiRunResult;
}

export async function generateTestCases(request: AiGenerateTestCasesRequest): Promise<AiRunResult> {
  if (USE_MOCK) {
    return mockGenerateTestCases(request.scenarioTitle);
  }

  const response = await fetch(`${API_BASE}/api/ai/test-cases/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      aiRunId: "",
      status: "failed",
      outputArtifactType: null,
      output: null,
      consumedCredits: 0,
      errorMessage: data?.errorMessage ?? "Erro ao gerar casos de teste",
    };
  }

  return data as AiRunResult;
}

function mockEstimate(context: string): AiEstimateResponse {
  const base = 30;
  const contextCredits = Math.floor((context?.length ?? 0) / 100);
  return {
    estimatedCredits: Math.max(1, base + contextCredits),
    pricingNote: "Estimativa local de demonstração. Sem cobrança real.",
  };
}

function mockGenerateScenarios(title: string): AiRunResult {
  return {
    aiRunId: `mock_run_${Date.now()}`,
    status: "completed",
    outputArtifactType: "test_scenario",
    output: `[SUGESTÃO IA — requer validação humana]

**Cenário 1: Fluxo principal bem-sucedido**
Dado que o usuário fornece dados válidos para: ${title}
Quando a ação é executada
Então o sistema deve confirmar o sucesso e exibir feedback claro

**Cenário 2: Entrada inválida rejeitada**
Dado que o usuário fornece dados inválidos
Quando tenta executar a ação
Então o sistema deve exibir mensagem de erro descritiva e bloquear o avanço

**Cenário 3: Caso de borda no limite**
Dado que os dados estão exatamente no limite permitido pelo sistema
Quando a ação é executada
Então o sistema deve processar corretamente sem comportamento inesperado

Nota: Cenários sugeridos por IA. Requerem revisão e validação por QA antes de uso em produção.`,
    consumedCredits: 2,
    errorMessage: null,
  };
}

function mockGenerateTestCases(title: string): AiRunResult {
  return {
    aiRunId: `mock_run_${Date.now()}`,
    status: "completed",
    outputArtifactType: "test_case",
    output: `[SUGESTÃO IA — requer validação humana]

**Caso de Teste 1: ${title} — dado válido**
- Pré-condição: sistema disponível, usuário autenticado, dados válidos preparados
- Passos:
  1. Navegar para a funcionalidade
  2. Preencher os campos com dados válidos
  3. Confirmar a ação
- Resultado esperado: operação executada com sucesso, feedback visual confirmado

**Caso de Teste 2: ${title} — dado inválido**
- Pré-condição: sistema disponível, usuário autenticado
- Passos:
  1. Navegar para a funcionalidade
  2. Preencher com dados inválidos ou em branco
  3. Tentar confirmar
- Resultado esperado: mensagem de erro clara exibida, operação bloqueada

Nota: Casos gerados por IA. Validação manual obrigatória antes de execução em produção.`,
    consumedCredits: 3,
    errorMessage: null,
  };
}
