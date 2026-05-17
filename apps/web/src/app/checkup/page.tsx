"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CheckupRequest, CheckupDepth, OutputMode, TargetType, CheckupEstimateResponse } from "@/lib/checkup/checkupTypes";
import { estimateCheckup, runCheckup, ApiError } from "@/lib/checkup/checkupApi";

const TARGET_TYPES: { value: TargetType; label: string; placeholder: string }[] = [
  { value: "URL", label: "URL", placeholder: "Cole a URL aqui (ex: https://exemplo.com.br)" },
  { value: "FEATURE_DESCRIPTION", label: "Descrição de Feature", placeholder: "Descreva a feature ou funcionalidade aqui" },
  { value: "API_DESCRIPTION", label: "Descrição de API", placeholder: "Descreva os endpoints, métodos e comportamentos esperados" },
  { value: "DOCUMENT", label: "Documento", placeholder: "Cole o conteúdo do documento aqui" },
  { value: "MOBILE_FLOW", label: "Fluxo Mobile", placeholder: "Descreva o fluxo mobile, telas e interações" },
  { value: "OTHER", label: "Outro", placeholder: "Descreva o alvo da análise" },
];

const DEPTH_OPTIONS: { value: CheckupDepth; label: string; description: string }[] = [
  { value: "QUICK", label: "Rápido", description: "Análise objetiva dos principais riscos" },
  { value: "STANDARD", label: "Padrão", description: "Análise completa com cenários de teste" },
  { value: "DEEP", label: "Profundo", description: "Relatório detalhado e recomendações de release" },
];

const OUTPUT_MODES: { value: OutputMode; label: string }[] = [
  { value: "REPORT_ONLY", label: "Apenas relatório" },
  { value: "REPORT_WITH_SCENARIOS", label: "Relatório + cenários de teste" },
];

interface EstimateState {
  data: CheckupEstimateResponse | null;
  loading: boolean;
  error: string | null;
}

