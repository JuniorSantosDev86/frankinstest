"use client";

import { useRef, useState } from "react";

import {
  estimateGeneration,
  generateScenarios,
  generateTestCases,
} from "@/lib/ai-assistance/aiAssistanceClient";
import type {
  AiGenerateScenariosRequest,
  AiGenerateTestCasesRequest,
  AiGenerationState,
  AiRunResult,
} from "@/lib/ai-assistance/types";

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
  onAccept: (output: string, aiRunId: string) => void;
} & (GenerateScenariosProps | GenerateTestCasesProps);

export function AiGenerationModal(props: AiGenerationModalProps) {
  const { isOpen, onClose, onAccept } = props;
  const [extraContext, setExtraContext] = useState("");
  const [state, setState] = useState<AiGenerationState>({ phase: "idle" });
  const dialogRef = useRef<HTMLDivElement>(null);

  const contextLabel = props.mode === "scenarios" ? props.businessRuleTitle : props.scenarioTitle;
  const artifactLabel = props.mode === "scenarios" ? "cenários de teste" : "casos de teste";

  function handleClose() {
    setState({ phase: "idle" });
    setExtraContext("");
    onClose();
  }

  async function handleEstimate() {
    setState({ phase: "estimating" });
    try {
      const result = await estimateGeneration({
        feature: props.mode === "scenarios" ? "generate_scenarios" : "generate_test_cases",
        context: contextLabel + " " + extraContext,
      });
      setState({
        phase: "estimated",
        estimatedCredits: result.estimatedCredits,
        pricingNote: result.pricingNote,
      });
    } catch {
      setState({ phase: "error", message: "Não foi possível estimar créditos. Tente novamente." });
    }
  }

  async function handleGenerate() {
    setState({ phase: "generating" });
    try {
      let result: AiRunResult;
      if (props.mode === "scenarios") {
        const req: AiGenerateScenariosRequest = {
          projectId: props.projectId,
          businessRuleId: props.businessRuleId,
          businessRuleTitle: props.businessRuleTitle,
          context: extraContext || undefined,
        };
        result = await generateScenarios(req);
      } else {
        const req: AiGenerateTestCasesRequest = {
          projectId: props.projectId,
          scenarioId: props.scenarioId,
          scenarioTitle: props.scenarioTitle,
          context: extraContext || undefined,
        };
        result = await generateTestCases(req);
      }

      if (result.status === "failed") {
        setState({ phase: "error", message: result.errorMessage ?? "Erro desconhecido na geração." });
      } else {
        setState({ phase: "completed", result });
      }
    } catch {
      setState({ phase: "error", message: "Erro de comunicação com o backend. Verifique se o servidor está rodando." });
    }
  }

  function handleAccept() {
    if (state.phase === "completed" && state.result.output) {
      onAccept(state.result.output, state.result.aiRunId);
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
      <div
        ref={dialogRef}
        className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
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
            Os {artifactLabel} gerados são <strong>sugestões que requerem validação humana</strong>.
            Serão salvos como rascunho (IA assistida) e devem ser revisados por um QA antes de uso.
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
            <p className="text-center text-sm font-semibold text-slate-500">Calculando estimativa...</p>
          )}

          {state.phase === "estimated" && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="text-2xl font-black text-slate-950">{state.estimatedCredits}</span>
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
                  Gerar {artifactLabel}
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
                Gerando {artifactLabel}... Aguarde.
              </p>
            </div>
          )}

          {state.phase === "completed" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
                <p className="mb-2 text-xs font-black uppercase tracking-wide text-teal-700">
                  {artifactLabel} sugeridos — requerem validação
                </p>
                <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap text-xs leading-6 text-slate-700">
                  {state.result.output}
                </pre>
              </div>
              <p className="text-xs text-slate-500">
                Créditos consumidos: <strong>{state.result.consumedCredits}</strong>
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
