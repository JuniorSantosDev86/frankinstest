"use client";

import Link from "next/link";
import type { CheckupRunListItem } from "@/lib/checkup/checkupTypes";

// Status badge copy and colors (all pt-BR)
const STATUS_LABEL: Record<string, string> = {
  completed: "Concluído",
  running: "Em andamento",
  failed: "Falhou",
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  running: "bg-yellow-100 text-yellow-700",
  failed: "bg-red-100 text-red-700",
};

const DEPTH_LABEL: Record<string, string> = {
  QUICK: "Rápido",
  STANDARD: "Padrão",
  DEEP: "Profundo",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncate(value: string | null, max = 60): string {
  if (!value) return "—";
  return value.length > max ? value.substring(0, max) + "…" : value;
}

function ArtifactCount({ status, count }: { status: string; count: number }) {
  if (status !== "completed") return <span className="text-gray-400">—</span>;
  if (count === 0)
    return <span className="text-gray-400 text-xs">Nenhum artefato</span>;
  return (
    <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
      {count} {count === 1 ? "artefato criado" : "artefatos criados"}
    </span>
  );
}

export default function CheckupHistoryItem({ item }: { item: CheckupRunListItem }) {
  const badgeClass =
    STATUS_BADGE_CLASS[item.status] ?? "bg-gray-100 text-gray-600";
  const statusLabel = STATUS_LABEL[item.status] ?? item.status;
  const canOpenReport = item.status === "completed" && item.reportId != null;

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      {/* Alvo */}
      <td className="px-4 py-3 text-sm">
        <div className="font-medium text-gray-900 truncate max-w-xs" title={item.targetValue ?? ""}>
          {truncate(item.targetValue)}
        </div>
        <div className="text-xs text-gray-400 mt-0.5">{item.targetType ?? "—"}</div>
      </td>

      {/* Profundidade */}
      <td className="px-4 py-3 text-sm text-gray-600">
        {item.depth ? DEPTH_LABEL[item.depth] ?? item.depth : "—"}
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badgeClass}`}>
          {statusLabel}
        </span>
      </td>

      {/* Data de criação */}
      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
        {formatDate(item.createdAt)}
      </td>

      {/* Créditos */}
      <td className="px-4 py-3 text-xs text-gray-600 text-right whitespace-nowrap">
        <span title="Estimado">{item.estimatedCredits} est.</span>
        {" / "}
        <span title="Consumido">{item.consumedCredits} cons.</span>
      </td>

      {/* Artefatos */}
      <td className="px-4 py-3 text-xs text-center">
        <ArtifactCount status={item.status} count={item.artifactCount} />
      </td>

      {/* Ação */}
      <td className="px-4 py-3 text-right">
        {canOpenReport ? (
          <Link
            href={`/checkup/${item.aiRunId}`}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
          >
            Ver relatório
          </Link>
        ) : (
          <span className="text-xs text-gray-300 cursor-not-allowed">Ver relatório</span>
        )}
      </td>
    </tr>
  );
}
