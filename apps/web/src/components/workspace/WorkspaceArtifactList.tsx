'use client';

import { useState } from 'react';
import type {
  WorkspaceArtifact,
  ArtifactListResponse,
  ArtifactType,
  ArtifactStatus,
} from '@/lib/artifacts/artifactTypes';
import {
  ARTIFACT_TYPE_LABELS,
  ARTIFACT_STATUS_LABELS,
} from '@/lib/artifacts/artifactTypes';

interface Props {
  data: ArtifactListResponse;
  onSelect: (artifact: WorkspaceArtifact) => void;
  onFiltersChange: (filters: {
    artifactType?: ArtifactType;
    status?: ArtifactStatus;
    sourceCheckupReportId?: string;
  }) => void;
  onClearReportFilter?: () => void;
}

const STATUS_COLORS: Record<ArtifactStatus, string> = {
  DRAFT: 'bg-yellow-100 text-yellow-800',
  REVIEWED: 'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  ARCHIVED: 'bg-gray-100 text-gray-500',
};

export default function WorkspaceArtifactList({ data, onSelect, onFiltersChange, onClearReportFilter }: Props) {
  const [typeFilter, setTypeFilter] = useState<ArtifactType | ''>('');
  const [statusFilter, setStatusFilter] = useState<ArtifactStatus | ''>('');
  const [reportFilter, setReportFilter] = useState('');

  function applyFilters(
    type: ArtifactType | '',
    status: ArtifactStatus | '',
    report: string
  ) {
    onFiltersChange({
      artifactType: type || undefined,
      status: status || undefined,
      sourceCheckupReportId: report.trim() || undefined,
    });
  }

  function handleTypeChange(val: ArtifactType | '') {
    setTypeFilter(val);
    applyFilters(val, statusFilter, reportFilter);
  }

  function handleStatusChange(val: ArtifactStatus | '') {
    setStatusFilter(val);
    applyFilters(typeFilter, val, reportFilter);
  }

  function handleReportChange(val: string) {
    setReportFilter(val);
    applyFilters(typeFilter, statusFilter, val);
    if (!val.trim() && onClearReportFilter) {
      onClearReportFilter();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Tipo</label>
          <select
            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
            value={typeFilter}
            onChange={e => handleTypeChange(e.target.value as ArtifactType | '')}
          >
            <option value="">Todos os tipos</option>
            <option value="REQUIREMENT">Requisito</option>
            <option value="RISK_ITEM">Item de Risco</option>
            <option value="QA_ACTION">Ação de QA</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Status</label>
          <select
            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
            value={statusFilter}
            onChange={e => handleStatusChange(e.target.value as ArtifactStatus | '')}
          >
            <option value="">Todos os status</option>
            <option value="DRAFT">Rascunho</option>
            <option value="REVIEWED">Revisado</option>
            <option value="ACCEPTED">Aceito</option>
            <option value="ARCHIVED">Arquivado</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">ID do relatório de origem</label>
          <input
            type="text"
            placeholder="Ex: rpt_abc123"
            className="text-sm border border-gray-300 rounded px-2 py-1 w-48"
            value={reportFilter}
            onChange={e => handleReportChange(e.target.value)}
          />
        </div>
      </div>

      {/* Aviso de limite */}
      {data.limitReached && (
        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          Exibindo os 200 itens mais recentes. Use os filtros para refinar os resultados.
        </div>
      )}

      {/* Lista */}
      {data.artifacts.length === 0 ? (
        <p className="text-sm text-gray-500 py-4">Nenhum artefato encontrado para os filtros selecionados.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {data.artifacts.map(artifact => (
            <button
              key={artifact.id}
              onClick={() => onSelect(artifact)}
              className="text-left border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 rounded px-2 py-0.5">
                    {ARTIFACT_TYPE_LABELS[artifact.artifactType as ArtifactType] ?? artifact.artifactType}
                  </span>
                  <span className={`text-xs font-medium rounded px-2 py-0.5 ${STATUS_COLORS[artifact.status as ArtifactStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                    {ARTIFACT_STATUS_LABELS[artifact.status as ArtifactStatus] ?? artifact.status}
                  </span>
                  {artifact.aiAssisted && (
                    <span className="text-xs text-purple-700 bg-purple-50 border border-purple-200 rounded px-2 py-0.5">
                      IA
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400 truncate max-w-xs">
                  {artifact.sourceSection}
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-gray-800 truncate">{artifact.title}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
