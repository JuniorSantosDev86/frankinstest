"use client";

import type { CheckupRunsSummary } from "@/lib/checkup/checkupTypes";

interface Props {
  data: CheckupRunsSummary | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

interface MetricProps {
  label: string;
  value: number | string;
  colorClass?: string;
}

function Metric({ label, value, colorClass = "text-slate-900" }: MetricProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      <span className={`text-2xl font-bold ${colorClass}`}>{value}</span>
    </div>
  );
}

export default function CommandCenterPanel({ data, loading, error, onRetry }: Props) {
  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-slate-50 p-6">
        <p className="text-sm text-gray-400">Carregando resumo…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 flex items-center justify-between">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={onRetry}
          className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-md hover:bg-red-100"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!data || data.totalRuns === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-slate-50 p-6 text-center">
        <p className="text-sm text-gray-500">
          Nenhum Check-up realizado ainda. O resumo aparecerá aqui após a primeira execução.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-slate-50 p-5">
      <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
        Resumo da organização
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Metric label="Total de Check-ups" value={data.totalRuns} />
        <Metric
          label="Concluídos"
          value={data.completedRuns}
          colorClass="text-green-700"
        />
        <Metric
          label="Em andamento"
          value={data.runningRuns}
          colorClass="text-yellow-700"
        />
        <Metric
          label="Falhos"
          value={data.failedRuns}
          colorClass="text-red-700"
        />
        <Metric
          label="Créditos consumidos no total"
          value={data.totalConsumedCredits}
          colorClass="text-slate-700"
        />
        <Metric
          label="Artefatos gerados"
          value={data.totalArtifacts}
          colorClass="text-indigo-700"
        />
      </div>
    </div>
  );
}
