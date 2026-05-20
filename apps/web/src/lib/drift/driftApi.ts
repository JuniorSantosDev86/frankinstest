import type { DriftResult, DriftSummary } from './driftTypes';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export async function getArtifactDrift(
  artifactId: string,
  token: string,
  orgId: string,
): Promise<DriftResult> {
  const res = await fetch(`${API_BASE}/api/drift/artifacts/${artifactId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Organization-Id': orgId,
    },
  });
  if (!res.ok) {
    throw new Error(`drift_artifact_error:${res.status}`);
  }
  return res.json() as Promise<DriftResult>;
}

export async function getDriftSummary(
  reportId: string,
  token: string,
  orgId: string,
): Promise<DriftSummary> {
  const res = await fetch(`${API_BASE}/api/drift/reports/${reportId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Organization-Id': orgId,
    },
  });
  if (!res.ok) {
    throw new Error(`drift_report_error:${res.status}`);
  }
  return res.json() as Promise<DriftSummary>;
}
