import { demoProjects } from "@/lib/projects/projectService";
import type { Project } from "@/lib/projects/types";
import {
  aiCreditTransactionStatuses,
  aiCreditTransactionTypes,
  aiFeatures,
  aiInputArtifactTypes,
  aiProviders,
  aiRunStatuses,
  type AiCreditBalance,
  type AiCreditEstimate,
  type AiCreditTransaction,
  type AiCreditTransactionStatus,
  type AiCreditTransactionType,
  type AiFeature,
  type AiInputArtifactType,
  type AiProvider,
  type AiRun,
  type AiRunEstimateInput,
  type AiRunInput,
  type AiRunStatus,
  type AiRunTraceability,
  type AiUsageSummary,
  type ProjectAiUsageTraceability,
} from "./types";

export const AI_CREDIT_UNIT_TOKENS = 1000;
export const AI_MIN_CREDITS = 1;
export const AI_DEFAULT_OUTPUT_TOKEN_RATIO = 0.4;
export const AI_LOCAL_PRICING_NOTE =
  "Estimativa local deterministica para demonstracao; nao usa tokenizer real, provider real ou cobranca real.";
export const AI_MOCK_PROVIDER: AiProvider = "mock";
export const AI_MOCK_MODEL = "mock-local-estimator";

const demoTimestamp = "2026-05-13T16:00:00.000Z";

export const demoAiRuns: AiRun[] = [
  {
    id: "ai_run_demo_landing_vulnerability_checkup",
    projectId: "project_demo_landing",
    feature: "vulnerability_checkup",
    inputArtifactType: "url",
    inputArtifactIds: [],
    promptSummary: "Check-up assistido de riscos potenciais da landing page.",
    status: "completed",
    provider: "mock",
    model: AI_MOCK_MODEL,
    estimatedInputTokens: 1620,
    estimatedOutputTokens: 648,
    actualInputTokens: 1600,
    actualOutputTokens: 620,
    estimatedCredits: 3,
    chargedCredits: 3,
    requestedBy: "user_demo_qa_lead",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
    completedAt: "2026-05-13T16:03:00.000Z",
    errorMessage: "",
  },
  {
    id: "ai_run_demo_landing_test_case_generation",
    projectId: "project_demo_landing",
    feature: "test_case_generation",
    inputArtifactType: "business_rule",
    inputArtifactIds: ["rule_demo_landing_email"],
    promptSummary: "Sugestao assistida de casos de teste para regra de negocio.",
    status: "completed",
    provider: "mock",
    model: AI_MOCK_MODEL,
    estimatedInputTokens: 940,
    estimatedOutputTokens: 376,
    actualInputTokens: 920,
    actualOutputTokens: 360,
    estimatedCredits: 2,
    chargedCredits: 2,
    requestedBy: "user_demo_qa_lead",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
    completedAt: "2026-05-13T16:05:00.000Z",
    errorMessage: "",
  },
  {
    id: "ai_run_demo_landing_report_assist",
    projectId: "project_demo_landing",
    feature: "report_assist",
    inputArtifactType: "report",
    inputArtifactIds: ["report_demo_landing_qa_status"],
    promptSummary: "Apoio para estruturar sumario de relatorio QA.",
    status: "completed",
    provider: "mock",
    model: AI_MOCK_MODEL,
    estimatedInputTokens: 620,
    estimatedOutputTokens: 248,
    actualInputTokens: 600,
    actualOutputTokens: 230,
    estimatedCredits: 1,
    chargedCredits: 1,
    requestedBy: "user_demo_qa_lead",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
    completedAt: "2026-05-13T16:08:00.000Z",
    errorMessage: "",
  },
  {
    id: "ai_run_demo_saas_drift_failed",
    projectId: "project_demo_saas",
    feature: "drift_analysis",
    inputArtifactType: "mixed",
    inputArtifactIds: ["requirement_demo_saas_session", "test_case_demo_saas_workspace_boundary_regression"],
    promptSummary: "Analise de drift operacional nao concluida no mock.",
    status: "failed",
    provider: "mock",
    model: AI_MOCK_MODEL,
    estimatedInputTokens: 1100,
    estimatedOutputTokens: 440,
    actualInputTokens: null,
    actualOutputTokens: null,
    estimatedCredits: 2,
    chargedCredits: 0,
    requestedBy: "user_demo_qa_lead",
    createdAt: demoTimestamp,
    updatedAt: "2026-05-13T16:10:00.000Z",
    completedAt: "2026-05-13T16:10:00.000Z",
    errorMessage: "Execucao mock interrompida antes de produzir artefato estruturado.",
  },
  {
    id: "ai_run_demo_landing_automation_estimate",
    projectId: "project_demo_landing",
    feature: "automation_suggestion",
    inputArtifactType: "test_case",
    inputArtifactIds: ["test_case_demo_landing_valid_email_submission"],
    promptSummary: "Estimativa de automacao candidata sem execucao real.",
    status: "estimated",
    provider: "mock",
    model: AI_MOCK_MODEL,
    estimatedInputTokens: 720,
    estimatedOutputTokens: 288,
    actualInputTokens: null,
    actualOutputTokens: null,
    estimatedCredits: 2,
    chargedCredits: 0,
    requestedBy: "user_demo_qa_lead",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
    completedAt: "",
    errorMessage: "",
  },
];