export default function CheckupPage() {
  const router = useRouter();

  const [targetType, setTargetType] = useState<TargetType>("FEATURE_DESCRIPTION");
  const [targetValue, setTargetValue] = useState("");
  const [context, setContext] = useState("");
  const [goal, setGoal] = useState("");
  const [depth, setDepth] = useState<CheckupDepth>("STANDARD");
  const [outputMode, setOutputMode] = useState<OutputMode>("REPORT_WITH_SCENARIOS");
  const [authorized, setAuthorized] = useState(false);
  const [targetAudience, setTargetAudience] = useState("");
  const [criticalFlows, setCriticalFlows] = useState("");
  const [knownRisks, setKnownRisks] = useState("");
  const [technologies, setTechnologies] = useState("");
  const [showOptional, setShowOptional] = useState(false);

  const [estimate, setEstimate] = useState<EstimateState>({ data: null, loading: false, error: null });
  const [showConfirm, setShowConfirm] = useState(false);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  const currentTarget = TARGET_TYPES.find((t) => t.value === targetType)!;

  const isFormValid =
    targetValue.trim().length > 0 &&
    context.trim().length >= 20 &&
    goal.trim().length >= 10 &&
    authorized;

  function buildRequest(): CheckupRequest {
    return {
      targetType,
      targetValue: targetValue.trim(),
      userAuthorizationConfirmed: authorized,
      context: context.trim(),
      goal: goal.trim(),
      depth,
      outputMode,
      targetAudience: targetAudience.trim() || undefined,
      criticalFlows: criticalFlows.trim() || undefined,
      knownRisks: knownRisks.trim() || undefined,
      technologies: technologies.trim() || undefined,
    };
  }

  async function handleEstimate() {
    setEstimate({ data: null, loading: true, error: null });
    try {
      const data = await estimateCheckup(buildRequest());
      setEstimate({ data, loading: false, error: null });
      setShowConfirm(true);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Erro ao estimar créditos. Tente novamente.";
      setEstimate({ data: null, loading: false, error: msg });
    }
  }

  async function handleRun() {
    setRunning(true);
    setRunError(null);
    try {
      const result = await runCheckup(buildRequest());
      router.push(`/checkup/${result.aiRunId}`);
    } catch (err) {
      if (err instanceof ApiError && err.isInsufficientCredits) {
        setRunError("Saldo de créditos insuficiente. Adquira mais créditos para continuar.");
      } else {
        setRunError("Não foi possível iniciar a análise. Tente novamente.");
      }
      setRunning(false);
    }
  }

  if (showConfirm && estimate.data) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">Confirmar Check-up</h1>
        <p className="text-gray-600 mb-6">
          Este relatório será gerado como rascunho e requer sua revisão antes de ser usado como artefato final.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800 font-medium mb-1">Estimativa de créditos</p>
          <p className="text-3xl font-bold text-blue-900">{estimate.data.estimatedCredits} créditos</p>
          <p className="text-xs text-blue-600 mt-1">
            Base: {estimate.data.breakdown.base} × {estimate.data.breakdown.outputMultiplier}x (modo de output)
          </p>
        </div>

        {runError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 text-sm text-red-700">
            {runError}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleRun}
            disabled={running}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {running ? "Iniciando análise..." : "Executar Check-up"}
          </button>
          <button
            onClick={() => { setShowConfirm(false); setRunError(null); }}
            disabled={running}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-1">Check-up de QA</h1>
      <p className="text-gray-600 mb-6">Análise assistida por IA — identifique riscos antes de lançar.</p>

      <div className="space-y-5">
        {/* Tipo do alvo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo do alvo <span className="text-red-500">*</span>
          </label>
          <select
            value={targetType}
            onChange={(e) => setTargetType(e.target.value as TargetType)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            {TARGET_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Valor do alvo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {currentTarget.label} <span className="text-red-500">*</span>
          </label>
          <textarea
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            placeholder={currentTarget.placeholder}
            rows={2}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        {/* Contexto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            O que este produto/página faz? <span className="text-red-500">*</span>
          </label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Descreva o produto, funcionalidade ou contexto que será analisado (mínimo 20 caracteres)"
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          {context.length > 0 && context.length < 20 && (
            <p className="text-xs text-red-500 mt-1">Mínimo de 20 caracteres ({context.length}/20)</p>
          )}
        </div>

        {/* Objetivo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            O que você quer validar? <span className="text-red-500">*</span>
          </label>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Ex: Identificar riscos de validação do formulário de cadastro (mínimo 10 caracteres)"
            rows={2}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          {goal.length > 0 && goal.length < 10 && (
            <p className="text-xs text-red-500 mt-1">Mínimo de 10 caracteres ({goal.length}/10)</p>
          )}
        </div>

        {/* Profundidade */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Profundidade da análise <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {DEPTH_OPTIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => setDepth(d.value)}
                className={`border rounded-md px-3 py-2 text-sm text-left ${
                  depth === d.value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <div className="font-medium">{d.label}</div>
                <div className="text-xs text-gray-500">{d.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Modo de output */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Modo de output <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            {OUTPUT_MODES.map((m) => (
              <button
                key={m.value}
                onClick={() => setOutputMode(m.value)}
                className={`flex-1 border rounded-md px-3 py-2 text-sm ${
                  outputMode === m.value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Campos opcionais */}
        <div>
          <button
            onClick={() => setShowOptional(!showOptional)}
            className="text-sm text-blue-600 hover:underline"
          >
            {showOptional ? "▲ Ocultar" : "▼ Adicionar"} informações opcionais
          </button>
          {showOptional && (
            <div className="mt-3 space-y-3 border border-gray-200 rounded-md p-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Público-alvo</label>
                <input type="text" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="Ex: PMEs brasileiras, desenvolvedores frontend"
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fluxos críticos</label>
                <input type="text" value={criticalFlows} onChange={(e) => setCriticalFlows(e.target.value)}
                  placeholder="Ex: Cadastro, checkout, recuperação de senha"
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Riscos conhecidos</label>
                <input type="text" value={knownRisks} onChange={(e) => setKnownRisks(e.target.value)}
                  placeholder="Ex: Formulário não valida e-mail no mobile"
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tecnologias</label>
                <input type="text" value={technologies} onChange={(e) => setTechnologies(e.target.value)}
                  placeholder="Ex: React, Vercel, PostgreSQL"
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm" />
              </div>
            </div>
          )}
        </div>

        {/* Autorização */}
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={authorized}
              onChange={(e) => setAuthorized(e.target.checked)}
              className="mt-0.5"
            />
            <span className="text-sm text-amber-800">
              Confirmo que estou autorizado a submeter este alvo para análise assistida por IA e que as informações fornecidas não contêm dados sensíveis de terceiros sem consentimento.
            </span>
          </label>
        </div>

        {estimate.error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
            {estimate.error}
          </div>
        )}

        <button
          onClick={handleEstimate}
          disabled={!isFormValid || estimate.loading}
          className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-md font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {estimate.loading ? "Calculando..." : "Estimar créditos"}
        </button>
      </div>
    </div>
  );
}
