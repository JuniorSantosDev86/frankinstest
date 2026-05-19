'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listArtifacts } from '@/lib/artifacts/artifactsApi';
import type { WorkspaceArtifact } from '@/lib/artifacts/artifactTypes';
import { ARTIFACT_TYPE_LABELS, ARTIFACT_STATUS_LABELS } from '@/lib/artifacts/artifactTypes';
import type { ArtifactStatus, ArtifactType } from '@/lib/artifacts/artifactTypes';

interface Props {
  reportId: string;
  orgId: string;
  token: string;
}

export default function CheckupArtifactsSection({ reportId, orgId, token }: Props) {
  const [artifacts, setArtifacts] = useState<WorkspaceArtifact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listArtifacts(orgId, token, { sourceCheckupReportId: reportId })
      .then(result => { if (!cancelled) { setArtifacts(result.artifacts); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reportId, orgId, token]);

  if (loading) return null;

  return (
    <section className="mt-6 border-t border-gray-200 pt-5">
      <h2 className="text-base font-semibold text-gray-800 mb-3">
        Artefatos criados a partir deste relatório
      </h2>

      {artifacts.length === 0 ? (
        <p className="text-sm text-gray-500">
          Nenhum artefato criado a partir deste relatório ainda. Converta itens do relatório acima para criar artefatos.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {artifacts.map(artifact => (
            <Link
              key={artifact.id}
              href={`/workspace/artifacts?sourceCheckupReportId=${reportId}`}
              className="flex items-center justify-between gap-2 border border-gray-200 rounded-md px-3 py-2 hover:bg-gray-50 text-sm"
            >
              <span className="font-medium text-gray-800 truncate">{artifact.title}</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-gray-500 bg-gray-100 rounded px-2 py-0.5">
                  {ARTIFACT_TYPE_LABELS[artifact.artifactType as ArtifactType] ?? artifact.artifactType}
                </span>
                <span className="text-xs text-gray-500 bg-gray-100 rounded px-2 py-0.5">
                  {ARTIFACT_STATUS_LABELS[artifact.status as ArtifactStatus] ?? artifact.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