export const demoAiCreditBalances: AiCreditBalance[] = [
  {
    projectId: "project_demo_landing",
    includedCredits: 50,
    purchasedCredits: 20,
    reservedCredits: 2,
    usedCredits: 6,
    availableCredits: 62,
    updatedAt: demoTimestamp,
  },
  {
    projectId: "project_demo_saas",
    includedCredits: 30,
    purchasedCredits: 0,
    reservedCredits: 0,
    usedCredits: 0,
    availableCredits: 30,
    updatedAt: demoTimestamp,
  },
];

export const demoAiCreditTransactions: AiCreditTransaction[] = [
  {
    id: "ai_credit_transaction_demo_landing_grant",
    projectId: "project_demo_landing",
    aiRunId: "ai_run_demo_landing_vulnerability_checkup",
    transactionType: "grant",
    status: "completed",
    credits: 50,
    reason: "Credito incluso de demonstracao para o projeto landing.",
    createdAt: demoTimestamp,
  },
  {
    id: "ai_credit_transaction_demo_landing_vulnerability_charge",
    projectId: "project_demo_landing",
    aiRunId: "ai_run_demo_landing_vulnerability_checkup",
    transactionType: "charge",
    status: "completed",
    credits: 3,
    reason: "Cobranca local do check-up mock concluido.",
    createdAt: "2026-05-13T16:03:00.000Z",
  },
  {
    id: "ai_credit_transaction_demo_landing_test_case_charge",
    projectId: "project_demo_landing",
    aiRunId: "ai_run_demo_landing_test_case_generation",
    transactionType: "charge",
    status: "completed",
    credits: 2,
    reason: "Cobranca local da sugestao mock de casos de teste.",
    createdAt: "2026-05-13T16:05:00.000Z",
  },
  {
    id: "ai_credit_transaction_demo_landing_report_charge",
    projectId: "project_demo_landing",
    aiRunId: "ai_run_demo_landing_report_assist",
    transactionType: "charge",
    status: "completed",
    credits: 1,
    reason: "Cobranca local do apoio mock ao relatorio QA.",
    createdAt: "2026-05-13T16:08:00.000Z",
  },
  {
    id: "ai_credit_transaction_demo_landing_automation_reserve",
    projectId: "project_demo_landing",
    aiRunId: "ai_run_demo_landing_automation_estimate",
    transactionType: "reserve",
    status: "pending",
    credits: 2,
    reason: "Reserva local para estimativa de automacao ainda nao executada.",
    createdAt: demoTimestamp,
  },
  {
    id: "ai_credit_transaction_demo_saas_drift_refund",
    projectId: "project_demo_saas",
    aiRunId: "ai_run_demo_saas_drift_failed",
    transactionType: "refund",
    status: "completed",
    credits: 2,
    reason: "Estorno local porque a analise de drift mock falhou sem entrega.",
    createdAt: "2026-05-13T16:10:00.000Z",
  },
  {
    id: "ai_credit_transaction_demo_saas_adjustment",
    projectId: "project_demo_saas",
    aiRunId: "ai_run_demo_saas_drift_failed",
    transactionType: "adjustment",
    status: "completed",
    credits: 0,
    reason: "Ajuste local para manter saldo de demonstracao sem cobranca real.",
    createdAt: "2026-05-13T16:11:00.000Z",
  },
];

