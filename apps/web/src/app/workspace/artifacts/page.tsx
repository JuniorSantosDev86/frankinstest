'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { WorkspaceArtifact, ArtifactType, ArtifactStatus } from '@/lib/artifacts/artifactTypes';
import type { ArtifactListResponse } from '@/lib/artifacts/artifactTypes';
import { listArtifacts } from '@/lib/artifacts/artifactsApi';
import WorkspaceArtifactList from '@/components/workspace/WorkspaceArtifactList';
import WorkspaceArtifactDetailPanel from '@/components/workspace/WorkspaceArtifactDetailPanel';
import { getDevToken } from '@/lib/auth/getDevToken';

const DEFAULT_ORG = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID ?? 'org_demo_personal';

function WorkspaceArtifactsPageInner() {
  const searchParams = useSearchParams();
  const initialReportId = searchParams.get('sourceCheckupReportId') ?? undefined;

  const [data, setData] = useState<ArtifactListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<WorkspaceArtifact | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState<{
    artifactType?: ArtifactType;
    status?: ArtifactStatus;
    sourceCheckupReportId?: string;
  }>({ sourceCheckupReportId: initialReportId });

  const orgId = DEFAULT_ORG;
  const token = getDevToken() ?? '';

  useEffect(() => {
    let cancelled = false;
    Promise.resolve()
      .then(() => { if (!cancelled) { setLoading(true); setError(null); } })
      .then(() => listArtifacts(orgId, token, filters))
      .then(result => { if (!cancelled) { setData(result); setLoading(false); } })
      .catch(e => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Erro ao carregar artefatos.');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [orgId, token, filters, refreshKey]);

  function handleFiltersChange(newFilters: typeof filters) {
    setFilters(newFilters);
    setSelected(null);
  }

  function handleArtifactUpdated(updated: WorkspaceArtifact) {
    setSelected(updated);
    setRefreshKey(k => k + 1);
  }

  function clearReportFilter() {
    setFilters(prev => ({ ...prev, sourceCheckupReportId: undefined }));
    setSelected(null);
  }

  return (
    <div className="flex h-full min-h-screen bg-gray-50">
      {/* Main list panel */}
      <div className={`flex flex-col flex-1 p-6 gap-4 ${selected ? 'max-w-2xl' : ''}`}>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Revisão de Artefatos</h1>
        </div>

        {filters.sourceCheckupReportId && (
          <div className="flex items-center justify-between gap-3 bg-blue-50 border border-blue-200 rounded-md px-3 py-2 text-sm text-blue-800">
            <span>Exibindo artefatos do relatório: <strong>{filters.sourceCheckupReportId}</strong></span>
            <button
              onClick={clearReportFilter}
              className="text-blue-600 hover:text-blue-800 underline shrink-0"
            >
              Ver todos os artefatos
            </button>
          </div>
        )}

        {loading && (
          <p className="text-sm text-gray-500">Carregando artefatos…</p>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </div>
        )}

        {!loading && !error && data && (
          <WorkspaceArtifactList
            key={JSON.stringify(filters)}
            data={data}
            onSelect={setSelected}
            onFiltersChange={handleFiltersChange}
            onClearReportFilter={filters.sourceCheckupReportId ? clearReportFilter : undefined}
          />
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-96 border-l border-gray-200 bg-white p-6 overflow-y-auto">
          <WorkspaceArtifactDetailPanel
            artifact={selected}
            orgId={orgId}
            token={token}
            onUpdated={handleArtifactUpdated}
            onClose={() => setSelected(null)}
          />
        </div>
      )}
    </div>
  );
}

export default function WorkspaceArtifactsPage() {
  return (
    <Suspense>
      <WorkspaceArtifactsPageInner />
    </Suspense>
  );
}
