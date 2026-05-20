"use client";

import Link from "next/link";
import type { CheckupRunsPage } from "@/lib/checkup/checkupTypes";
import CheckupHistoryItem from "./CheckupHistoryItem";

interface Props {
  data: CheckupRunsPage | null;
  loading: boolean;
  error: string | null;
  page: number;
  onPageChange: (newPage: number) => void;
  onRetry: () => void;
}

export default function CheckupHistoryList({
  data,
  loading,
  error,
  page,
  onPageChange,
  onRetry,
}: Props) {
  if (loading) {
    return (
      <div className="py-12 text-center text-gray-500 text-sm">
        Carregando histórico…
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm text-red-600 mb-3">{error}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 text-sm border border-red-300 text-red-600 rounded-md hover:bg-red-50"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!data || data.content.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500 text-sm mb-2">
          Nenhum Check-up realizado ainda.
        </p>
        <p className="text-gray-400 text-xs mb-4">
          Inicie seu primeiro Check-up para ver o histórico aqui.
        </p>
        <Link
          href="/checkup"
          className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
        >
          Iniciar Check-up
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Alvo</th>
              <th className="px-4 py-3 text-left">Profundidade</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Data</th>
              <th className="px-4 py-3 text-right">Créditos</th>
              <th className="px-4 py-3 text-center">Artefatos</th>
              <th className="px-4 py-3 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {data.content.map((item) => (
              <CheckupHistoryItem key={item.aiRunId} item={item} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação simples */}
      {data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <span>
            Página {data.page + 1} de {data.totalPages} ({data.totalElements} Check-ups)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 0}
              className="px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= data.totalPages - 1}
              className="px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