export function isAiFeature(value: string): value is AiFeature {
  return aiFeatures.includes(value as AiFeature);
}

export function isAiInputArtifactType(value: string): value is AiInputArtifactType {
  return aiInputArtifactTypes.includes(value as AiInputArtifactType);
}

export function isAiRunStatus(value: string): value is AiRunStatus {
  return aiRunStatuses.includes(value as AiRunStatus);
}

export function isAiProvider(value: string): value is AiProvider {
  return aiProviders.includes(value as AiProvider);
}

export function isAiCreditTransactionType(value: string): value is AiCreditTransactionType {
  return aiCreditTransactionTypes.includes(value as AiCreditTransactionType);
}

export function isAiCreditTransactionStatus(
  value: string,
): value is AiCreditTransactionStatus {
  return aiCreditTransactionStatuses.includes(value as AiCreditTransactionStatus);
}

export function validateAiRunInput(input: AiRunInput): string[] {
  const errors: string[] = [];

  if (input.projectId.trim().length === 0) {
    errors.push("ai_run_project_required");
  }

  if (!isAiFeature(input.feature)) {
    errors.push("invalid_ai_feature");
  }

  if (!isAiInputArtifactType(input.inputArtifactType)) {
    errors.push("invalid_ai_input_artifact_type");
  }

  if (
    input.inputArtifactIds.length === 0 &&
    input.inputArtifactType !== "project" &&
    input.inputArtifactType !== "url"
  ) {
    errors.push("ai_run_artifact_required");
  }

  if (input.inputArtifactIds.some((artifactId) => artifactId.trim().length < 2)) {
    errors.push("ai_run_artifact_id_required");
  }

  if (input.promptSummary.trim().length < 2) {
    errors.push("ai_run_prompt_summary_required");
  }

  if (
    input.requestedBy !== undefined &&
    input.requestedBy.trim().length > 0 &&
    input.requestedBy.trim().length < 2
  ) {
    errors.push("ai_run_requested_by_required");
  }

  return errors;
}

export function validateAiRunEstimateInput(input: AiRunEstimateInput): string[] {
  const errors: string[] = [];

  if (!isAiFeature(input.feature)) {
    errors.push("invalid_ai_feature");
  }

  if (input.inputText.trim().length < 2) {
    errors.push("ai_estimate_input_text_required");
  }

  if (!Number.isFinite(input.artifactCount) || input.artifactCount < 0) {
    errors.push("ai_estimate_artifact_count_invalid");
  }

  return errors;
}

export function estimateAiRunCredits(input: AiRunEstimateInput): AiCreditEstimate {
  const errors = validateAiRunEstimateInput(input);

  if (errors.length > 0) {
    throw new Error(errors.join(","));
  }

  const estimatedInputTokens = Math.max(1, Math.ceil(input.inputText.length / 4)) + input.artifactCount * 120;
  const estimatedOutputTokens = Math.max(
    128,
    Math.ceil(estimatedInputTokens * AI_DEFAULT_OUTPUT_TOKEN_RATIO),
  );
  const estimatedTotalTokens = estimatedInputTokens + estimatedOutputTokens;
  const estimatedCredits = Math.max(
    AI_MIN_CREDITS,
    Math.ceil(estimatedTotalTokens / AI_CREDIT_UNIT_TOKENS),
  );

  return {
    estimatedInputTokens,
    estimatedOutputTokens,
    estimatedTotalTokens,
    estimatedCredits,
    pricingNote: AI_LOCAL_PRICING_NOTE,
  };
}

export function listAiRunsByProject(projectId: string, aiRuns: AiRun[] = demoAiRuns): AiRun[] {
  return aiRuns.filter((aiRun) => aiRun.projectId === projectId);
}

