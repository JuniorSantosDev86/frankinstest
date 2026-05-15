import type {
  AiTestDesignEstimateRequest,
  AiTestDesignEstimateResponse,
  GenerateScenariosRequest,
  GenerateTestCasesRequest,
  AiGenerationResult,
  AiRunStatus,
  GeneratedQaArtifact,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export async function estimateTestDesign(
  request: AiTestDesignEstimateRequest
): Promise<AiTestDesignEstimateResponse> {
  const response = await fetch(`${API_BASE}/api/ai/test-design/estimate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.message ?? `Erro ao estimar créditos: ${response.status}`);
  }

  return response.json() as Promise<AiTestDesignEstimateResponse>;
}

export async function generateScenarios(
  request: GenerateScenariosRequest
): Promise<AiGenerationResult> {
  const response = await fetch(`${API_BASE}/api/ai/test-design/scenarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message ?? `Erro ao gerar cenários: ${response.status}`);
  }

  return data as AiGenerationResult;
}

export async function generateTestCases(
  request: GenerateTestCasesRequest
): Promise<AiGenerationResult> {
  const response = await fetch(`${API_BASE}/api/ai/test-design/test-cases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message ?? `Erro ao gerar casos de teste: ${response.status}`);
  }

  return data as AiGenerationResult;
}

export async function getAiRunStatus(aiRunId: string): Promise<AiRunStatus> {
  const response = await fetch(`${API_BASE}/api/ai/runs/${aiRunId}`);

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.message ?? `Run não encontrado: ${response.status}`);
  }

  return response.json() as Promise<AiRunStatus>;
}

// Mock helpers used in frontend tests (no real backend call)
export function mockEstimateResponse(context: string): AiTestDesignEstimateResponse {
  const base = 30;
  const contextCredits = Math.floor((context?.length ?? 0) / 100);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  return {
    estimatedCredits: Math.max(1, base + contextCredits),
    pricingNote: "Estimativa local de demonstração. Sem cobrança real.",
    expiresAt,
  };
}

export function mockGenerateScenariosResponse(title: string): AiGenerationResult {
  const artifacts: GeneratedQaArtifact[] = [
    {
      id: `mock_sc_1_${Date.now()}`,
      title: `Fluxo principal bem-sucedido — ${title}`,
      description:
        `Dado que o usuário fornece dados válidos para: ${title}\n` +
        `Quando a ação é executada\n` +
        `Então o sistema deve confirmar o sucesso e exibir feedback claro`,
      status: "draft",
      aiAssisted: true,
    },
    {
      id: `mock_sc_2_${Date.now()}`,
      title: `Entrada inválida rejeitada — ${title}`,
      description:
        `Dado que o usuário fornece dados inválidos\n` +
        `Quando tenta executar a ação\n` +
        `Então o sistema deve exibir mensagem de erro descritiva e bloquear o avanço`,
      status: "draft",
      aiAssisted: true,
    },
    {
      id: `mock_sc_3_${Date.now()}`,
      title: `Caso de borda no limite — ${title}`,
      description:
        `Dado que os dados estão exatamente no limite permitido pelo sistema\n` +
        `Quando a ação é executada\n` +
        `Então o sistema deve processar corretamente sem comportamento inesperado`,
      status: "draft",
      aiAssisted: true,
    },
  ];
  return {
    aiRunId: `mock_run_${Date.now()}`,
    status: "completed",
    outputArtifactType: "test_scenario",
    artifacts,
    consumedCredits: 2,
    creditNote: "Créditos consumidos pelo mock local.",
  };
}

export function mockGenerateTestCasesResponse(title: string): AiGenerationResult {
  const artifacts: GeneratedQaArtifact[] = [
    {
      id: `mock_tc_1_${Date.now()}`,
      title: `${title} — dado válido`,
      description:
        `Pré-condição: sistema disponível, usuário autenticado\n` +
        `Passos: 1. Navegar para a funcionalidade 2. Preencher com dados válidos 3. Confirmar\n` +
        `Resultado esperado: operação executada com sucesso`,
      status: "draft",
      aiAssisted: true,
    },
    {
      id: `mock_tc_2_${Date.now()}`,
      title: `${title} — dado inválido`,
      description:
        `Pré-condição: sistema disponível, usuário autenticado\n` +
        `Passos: 1. Navegar para a funcionalidade 2. Preencher com dados inválidos 3. Tentar confirmar\n` +
        `Resultado esperado: mensagem de erro clara exibida, operação bloqueada`,
      status: "draft",
      aiAssisted: true,
    },
  ];
  return {
    aiRunId: `mock_run_${Date.now()}`,
    status: "completed",
    outputArtifactType: "test_case",
    artifacts,
    consumedCredits: 3,
    creditNote: "Créditos consumidos pelo mock local.",
  };
}
