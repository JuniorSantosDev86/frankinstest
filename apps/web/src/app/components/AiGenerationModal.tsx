"use client";

import { useState } from "react";

import {
  estimateTestDesign,
  generateScenarios,
  generateTestCases,
  mockEstimateResponse,
  mockGenerateScenariosResponse,
  mockGenerateTestCasesResponse,
} from "@/lib/ai-assistance/aiAssistanceClient";
import type {
  AiGenerationResult,
  AiGenerationState,
  GeneratedQaArtifact,
} from "@/lib/ai-assistance/types";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_AI === "true";
const DEFAULT_ORG = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID ?? "org_default";

type GenerateScenariosProps = {
  mode: "scenarios";
  projectId: string;
  businessRuleId: string;
  businessRuleTitle: string;
};

type GenerateTestCasesProps = {
  mode: "test-cases";
  projectId: string;
  scenarioId: string;
  scenarioTitle: string;
};

type AiGenerationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (artifacts: GeneratedQaArtifact[], aiRunId: string) => void;
} & (GenerateScenariosProps | GenerateTestCasesProps);

export function AiGenerationModal(props: AiGenerationModalProps) {
  const { isOpen, onClose, onAccept } = props;
  const [extraContext, setExtraContext] = useState("");
  const [state, setState] = useState<AiGenerationState>({ phase: "idle" });

  const contextLabel =
    props.mode === "scenarios" ? props.businessRuleTitle : props.scenarioTitle;
  const artifactLabel =
    props.mode === "scenarios" ? "cenários de teste" : "casos de teste";

  function handleClose() {
    setState({ phase: "idle" });
    setExtraContext("");
    onClose();
  }

  async function handleEstimate() {
    setState({ phase: "estimating" });
    try {
      if (USE_MOCK) {
        const result = mockEstimateResponse(contextLabel + " " + extraContext);
        setState({
          phase: "estimated",
          estimatedCredits: result.estimatedCredits,
          pricingNote: result.pricingNote,
          expiresAt: result.expiresAt,
        });
        return;
      }

      const result = await estimateTestDesign({
        organizationId: DEFAULT_ORG,
        projectId: props.projectId,
        generationType:
          props.mode === "scenarios"
            ? "scenarios_from_business_rule"
            : "test_cases_from_scenario",
        sourceArtifactId:
          props.mode === "scenarios" ? props.businessRuleId : props.scenarioId,
        context: extraContext || undefined,
      });
      setState({
        phase: "estimated",
        estimatedCredits: result.estimatedCredits,
        pricingNote: result.pricingNote,
        expiresAt: result.expiresAt,
      });
    } catch {
      setState({
        phase: "error",
        message: "Não foi possível estimar créditos. Tente novamente.",
      });
    }
  }

  async function handleGenerate() {
    if (state.phase !== "estimated") return;
    const credits = state.estimatedCredits;

    setState({ phase: "generating" });
    try {
      let result: AiGenerationResult;

      if (USE_MOCK) {
        result =
          props.mode === "scenarios"
            ? mockGenerateScenariosResponse(props.businessRuleTitle)
            : mockGenerateTestCasesResponse(props.scenarioTitle);
      } else if (props.mode === "scenarios") {
        result = await generateScenarios({
          organizationId: DEFAULT_ORG,
          projectId: props.projectId,
          businessRuleId: props.businessRuleId,
          confirmedEstimatedCredits: credits,
          context: extraContext || undefined,
        });
      } else {
        result = await generateTestCases({
          organizationId: DEFAULT_ORG,
          projectId: props.projectId,
          scenarioId: props.scenarioId,
          confirmedEstimatedCredits: credits,
          context: extraContext || undefined,
        });
      }

      setState({ phase: "completed", result });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro de comunicação com o backend. Verifique se o servidor está rodando.";
      setState({ phase: "error", message });
    }
  }

  function handleAccept() {
    if (state.phase === "completed") {
      onAccept(state.result.artifacts, state.result.aiRunId);
      handleClose();
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Gerar ${artifactLabel} com IA`}
    >
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-teal-700">
              Assistência IA
            </p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
              Gerar {artifactLabel} com IA
            </h2>
          </div>
          <button
            type="button"
            aria-label="Fechar modal"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div className="rounded-xl border border-teal-800/15 bg-teal-50 px-4 py-3">
            <p className="text-xs font-black uppercase tracking-wide text-teal-700">
              {props.mode === "scenarios" ? "Regra de negócio" : "Cenário"}
            </p>
            <p className="mt-1 text-sm font-semibold text-teal-900">{contextLabel}</p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
            Os {artifactLabel} gerados são{" "}
            <strong>rascunhos assistidos por IA que requerem validação humana</strong>. Serão salvos
            como <strong>rascunho</strong> e devem ser revisados por um QA antes de uso.
          </div>

          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Contexto adicional (opcional)
            <textarea
              className="min-h-20 rounded-xl border border-slate-900/10 bg-white px-3 py-2 font-medium text-slate-900 outline-none focus:border-teal-600"
              placeholder="Adicione regras, restrições ou detalhes que ajudem a IA a gerar resultados melhores..."
              value={extraContext}
              onChange={(e) => setExtraContext(e.target.value)}
              disabled={state.phase === "generating" || state.phase === "completed"}
            />
          </label>

          {state.phase === "idle" && (
            <button
              type="button"
              onClick={handleEstimate}
              className="w-full rounded-xl border border-teal-700/30 bg-teal-50 px-4 py-2.5 text-sm font-black text-teal-800 transition hover:bg-teal-100"
            >
              Ver estimativa de créditos
            </button>
          )}

          {state.phase === "estimating" && (
            <p className="text-center text-sm font-semibold text-slate-500">
              Calculando estimativa...
            </p>
          )}

          {state.phase === "estimated" && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="text-2xl font-black text-slate-950">
                  {state.estimatedCredits}
                </span>
                <div>
                  <p className="text-sm font-black text-slate-700">créditos estimados</p>
                  <p className="text-xs text-slate-500">{state.pricingNote}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="flex-1 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white transition hover:bg-teal-800"
                >
                  Confirmar e gerar {artifactLabel}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-700 transition hover:border-slate-400"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {state.phase === "generating" && (
            <div className="space-y-2 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-700" />
              <p className="text-sm font-semibold text-slate-500">
                Gerando {artifactLabel}… Aguarde.
              </p>
            </div>
          )}

          {state.phase === "completed" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-black uppercase tracking-wide text-teal-700">
                  {artifactLabel} sugeridos — rascunho assistido por IA
                </p>
                {state.result.artifacts.map((artifact) => (
                  <div
                    key={artifact.id}
                    className="rounded-xl border border-teal-200 bg-teal-50 p-3"
                    data-testid="ai-artifact-card"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-black text-teal-700"
                        data-testid="ai-draft-label"
                      >
                        rascunho
                      </span>
                      <span
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600"
                        data-testid="ai-assisted-label"
                      >
                        assistido por IA
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-bold text-teal-900">{artifact.title}</p>
                    {artifact.description && (
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">
                        {artifact.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500">
                Créditos consumidos: <strong>{state.result.consumedCredits}</strong>
              </p>
              <p className="text-xs font-semibold text-amber-700">
                Todos os artefatos requerem revisão humana antes de serem promovidos a ativos.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleAccept}
                  className="flex-1 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-black text-white transition hover:bg-teal-800"
                >
                  Aceitar como rascunho
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-700 transition hover:border-slate-400"
                >
                  Descartar
                </button>
              </div>
            </div>
          )}

          {state.phase === "error" && (
            <div className="space-y-3">
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
                {state.message}
              </div>
              <p className="text-xs text-slate-500">
                Caso a geração tenha falhado por problema do serviço, os créditos estimados não
                foram consumidos.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setState({ phase: "idle" })}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-700 transition hover:border-slate-400"
                >
                  Tentar novamente
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-700 transition hover:border-slate-400"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