export function listAiRunsByFeature(
  projectId: string,
  feature: AiFeature,
  aiRuns: AiRun[] = demoAiRuns,
): AiRun[] {
  return aiRuns.filter((aiRun) => aiRun.projectId === projectId && aiRun.feature === feature);
}

export function listAiRunsByStatus(
  projectId: string,
  status: AiRunStatus,
  aiRuns: AiRun[] = demoAiRuns,
): AiRun[] {
  return aiRuns.filter((aiRun) => aiRun.projectId === projectId && aiRun.status === status);
}

export function listAiCreditTransactionsByProject(
  projectId: string,
  transactions: AiCreditTransaction[] = demoAiCreditTransactions,
): AiCreditTransaction[] {
  return transactions.filter((transaction) => transaction.projectId === projectId);
}

export function listAiCreditTransactionsByRun(
  aiRunId: string,
  transactions: AiCreditTransaction[] = demoAiCreditTransactions,
): AiCreditTransaction[] {
  return transactions.filter((transaction) => transaction.aiRunId === aiRunId);
}

export function calculateAvailableCredits(balance: AiCreditBalance): number {
  return (
    balance.includedCredits +
    balance.purchasedCredits -
    balance.usedCredits -
    balance.reservedCredits
  );
}

export function getAiCreditBalance(
  projectId: string,
  balances: AiCreditBalance[] = demoAiCreditBalances,
): AiCreditBalance | null {
  const balance = balances.find((item) => item.projectId === projectId) ?? null;

  if (!balance) {
    return null;
  }

  return {
    ...balance,
    availableCredits: calculateAvailableCredits(balance),
  };
}

export function hasEnoughCredits(
  projectId: string,
  estimatedCredits: number,
  balances: AiCreditBalance[] = demoAiCreditBalances,
): boolean {
  const balance = getAiCreditBalance(projectId, balances);

  return Boolean(balance && balance.availableCredits >= estimatedCredits);
}

export function createAiRunEstimate(input: AiRunEstimateInput): AiCreditEstimate {
  return estimateAiRunCredits(input);
}

function cleanArtifactIds(inputArtifactIds: string[]): string[] {
  return inputArtifactIds.map((artifactId) => artifactId.trim()).filter(Boolean);
}

export function createAiRun(input: AiRunInput, now = new Date()): AiRun {
  const errors = validateAiRunInput(input);

  if (errors.length > 0) {
    throw new Error(errors.join(","));
  }

  const estimate = estimateAiRunCredits({
    feature: input.feature,
    inputText: input.promptSummary,
    artifactCount: input.inputArtifactIds.length,
  });
  const timestamp = now.toISOString();

  return {
    id: `ai_run_${now.getTime()}`,
    projectId: input.projectId,
    feature: input.feature,
    inputArtifactType: input.inputArtifactType,
    inputArtifactIds: cleanArtifactIds(input.inputArtifactIds),
    promptSummary: input.promptSummary.trim(),
    status: "estimated",
    provider: AI_MOCK_PROVIDER,
    model: AI_MOCK_MODEL,
    estimatedInputTokens: estimate.estimatedInputTokens,
    estimatedOutputTokens: estimate.estimatedOutputTokens,
    actualInputTokens: null,
    actualOutputTokens: null,
    estimatedCredits: estimate.estimatedCredits,
    chargedCredits: 0,
    requestedBy: input.requestedBy?.trim() ?? "",
    createdAt: timestamp,
    updatedAt: timestamp,
    completedAt: "",
    errorMessage: "",
  };
}

function createCreditTransaction(
  projectId: string,
  aiRunId: string,
  credits: number,
  reason: string,
  now: Date,
  transactionType: AiCreditTransactionType,
  status: AiCreditTransactionStatus,
): AiCreditTransaction {
  if (projectId.trim().length === 0) {
    throw new Error("ai_credit_project_required");
  }

  if (aiRunId.trim().length === 0) {
    throw new Error("ai_credit_run_required");
  }

  if (!Number.isFinite(credits) || credits < 0) {
    throw new Error("ai_credit_amount_invalid");
  }

  if (reason.trim().length < 2) {
    throw new Error("ai_credit_reason_required");
  }

  return {
    id: `ai_credit_transaction_${transactionType}_${now.getTime()}`,
    projectId: projectId.trim(),
    aiRunId: aiRunId.trim(),
    transactionType,
    status,
    credits,
    reason: reason.trim(),
    createdAt: now.toISOString(),
  };
}

