'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { WorkspaceArtifact, ArtifactStatus } from '@/lib/artifacts/artifactTypes';
import {
  ARTIFACT_TYPE_LABELS,
  ARTIFACT_STATUS_LABELS,
} from '@/lib/artifacts/artifactTypes';
import { updateArtifact } from '@/lib/artifacts/artifactsApi';

interface Props {
  artifact: WorkspaceArtifact;
  orgId: string;
  token: string;
  onUpdated: (updated: WorkspaceArtifact) => void;
  onClose: () => void;
}

const STATUS_OPTIONS: { value: ArtifactStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Rascunho' },
  { value: 'REVIEWED', label: 'Revisado' },
  { value: 'ACCEPTED', label: 'Aceito' },
  { value: 'ARCHIVED', label: 'Arquivado' },
];

export default function WorkspaceArtifactDetailPanel({
  artifact,
  orgId,
  token,
  onUpdated,
  onClose,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(artifact.title);
  const [description, setDescription] = useState(artifact.description ?? '');
  const [status, setStatus] = useState<ArtifactStatus>(artifact.status as ArtifactStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!title.trim()) {
      setError('O título não pode estar vazio.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await updateArtifact(artifact.id, orgId, token, {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
      });
      onUpdated(updated);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setTitle(artifact.title);
    setDescription(artifact.description ?? '');
    setStatus(artifact.status as ArtifactStatus);
    setError(null);
    setEditing(false);
  }

  const typeLabel =
    ARTIFACT_TYPE_LABELS[artifact.artifactType as keyof typeof ARTIFACT_TYPE_LABELS] ??
    artifact.artifactType;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-gray-500 bg-gray-100 rounded px-2 py-0.5">
            {typeLabel}
          </span>
          {artifact.aiAssisted && (
            <span className="text-xs text-purple-700 bg-purple-50 border border-purple-200 rounded px-2 py-0.5">
              Assistido por IA
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-sm text-gray-400 hover:text-gray-600 ml-auto"
          aria-label="Fechar painel"
        >
          ✕
        </button>
      </div>

      {/* Editable fields */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Título</label>
          {editing ? (
            <input
              type="text"
              className="text-sm border border-gray-300 rounded px-3 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={500}
            />
          ) : (
            <p className="text-sm font-medium text-gray-800">{artifact.title}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Descrição</label>
          {editing ? (
            <textarea
              className="text-sm border border-gray-300 rounded px-3 py-1.5 w-full h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          ) : (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {artifact.description ?? <span className="italic text-gray-400">Sem descrição</span>}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Status</label>
          {editing ? (
            <select
              className="text-sm border border-gray-300 rounded px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={status}
              onChange={e => setStatus(e.target.value as ArtifactStatus)}
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-gray-800">
              {ARTIFACT_STATUS_LABELS[artifact.status as ArtifactStatus] ?? artifact.status}
            </p>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {editing ? (
          <>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-sm bg-blue-600 text-white rounded px-4 py-1.5 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="text-sm text-gray-600 border border-gray-300 rounded px-4 py-1.5 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
          </>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-blue-600 border border-blue-200 rounded px-4 py-1.5 hover:bg-blue-50"
          >
            Editar
          </button>
        )}
      </div>

      {/* Read-only traceability fields */}
      <div className="mt-auto border-t border-gray-100 pt-4 flex flex-col gap-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Rastreabilidade (somente leitura)
        </p>

        {/* US2: 3-state origin report link */}
        {artifact.sourceCheckupReportId && (
          <div className="flex gap-2 text-xs">
            <span className="text-gray-400 w-32 shrink-0">Relatório de origem</span>
            {artifact.sourceAiRunId ? (
              <Link
                href={`/checkup/${artifact.sourceAiRunId}`}
                className="text-blue-600 underline hover:text-blue-800 break-all"
              >
                Ver relatório de origem
              </Link>
            ) : (
              <span aria-disabled="true" className="text-gray-400 cursor-not-allowed italic">
                Relatório de origem não disponível
              </span>
            )}
          </div>
        )}

        {/* US3: friendly sourceSection */}
        <ReadOnlyField
          label="Seção de origem"
          value={artifact.sourceSection?.trim() || 'Seção de origem não informada'}
        />

        {/* US3: 1-based sourceItemIndex — only render when not null */}
        {artifact.sourceItemIndex != null && (
          <ReadOnlyField
            label="Posição no relatório"
            value={`Item de origem #${artifact.sourceItemIndex + 1}`}
          />
        )}

        <ReadOnlyField label="Criado por" value={artifact.createdBy} />
        <ReadOnlyField
          label="Criado em"
          value={new Date(artifact.createdAt).toLocaleString('pt-BR')}
        />
        <ReadOnlyField
          label="Atualizado em"
          value={new Date(artifact.updatedAt).toLocaleString('pt-BR')}
        />
      </div>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex gap-2 text-xs">
      <span className="text-gray-400 w-32 shrink-0">{label}</span>
      <span className="text-gray-600 break-all">{value ?? ''}</span>
    </div>
  );
}
