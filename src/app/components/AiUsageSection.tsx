"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  applyCreditTransactionToBalance,
  cancelMockAiRun,
  chargeAiCredits,
  completeMockAiRun,
  createAiRun,
  demoAiCreditBalances,
  demoAiCreditTransactions,
  demoAiRuns,
  estimateAiRunCredits,
  failMockAiRun,
  getAiCreditBalance,
  getAiUsageSummary,
  hasEnoughCredits,
  listAiCreditTransactionsByProject,
  listAiRunsByProject,
  refundAiCredits,
  reserveAiCredits,
  validateAiRunInput,
} from "@/lib/ai-usage/aiUsageService";
import {
  aiFeatures,
  aiInputArtifactTypes,
  type AiCreditBalance,
  type AiCreditEstimate,
  type AiCreditTransaction,
  type AiCreditTransactionStatus,
  type AiCreditTransactionType,
  type AiFeature,
  type AiInputArtifactType,
  type AiProvider,
  type AiRun,
  type AiRunStatus,
} from "@/lib/ai-usage/types";
import type { Project } from "@/lib/projects/types";
import { MetricCard } from "./MetricCard";

export const aiRunsStorageKey = "frankintest.block08.aiRuns";
export const aiCreditBalancesStorageKey = "frankintest.block08.aiCreditBalances";
export const aiCreditTransactionsStorageKey = "frankintest.block08.aiCreditTransactions";

type AiUsageSectionProps = {
  projects: Project[];
};

type EstimateFormState = {
  feature: AiFeature;
  inputText: string;
  artifactCount: number;
};

type MockRunFormState = {
  feature: AiFeature;
  inputArtifactType: AiInputArtifactType;
  inputArtifactIds: string;
  promptSummary: string;
  requestedBy: string;
};

const emptyEstimateForm: EstimateFormState = {
  feature: "test_case_generation",
  inputText: "",
  artifactCount: 1,
};

const emptyMockRunForm: MockRunFormState = {
  feature: "test_case_generation",
  inputArtifactType: "business_rule",
  inputArtifactIds: "",
  promptSummary: "",
  requestedBy: "QA local",
};

const featureLabels: Record<AiFeature, string> = {
  vulnerability_checkup: "Check-up assistido por IA",
  test_case_generation: "Geração assistida de casos",
  bug_summary: "Resumo assistido de bug",
  report_assist: "Apoio assistido a relatório",
  drift_analysis: "Análise assistida de drift",
  business_rule_analysis: "Análise assistida de regra",
  automation_suggestion: "Sugestão assistida de automação",
  requirement_review: "Revisão assistida de requisito",
};

const artifactTypeLabels: Record<AiInputArtifactType, string> = {
  project: "Projeto",
  module: "Módulo",
  requirement: "Requisito",
  business_rule: "Regra de negócio",
  scenario: "Cenário",
  test_case: "Caso de teste",
  suite: "Suíte",
  cycle: "Ciclo",
  execution: "Execução",
  bug: "Bug",
  evidence: "Evidência",
  report: "Relatório",
  url: "URL",
  mixed: "Misto",
};

const statusLabels: Record<AiRunStatus, string> = {
  estimated: "Estimado",
  queued: "Na fila",
  running: "Executando",
  completed: "Concluído",
  failed: "Falhou",
  cancelled: "Cancelado",
};

const transactionTypeLabels: Record<AiCreditTransactionType, string> = {
  grant: "Concessão",
  reserve: "Reserva",
  charge: "Cobrança",
  refund: "Reembolso",
  adjustment: "Ajuste",
};

const transactionStatusLabels: Record<AiCreditTransactionStatus, string> = {
  pending: "Pendente",
  completed: "Concluída",
  cancelled: "Cancelada",
};

const providerLabels: Record<AiProvider, string> = {
  mock: "Provider mock",
  openai: "Provider futuro",
  anthropic: "Provider futuro",
  google: "Provider futuro",
  other: "Provider futuro",
};