export function reserveAiCredits(
  projectId: string,
  aiRunId: string,
  credits: number,
  reason: string,
  now = new Date(),
): AiCreditTransaction {
  return createCreditTransaction(projectId, aiRunId, credits, reason, now, "reserve", "pending");
}

export function chargeAiCredits(
  projectId: string,
  aiRunId: string,
  credits: number,
  reason: string,
  now = new Date(),
): AiCreditTransaction {
  return createCreditTransaction(projectId, aiRunId, credits, reason, now, "charge", "completed");
}

export function refundAiCredits(
  projectId: string,
  aiRunId: string,
  credits: number,
  reason: string,
  now = new Date(),
): AiCreditTransaction {
  return createCreditTransaction(projectId, aiRunId, credits, reason, now, "refund", "completed");
}

export function updateAiRunStatus(
  aiRun: AiRun,
  updates: Partial<
    Pick<
      AiRun,
      | "status"
      | "actualInputTokens"
      | "actualOutputTokens"
      | "chargedCredits"
      | "completedAt"
      | "errorMessage"
    >
  >,
  now = new Date(),
): AiRun {
  return {
    ...aiRun,
    ...updates,
    updatedAt: now.toISOString(),
  };
}

export function completeMockAiRun(
  aiRun: AiRun,
  actualInputTokens: number,
  actualOutputTokens: number,
  chargedCredits: number,
  now = new Date(),
): AiRun {
  return updateAiRunStatus(
    aiRun,
    {
      status: "completed",
      actualInputTokens,
      actualOutputTokens,
      chargedCredits,
      completedAt: now.toISOString(),
      errorMessage: "",
    },
    now,
  );
}

export function failMockAiRun(aiRun: AiRun, errorMessage: string, now = new Date()): AiRun {
  return updateAiRunStatus(
    aiRun,
    {
      status: "failed",
      completedAt: now.toISOString(),
      errorMessage: errorMessage.trim(),
    },
    now,
  );
}

export function cancelMockAiRun(aiRun: AiRun, now = new Date()): AiRun {
  return updateAiRunStatus(
    aiRun,
    {
      status: "cancelled",
      completedAt: now.toISOString(),
      errorMessage: "",
    },
    now,
  );
}

export function applyCreditTransactionToBalance(
  balance: AiCreditBalance,
  transaction: AiCreditTransaction,
  now = new Date(),
): AiCreditBalance {
  if (balance.projectId !== transaction.projectId || transaction.status === "cancelled") {
    return {
      ...balance,
      availableCredits: calculateAvailableCredits(balance),
    };
  }

  const nextBalance: AiCreditBalance = {
    ...balance,
    updatedAt: now.toISOString(),
  };

  if (transaction.transactionType === "grant" && transaction.status === "completed") {
    nextBalance.includedCredits += transaction.credits;
  }

  if (transaction.transactionType === "reserve" && transaction.status === "pending") {
    nextBalance.reservedCredits += transaction.credits;
  }

  if (transaction.transactionType === "charge" && transaction.status === "completed") {
    nextBalance.usedCredits += transaction.credits;
    nextBalance.reservedCredits = Math.max(0, nextBalance.reservedCredits - transaction.credits);
  }

  if (transaction.transactionType === "refund" && transaction.status === "completed") {
    nextBalance.usedCredits = Math.max(0, nextBalance.usedCredits - transaction.credits);
  }

  return {
    ...nextBalance,
    availableCredits: calculateAvailableCredits(nextBalance),
  };
}

export function createMockAiRunReservation(
  projectId: string,
  aiRunId: string,
  credits: number,
  now = new Date(),
): AiCreditTransaction {
  return reserveAiCredits(
    projectId,
    aiRunId,
    credits,
    "Reserva local para run mock; nao executa provider real.",
    now,
  );
}

export function createMockAiRunCharge(
  projectId: string,
  aiRunId: string,
  credits: number,
  now = new Date(),
): AiCreditTransaction {
  return chargeAiCredits(
    projectId,
    aiRunId,
    credits,
    "Cobranca local de run mock concluida; sem billing real.",
    now,
  );
}

