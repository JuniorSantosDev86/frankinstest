"use client";

import { useParams, useRouter } from "next/navigation";
import { useCheckupPolling } from "@/lib/checkup/useCheckupPolling";
import type { FindingItem, ScenarioItem, TestCaseItem, ActionItem } from "@/lib/checkup/checkupTypes";
import CheckupConversionPanel from "./CheckupConversionPanel";

const SEVERITY_COLORS: Record<string, string> = {
  LOW: "bg-green-100 text-green-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-red-100 text-red-700",
};

const SCENARIO_TYPE_LABELS: Record<string, string> = {
  POSITIVE: "Positivo",
  NEGATIVE: "Negativo",
  EDGE_CASE: "Caso limite",
};

function Badge({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
}

function FindingList({ title, items }: { title: string; items: FindingItem[] }) {
  if (!items?.length) return null;
  return (
    <section className="mb-6">
      <h2 className="text-base font-semibold text-gray-800 mb-3">{title}</h2>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="border border-gray-200 rounded-md p-3">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="font-medium text-sm">{item.title}</p>
              <Badge label={item.severity} colorClass={SEVERITY_COLORS[item.severity] ?? "bg-gray-100 text-gray-600"} />
            </div>
            <p className="text-sm text-gray-600">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ScenarioList({ items }: { items: ScenarioItem[] }) {
  if (!items?.length) return null;
  return (
    <section className="mb-6">
      <h2 className="text-base font-semibold text-gray-800 mb-3">Cenários de teste sugeridos</h2>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="border border-gray-200 rounded-md p-3">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="font-medium text-sm">{item.title}</p>
              <Badge label={SCENARIO_TYPE_LABELS[item.type] ?? item.type} colorClass="bg-blue-100 text-blue-700" />
            </div>
            <p className="text-sm text-gray-600">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function TestCaseList({ items }: { items: TestCaseItem[] }) {
  if (!items?.length) return null;
  return (
    <section className="mb-6">
      <h2 className="text-base font-semibold text-gray-800 mb-3">Casos de teste sugeridos</h2>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="border border-gray-200 rounded-md p-3">
            <p className="font-medium text-sm mb-1">{item.title}</p>
            {item.preconditions && <p className="text-xs text-gray-500 mb-1"><strong>Pré-condições:</strong> {item.preconditions}</p>}
            {item.steps?.length > 0 && (
              <ol className="text-sm text-gray-600 list-decimal list-inside space-y-0.5 mb-1">
                {item.steps.map((step, j) => <li key={j}>{step}</li>)}
              </ol>
            )}
            {item.expectedResult && <p className="text-xs text-gray-500"><strong>Resultado esperado:</strong> {item.expectedResult}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

function ActionList({ items }: { items: ActionItem[] }) {
  if (!items?.length) return null;
  return (
    <section className="mb-6">
      <h2 className="text-base font-semibold text-gray-800 mb-3">Próximas ações recomendadas</h2>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="border border-gray-200 rounded-md p-3">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="font-medium text-sm">{item.action}</p>
              <Badge label={item.priority} colorClass={PRIORITY_COLORS[item.priority] ?? "bg-gray-100 text-gray-600"} />
            </div>
            <p className="text-sm text-gray-600">{item.rationale}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function CheckupRunPage() {
  const params = useParams();
  const router = useRouter();
  const aiRunId = typeof params.runId === "string" ? params.runId : null;
  const { status, error, timedOut } = useCheckupPolling(aiRunId);

  // Loading state
  if (!status || status.status === "running" || status.status === "reserved") {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Analisando... isso pode levar alguns instantes.</p>
        {error && !timedOut && <p className="text-sm text-orange-500 mt-2">{error}</p>}
        {timedOut && (
          <div className="mt-4">
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={() => router.refresh()} className="mt-2 text-sm text-blue-600 hover:underline">
              Atualizar página
            </button>
          </div>
        )}
      </div>
    );
  }

  // Error state
  if (status.status === "failed") {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-5 text-center">
          <p className="text-red-700 font-medium mb-1">Não foi possível concluir a análise.</p>
          <p className="text-red-600 text-sm">Seus créditos foram preservados.</p>
          <button
            onClick={() => router.push("/checkup")}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // Success state
  const report = status.report;
  if (!report) return null;

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-bold">Relatório de Check-up</h1>
        <div className="flex gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded">
            Rascunho · Assistido por IA
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-1">
        Alvo: <span className="font-medium">{report.targetValue}</span>
      </p>
      <p className="text-sm text-gray-500 mb-4">
        Créditos consumidos: <span className="font-medium">{status.creditsConsumed}</span>
      </p>

      <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-6 text-sm text-amber-800">
        Este relatório é uma análise assistida por IA. Os achados são riscos potenciais e requerem confirmação antes de serem tratados como definitivos.
      </div>

      <FindingList title="Riscos de qualidade" items={report.qualityRisks} />
      <FindingList title="Requisitos ausentes ou imprecisos" items={report.missingOrUnclearRequirements} />
      <ScenarioList items={report.suggestedTestScenarios} />
      <TestCaseList items={report.suggestedTestCases} />
      <FindingList title="Riscos de UX e produto" items={report.uxProductRisks} />
      <FindingList title="Notas de release readiness" items={report.releaseReadinessNotes} />
      <ActionList items={report.recommendedNextActions} />

      {status.status === "completed" && (
        <CheckupConversionPanel
          reportId={report.id}
          sections={[
            {
              sectionKey: "missing_or_unclear_requirements",
              label: "Requisitos ausentes/incompletos",
              items: report.missingOrUnclearRequirements ?? [],
            },
            {
              sectionKey: "suggested_test_scenarios",
              label: "Cenários de teste sugeridos",
              items: report.suggestedTestScenarios ?? [],
            },
            {
              sectionKey: "suggested_test_cases",
              label: "Casos de teste sugeridos",
              items: report.suggestedTestCases ?? [],
            },
            {
              sectionKey: "quality_risks",
              label: "Riscos de qualidade",
              items: report.qualityRisks ?? [],
            },
            {
              sectionKey: "ux_product_risks",
              label: "Riscos de UX/produto",
              items: report.uxProductRisks ?? [],
            },
            {
              sectionKey: "release_readiness_notes",
              label: "Notas de release readiness",
              items: report.releaseReadinessNotes ?? [],
            },
          ]}
        />
      )}
    </div>
  );
}