const statusBadgeClasses: Record<AiRunStatus, string> = {
  estimated: "bg-slate-100 text-slate-700 ring-slate-900/10",
  queued: "bg-sky-50 text-sky-800 ring-sky-900/15",
  running: "bg-amber-50 text-amber-900 ring-amber-900/15",
  completed: "bg-emerald-50 text-emerald-800 ring-emerald-900/15",
  failed: "bg-rose-50 text-rose-800 ring-rose-900/15",
  cancelled: "bg-slate-200 text-slate-800 ring-slate-900/10",
};

const transactionBadgeClasses: Record<AiCreditTransactionType, string> = {
  grant: "bg-teal-50 text-teal-800 ring-teal-900/15",
  reserve: "bg-amber-50 text-amber-900 ring-amber-900/15",
  charge: "bg-sky-50 text-sky-800 ring-sky-900/15",
  refund: "bg-emerald-50 text-emerald-800 ring-emerald-900/15",
  adjustment: "bg-violet-50 text-violet-800 ring-violet-900/15",
};

function linesToIds(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function createEmptyBalance(projectId: string, now: Date): AiCreditBalance {
  return {
    projectId,
    includedCredits: 0,
    purchasedCredits: 0,
    reservedCredits: 0,
    usedCredits: 0,
    availableCredits: 0,
    updatedAt: now.toISOString(),
  };
}

function FieldValue({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export function AiUsageSection({ projects }: AiUsageSectionProps) {
  const [aiRuns, setAiRuns] = useState<AiRun[]>(demoAiRuns);
  const [balances, setBalances] = useState<AiCreditBalance[]>(demoAiCreditBalances);
  const [transactions, setTransactions] =
    useState<AiCreditTransaction[]>(demoAiCreditTransactions);
  const [hasLoadedLocalAiUsage, setHasLoadedLocalAiUsage] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(() => projects[0]?.id ?? "");
  const activeProjectId = selectedProjectId || projects[0]?.id || "";
  const [estimateForm, setEstimateForm] = useState<EstimateFormState>(emptyEstimateForm);
  const [estimateResult, setEstimateResult] = useState<AiCreditEstimate | null>(null);
  const [estimateError, setEstimateError] = useState(false);
  const [mockRunForm, setMockRunForm] = useState<MockRunFormState>(emptyMockRunForm);
  const [mockRunError, setMockRunError] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedRuns = window.localStorage.getItem(aiRunsStorageKey);
      const storedBalances = window.localStorage.getItem(aiCreditBalancesStorageKey);
      const storedTransactions = window.localStorage.getItem(aiCreditTransactionsStorageKey);

      if (storedRuns) {
        setAiRuns(JSON.parse(storedRuns) as AiRun[]);
      }

      if (storedBalances) {
        setBalances(JSON.parse(storedBalances) as AiCreditBalance[]);
      }

      if (storedTransactions) {
        setTransactions(JSON.parse(storedTransactions) as AiCreditTransaction[]);
      }

      setHasLoadedLocalAiUsage(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hasLoadedLocalAiUsage) {
      return;
    }

    window.localStorage.setItem(aiRunsStorageKey, JSON.stringify(aiRuns));
  }, [aiRuns, hasLoadedLocalAiUsage]);

  useEffect(() => {
    if (!hasLoadedLocalAiUsage) {
      return;
    }

    window.localStorage.setItem(aiCreditBalancesStorageKey, JSON.stringify(balances));
  }, [balances, hasLoadedLocalAiUsage]);

  useEffect(() => {
    if (!hasLoadedLocalAiUsage) {
      return;
    }

    window.localStorage.setItem(aiCreditTransactionsStorageKey, JSON.stringify(transactions));
  }, [hasLoadedLocalAiUsage, transactions]);

  const selectedProject = projects.find((project) => project.id === activeProjectId) ?? projects[0];
  const balance = getAiCreditBalance(activeProjectId, balances);
  const summary = useMemo(
    () => getAiUsageSummary(activeProjectId, aiRuns, balances, transactions),
    [activeProjectId, aiRuns, balances, transactions],
  );
  const projectRuns = useMemo(
    () => listAiRunsByProject(activeProjectId, aiRuns),
    [activeProjectId, aiRuns],
  );
  const projectTransactions = useMemo(
    () => listAiCreditTransactionsByProject(activeProjectId, transactions),
    [activeProjectId, transactions],
  );
  const estimateHasEnoughCredits = estimateResult
    ? hasEnoughCredits(activeProjectId, estimateResult.estimatedCredits, balances)
    : null;

  function upsertBalance(transaction: AiCreditTransaction, now: Date) {
    setBalances((currentBalances) => {
      const currentBalance =
        getAiCreditBalance(transaction.projectId, currentBalances) ??
        createEmptyBalance(transaction.projectId, now);
      const nextBalance = applyCreditTransactionToBalance(currentBalance, transaction, now);
      const otherBalances = currentBalances.filter(
        (item) => item.projectId !== transaction.projectId,
      );

      return [nextBalance, ...otherBalances];
    });
  }

  function appendTransaction(transaction: AiCreditTransaction, now: Date) {
    setTransactions((currentTransactions) => [transaction, ...currentTransactions]);
    upsertBalance(transaction, now);
  }

  function updateRun(nextRun: AiRun) {
    setAiRuns((currentRuns) =>
      currentRuns.map((currentRun) => (currentRun.id === nextRun.id ? nextRun : currentRun)),
    );
  }

  function handleEstimateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const estimate = estimateAiRunCredits(estimateForm);
      setEstimateResult(estimate);
      setEstimateError(false);
    } catch {
      setEstimateResult(null);
      setEstimateError(true);
    }
  }

  function handleMockRunSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = {
      projectId: activeProjectId,
      feature: mockRunForm.feature,
      inputArtifactType: mockRunForm.inputArtifactType,
      inputArtifactIds: linesToIds(mockRunForm.inputArtifactIds),
      promptSummary: mockRunForm.promptSummary,
      requestedBy: mockRunForm.requestedBy,
    };

    if (validateAiRunInput(input).length > 0) {
      setMockRunError(true);
      return;
    }

    const run = createAiRun(input, new Date());
    setAiRuns((currentRuns) => [run, ...currentRuns]);
    setMockRunForm(emptyMockRunForm);
    setMockRunError(false);
  }

  function handleReserve(aiRun: AiRun) {
    const now = new Date();
    const transaction = reserveAiCredits(
      aiRun.projectId,
      aiRun.id,
      aiRun.estimatedCredits,
      "Reserva local para run mock; requer confirmação antes de cobrança real futura.",
      now,
    );

    appendTransaction(transaction, now);
  }

  function handleComplete(aiRun: AiRun) {
    const now = new Date();
    const nextRun = completeMockAiRun(
      aiRun,
      aiRun.estimatedInputTokens,
      aiRun.estimatedOutputTokens,
      aiRun.estimatedCredits,
      now,
    );
    const transaction = chargeAiCredits(
      aiRun.projectId,
      aiRun.id,
      aiRun.estimatedCredits,
      "Cobrança local para run mock concluída; sem billing real.",
      now,
    );

    updateRun(nextRun);
    appendTransaction(transaction, now);
  }

  function handleFail(aiRun: AiRun) {
    updateRun(failMockAiRun(aiRun, "Run mock marcada como falha localmente.", new Date()));
  }

  function handleCancel(aiRun: AiRun) {
    updateRun(cancelMockAiRun(aiRun, new Date()));
  }

  function handleRefund(aiRun: AiRun) {
    const refundedCredits = transactions
      .filter(
        (transaction) =>
          transaction.aiRunId === aiRun.id &&
          transaction.transactionType === "refund" &&
          transaction.status === "completed",
      )
      .reduce((total, transaction) => total + transaction.credits, 0);
    const refundableCredits = Math.max(0, aiRun.chargedCredits - refundedCredits);

    if (refundableCredits <= 0) {
      return;
    }

    const now = new Date();
    const transaction = refundAiCredits(
      aiRun.projectId,
      aiRun.id,
      refundableCredits,
      "Reembolso local de run mock; sem checkout.",
      now,
    );

    appendTransaction(transaction, now);
  }

  return (
    <section
      id="ai-usage"
      className="rounded-[1.5rem] border border-slate-900/10 bg-white/90 p-6 shadow-xl shadow-slate-900/5 md:p-8"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.26em] text-teal-700">
            MVP local
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Uso de IA e créditos
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Estimativa local; cobrança real será adicionada somente em fase posterior. Este
            simulador não chama IA real e não gera artefatos automaticamente.
          </p>
        </div>
        <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-bold text-slate-700 sm:grid-cols-3">
          <span>Sem billing real</span>
          <span>Sem checkout</span>
          <span>Sem API key</span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Projeto em análise
          <select
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-teal-500"
            value={activeProjectId}
            onChange={(event) => setSelectedProjectId(event.target.value)}
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>

        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">
            Saldo de créditos
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <FieldValue label="Créditos disponíveis" value={balance?.availableCredits ?? 0} />
            <FieldValue label="Créditos incluídos" value={balance?.includedCredits ?? 0} />
            <FieldValue label="Créditos comprados" value={balance?.purchasedCredits ?? 0} />
            <FieldValue label="Créditos usados" value={balance?.usedCredits ?? 0} />
            <FieldValue label="Créditos reservados" value={balance?.reservedCredits ?? 0} />
          </div>
        </article>
      </div>

      <div className="mt-6">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">
          Resumo de uso
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Créditos disponíveis"
            value={`${summary.availableCredits}`}
            trend="estimativa local"
            tone="teal"
          />
          <MetricCard
            title="Runs concluídas"
            value={`${summary.completedRuns}/${summary.totalRuns}`}
            trend="assistido por IA"
            tone="blue"
          />
          <MetricCard
            title="Runs com falha"
            value={`${summary.failedRuns}`}
            trend="mock local"
            tone="orange"
          />
          <MetricCard
            title="Créditos cobrados"
            value={`${summary.totalChargedCredits}`}
            trend={`${summary.totalEstimatedCredits} estimados`}
            tone="violet"
          />
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <form
          className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
          onSubmit={handleEstimateSubmit}
        >
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">
            Estimativa de créditos
          </p>
          <div className="mt-4 grid gap-4">
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Feature
              <select
                className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-teal-500"
                value={estimateForm.feature}
                onChange={(event) =>
                  setEstimateForm((current) => ({
                    ...current,
                    feature: event.target.value as AiFeature,
                  }))
                }
              >
                {aiFeatures.map((feature) => (
                  <option key={feature} value={feature}>
                    {featureLabels[feature]}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              inputText
              <textarea
                className="min-h-28 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-teal-500"
                value={estimateForm.inputText}
                onChange={(event) =>
                  setEstimateForm((current) => ({ ...current, inputText: event.target.value }))
                }
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              artifactCount
              <input
                className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-teal-500"
                min={0}
                type="number"
                value={estimateForm.artifactCount}
                onChange={(event) =>
                  setEstimateForm((current) => ({
                    ...current,
                    artifactCount: Number(event.target.value),
                  }))
                }
              />
            </label>
          </div>
          {estimateError ? (
            <p className="mt-3 text-sm font-semibold text-rose-700">
              Informe texto e quantidade de artefatos válidos para estimar créditos.
            </p>
          ) : null}
          {estimateResult ? (
            <div className="mt-4 grid gap-3 rounded-xl border border-white bg-white p-4 sm:grid-cols-2">
              <FieldValue label="estimatedInputTokens" value={estimateResult.estimatedInputTokens} />
              <FieldValue
                label="estimatedOutputTokens"
                value={estimateResult.estimatedOutputTokens}
              />
              <FieldValue label="estimatedTotalTokens" value={estimateResult.estimatedTotalTokens} />
              <FieldValue label="estimatedCredits" value={estimateResult.estimatedCredits} />
              <div className="sm:col-span-2">
                <FieldValue label="pricingNote" value={estimateResult.pricingNote} />
              </div>
              <p className="sm:col-span-2 text-sm font-bold text-slate-700">
                {estimateHasEnoughCredits
                  ? "Projeto possui créditos locais suficientes."
                  : "Projeto não possui créditos locais suficientes."}
              </p>
            </div>
          ) : null}
          <button
            className="mt-4 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-teal-700"
            type="submit"
          >
            Estimar créditos
          </button>
        </form>

        <form
          className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
          onSubmit={handleMockRunSubmit}
        >
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">
            Simulador local de run mock
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Este simulador não chama IA real e não gera artefatos automaticamente.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              feature
              <select
                className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-teal-500"
                value={mockRunForm.feature}
                onChange={(event) =>
                  setMockRunForm((current) => ({
                    ...current,
                    feature: event.target.value as AiFeature,
                  }))
                }
              >
                {aiFeatures.map((feature) => (
                  <option key={feature} value={feature}>
                    {featureLabels[feature]}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              inputArtifactType
              <select
                className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-teal-500"
                value={mockRunForm.inputArtifactType}
                onChange={(event) =>
                  setMockRunForm((current) => ({
                    ...current,
                    inputArtifactType: event.target.value as AiInputArtifactType,
                  }))
                }
              >
                {aiInputArtifactTypes.map((artifactType) => (
                  <option key={artifactType} value={artifactType}>
                    {artifactTypeLabels[artifactType]}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700 sm:col-span-2">
              inputArtifactIds
              <textarea
                className="min-h-24 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-teal-500"
                placeholder="Um ID por linha"
                value={mockRunForm.inputArtifactIds}
                onChange={(event) =>
                  setMockRunForm((current) => ({
                    ...current,
                    inputArtifactIds: event.target.value,
                  }))
                }
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700 sm:col-span-2">
              promptSummary
              <textarea
                className="min-h-24 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-teal-500"
                value={mockRunForm.promptSummary}
                onChange={(event) =>
                  setMockRunForm((current) => ({
                    ...current,
                    promptSummary: event.target.value,
                  }))
                }
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              requestedBy
              <input
                className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-teal-500"
                value={mockRunForm.requestedBy}
                onChange={(event) =>
                  setMockRunForm((current) => ({ ...current, requestedBy: event.target.value }))
                }
              />
            </label>
          </div>
          {mockRunError ? (
            <p className="mt-3 text-sm font-semibold text-rose-700">
              Preencha os dados mínimos do run mock e mantenha vínculo com artefato estruturado.
            </p>
          ) : null}
          <button
            className="mt-4 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-teal-700"
            type="submit"
          >
            Criar run mock
          </button>
        </form>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <section>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">
            Histórico de runs de IA
          </p>
          <div className="mt-4 grid gap-4">
            {projectRuns.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">
                Nenhuma run local para {selectedProject?.name ?? "este projeto"}.
              </p>
            ) : (
              projectRuns.map((aiRun) => {
                const hasPendingReserve = transactions.some(
                  (transaction) =>
                    transaction.aiRunId === aiRun.id &&
                    transaction.transactionType === "reserve" &&
                    transaction.status === "pending",
                );
                const refundableCredits =
                  aiRun.chargedCredits -
                  transactions
                    .filter(
                      (transaction) =>
                        transaction.aiRunId === aiRun.id &&
                        transaction.transactionType === "refund" &&
                        transaction.status === "completed",
                    )
                    .reduce((total, transaction) => total + transaction.credits, 0);
                const canChangeMockStatus = ["estimated", "queued", "running"].includes(
                  aiRun.status,
                );

                return (
                  <article
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60"
                    key={aiRun.id}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${statusBadgeClasses[aiRun.status]}`}
                          >
                            {statusLabels[aiRun.status]}
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-900/10">
                            {providerLabels[aiRun.provider]}
                          </span>
                          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-black text-teal-800 ring-1 ring-teal-900/15">
                            mock local
                          </span>
                        </div>
                        <h3 className="mt-3 text-lg font-black text-slate-950">
                          {featureLabels[aiRun.feature]}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {aiRun.promptSummary}
                        </p>
                      </div>
                      <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-600">
                        não executa provider real
                      </p>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <FieldValue label="inputArtifactType" value={artifactTypeLabels[aiRun.inputArtifactType]} />
                      <FieldValue label="model" value={aiRun.model} />
                      <FieldValue label="estimatedCredits" value={aiRun.estimatedCredits} />
                      <FieldValue label="chargedCredits" value={aiRun.chargedCredits} />
                      <FieldValue label="estimatedInputTokens" value={aiRun.estimatedInputTokens} />
                      <FieldValue label="estimatedOutputTokens" value={aiRun.estimatedOutputTokens} />
                      <FieldValue
                        label="actualInputTokens"
                        value={aiRun.actualInputTokens ?? "Não informado"}
                      />
                      <FieldValue
                        label="actualOutputTokens"
                        value={aiRun.actualOutputTokens ?? "Não informado"}
                      />
                      <FieldValue label="requestedBy" value={aiRun.requestedBy || "Não informado"} />
                      <FieldValue label="createdAt" value={aiRun.createdAt} />
                      <FieldValue label="completedAt" value={aiRun.completedAt || "Não concluído"} />
                      <FieldValue
                        label="errorMessage"
                        value={aiRun.errorMessage || "Sem erro registrado"}
                      />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {canChangeMockStatus && !hasPendingReserve ? (
                        <button
                          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 transition hover:border-teal-500 hover:text-teal-700"
                          onClick={() => handleReserve(aiRun)}
                          type="button"
                        >
                          Reservar créditos
                        </button>
                      ) : null}
                      {canChangeMockStatus ? (
                        <>
                          <button
                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700"
                            onClick={() => handleComplete(aiRun)}
                            type="button"
                          >
                            Marcar como concluído no mock
                          </button>
                          <button
                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 transition hover:border-rose-500 hover:text-rose-700"
                            onClick={() => handleFail(aiRun)}
                            type="button"
                          >
                            Marcar como falhou no mock
                          </button>
                          <button
                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 transition hover:border-slate-500 hover:text-slate-950"
                            onClick={() => handleCancel(aiRun)}
                            type="button"
                          >
                            Cancelar run mock
                          </button>
                        </>
                      ) : null}
                      {refundableCredits > 0 ? (
                        <button
                          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700"
                          onClick={() => handleRefund(aiRun)}
                          type="button"
                        >
                          Reembolsar créditos
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        <section>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">
            Histórico de transações
          </p>
          <div className="mt-4 grid gap-4">
            {projectTransactions.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">
                Nenhuma transação local para este projeto.
              </p>
            ) : (
              projectTransactions.map((transaction) => (
                <article
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60"
                  key={transaction.id}
                >
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${transactionBadgeClasses[transaction.transactionType]}`}
                    >
                      {transactionTypeLabels[transaction.transactionType]}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-900/10">
                      {transactionStatusLabels[transaction.status]}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-4">
                    <FieldValue label="credits" value={transaction.credits} />
                    <FieldValue label="reason" value={transaction.reason} />
                    <FieldValue label="aiRunId" value={transaction.aiRunId} />
                    <FieldValue label="createdAt" value={transaction.createdAt} />
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