export function createMockAiRunRefund(
  projectId: string,
  aiRunId: string,
  credits: number,
  now = new Date(),
): AiCreditTransaction {
  return refundAiCredits(
    projectId,
    aiRunId,
    credits,
    "Reembolso local de creditos de run mock; sem checkout.",
    now,
  );
}

function createEmptyRunsByFeature(): Record<AiFeature, number> {
  return aiFeatures.reduce(
    (totals, feature) => ({
      ...totals,
      [feature]: 0,
    }),
    {} as Record<AiFeature, number>,
  );
}

function createEmptyRunsByStatus(): Record<AiRunStatus, number> {
  return aiRunStatuses.reduce(
    (totals, status) => ({
      ...totals,
      [status]: 0,
    }),
    {} as Record<AiRunStatus, number>,
  );
}

export function getAiUsageSummary(
  projectId: string,
  aiRuns: AiRun[] = demoAiRuns,
  balances: AiCreditBalance[] = demoAiCreditBalances,
  transactions: AiCreditTransaction[] = demoAiCreditTransactions,
): AiUsageSummary {
  const projectRuns = listAiRunsByProject(projectId, aiRuns);
  const runsByFeature = createEmptyRunsByFeature();
  const runsByStatus = createEmptyRunsByStatus();
  const balance = getAiCreditBalance(projectId, balances);

  projectRuns.forEach((aiRun) => {
    runsByFeature[aiRun.feature] += 1;
    runsByStatus[aiRun.status] += 1;
  });

  return {
    totalRuns: projectRuns.length,
    estimatedRuns: runsByStatus.estimated,
    queuedRuns: runsByStatus.queued,
    runningRuns: runsByStatus.running,
    completedRuns: runsByStatus.completed,
    failedRuns: runsByStatus.failed,
    cancelledRuns: runsByStatus.cancelled,
    totalEstimatedCredits: projectRuns.reduce((total, aiRun) => total + aiRun.estimatedCredits, 0),
    totalChargedCredits: projectRuns.reduce((total, aiRun) => total + aiRun.chargedCredits, 0),
    includedCredits: balance?.includedCredits ?? 0,
    purchasedCredits: balance?.purchasedCredits ?? 0,
    usedCredits: balance?.usedCredits ?? 0,
    reservedCredits: balance?.reservedCredits ?? 0,
    availableCredits: balance?.availableCredits ?? 0,
    runsByFeature,
    runsByStatus,
    transactionsCount: listAiCreditTransactionsByProject(projectId, transactions).length,
  };
}

export function getAiRunTraceability(
  aiRunId: string,
  aiRuns: AiRun[] = demoAiRuns,
  transactions: AiCreditTransaction[] = demoAiCreditTransactions,
  projects: Project[] = demoProjects,
): AiRunTraceability {
  const aiRun = aiRuns.find((item) => item.id === aiRunId) ?? null;

  return {
    project: aiRun ? projects.find((project) => project.id === aiRun.projectId) ?? null : null,
    aiRun,
    transactions: listAiCreditTransactionsByRun(aiRunId, transactions),
    relatedArtifactIds: aiRun?.inputArtifactIds ?? [],
    artifactType: aiRun?.inputArtifactType ?? null,
  };
}

export function getProjectAiUsageTraceability(
  projectId: string,
  aiRuns: AiRun[] = demoAiRuns,
  transactions: AiCreditTransaction[] = demoAiCreditTransactions,
  projects: Project[] = demoProjects,
): ProjectAiUsageTraceability {
  const project = projects.find((item) => item.id === projectId) ?? null;
  const projectRuns = listAiRunsByProject(projectId, aiRuns);
  const projectTransactions = listAiCreditTransactionsByProject(projectId, transactions);

  return {
    project,
    aiRuns: projectRuns,
    transactions: projectTransactions,
    aiRunTraceability: projectRuns.map((aiRun) =>
      getAiRunTraceability(aiRun.id, aiRuns, transactions, projects),
    ),
    runCount: projectRuns.length,
    transactionCount: projectTransactions.length,
  };
}
