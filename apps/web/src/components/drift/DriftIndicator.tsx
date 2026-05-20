import type { DriftResult, DriftStatus } from '@/lib/drift/driftTypes';
import { DRIFT_STATUS_LABELS } from '@/lib/drift/driftTypes';

interface DriftIndicatorProps {
  driftResult: DriftResult | null;
  loading: boolean;
  error: boolean;
}

const STATUS_STYLES: Record<DriftStatus, string> = {
  SEM_DRIFT: 'bg-green-100 text-green-700 border-green-200',
  POSSIVEL_DRIFT: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  RASTREABILIDADE_INCOMPLETA: 'bg-orange-100 text-orange-700 border-orange-200',
  RELATORIO_INDISPONIVEL: 'bg-gray-100 text-gray-500 border-gray-200',
};

export default function DriftIndicator({ driftResult, loading, error }: DriftIndicatorProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <span className="inline-block w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
        Verificando drift…
      </div>
    );
  }

  if (error || !driftResult) {
    return (
      <p className="text-xs text-gray-400 italic">
        Não foi possível calcular drift agora
      </p>
    );
  }

  const { driftStatus, signals } = driftResult;
  const label = DRIFT_STATUS_LABELS[driftStatus];
  const style = STATUS_STYLES[driftStatus];

  return (
    <div className="space-y-1.5">
      <span
        className={`inline-block px-2 py-0.5 rounded border text-xs font-medium ${style}`}
      >
        {label}
      </span>
      {signals.length > 0 && (
        <ul className="space-y-0.5">
          {signals.map((signal) => (
            <li key={signal.code} className="text-xs text-gray-500">
              • {signal.reasonPtBr}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
