import type { DriftSummary, DriftStatus } from '@/lib/drift/driftTypes';
import { DRIFT_STATUS_LABELS } from '@/lib/drift/driftTypes';

interface DriftSummaryPanelProps {
  driftSummary: DriftSummary | null;
  loading: boolean;
  error: boolean;
}

const STATUS_ORDER: DriftStatus[] = [
  'RELATORIO_INDISPONIVEL',
  'RASTREABILIDADE_INCOMPLETA',
  'POSSIVEL_DRIFT',
  'SEM_DRIFT',
];

const STATUS_STYLES: Record<DriftStatus, string> = {
  SEM_DRIFT: 'text-green-700',
  POSSIVEL_DRIFT: 'text-yellow-700',
  RASTREABILIDADE_INCOMPLETA: 'text-orange-700',
  RELATORIO_INDISPONIVEL: 'text-gray-500',
};

export default function DriftSummaryPanel({ driftSummary, loading, error }: DriftSummaryPanelProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-gray-400 py-2">
        <span className="inline-block w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
        Calculando resumo de drift…
      </div>
    );
  }

  if (error || !driftSummary) {
    return (
      <p className="text-xs text-gray-400 italic py-2">
        Resumo de drift indisponível
      </p>
    );
  }

  const { totalAnalyzed, countByStatus, missingSections } = driftSummary;

  if (totalAnalyzed === 0 && missingSections.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic">
        Nenhum artefato foi criado a partir deste relatório.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {totalAnalyzed > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
            Artefatos analisados: {totalAnalyzed}
          </p>
          <ul className="space-y-0.5">
            {STATUS_ORDER.map((status) => {
              const count = countByStatus[status] ?? 0;
              if (count === 0) return null;
              return (
                <li key={status} className={`text-xs ${STATUS_STYLES[status]}`}>
                  {DRIFT_STATUS_LABELS[status]}: <strong>{count}</strong>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {missingSections.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
            Seções sem artefatos criados
          </p>
          <ul className="space-y-0.5">
            {missingSections.map((section) => (
              <li key={section.sectionName} className="text-xs text-orange-700">
                {section.sectionName}: {section.existingArtifactCount}/{section.eligibleItemCount} criados
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
