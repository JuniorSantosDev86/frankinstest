import type {
  WorkspaceArtifact,
  ArtifactListResponse,
  ArtifactListFilters,
  ArtifactPatch,
} from './artifactTypes';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

function headers(token: string, orgId: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    'X-Organization-Id': orgId,
  };
}

function ptBrError(status: number, body?: { message?: string }): string {
  if (body?.message) return body.message;
  switch (status) {
    case 401:
      return 'Sessão expirada. Faça login novamente.';
    case 403:
      return 'Você não tem permissão para acessar este recurso.';
    case 404:
      return 'Artefato não encontrado.';
    case 400:
      return 'Dados inválidos. Verifique os campos e tente novamente.';
    default:
      return 'Erro ao processar a operação. Tente novamente.';
  }
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string };
    return ptBrError(res.status, body);
  } catch {
    return ptBrError(res.status);
  }
}

export async function listArtifacts(
  orgId: string,
  token: string,
  filters: Partial<ArtifactListFilters> = {}
): Promise<ArtifactListResponse> {
  const params = new URLSearchParams();
  if (filters.projectId) params.set('projectId', filters.projectId);
  if (filters.sourceCheckupReportId)
    params.set('sourceCheckupReportId', filters.sourceCheckupReportId);
  if (filters.artifactType) params.set('artifactType', filters.artifactType);
  if (filters.status) params.set('status', filters.status);

  const url = `${API_BASE}/api/workspace/artifacts${params.toString() ? '?' + params.toString() : ''}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: headers(token, orgId),
  });

  if (!res.ok) {
    const msg = await parseError(res);
    throw new Error(msg);
  }

  return res.json() as Promise<ArtifactListResponse>;
}

export async function getArtifact(
  id: string,
  orgId: string,
  token: string
): Promise<WorkspaceArtifact> {
  const res = await fetch(`${API_BASE}/api/workspace/artifacts/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: headers(token, orgId),
  });

  if (!res.ok) {
    const msg = await parseError(res);
    throw new Error(msg);
  }

  return res.json() as Promise<WorkspaceArtifact>;
}

export async function updateArtifact(
  id: string,
  orgId: string,
  token: string,
  patch: ArtifactPatch
): Promise<WorkspaceArtifact> {
  // Only send editable fields — never send traceability or identity fields
  const safePatch: ArtifactPatch = {};
  if (patch.title !== undefined) safePatch.title = patch.title;
  if (patch.description !== undefined) safePatch.description = patch.description;
  if (patch.status !== undefined) safePatch.status = patch.status;
  if (patch.details !== undefined) safePatch.details = patch.details;

  const res = await fetch(`${API_BASE}/api/workspace/artifacts/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: headers(token, orgId),
    body: JSON.stringify(safePatch),
  });

  if (!res.ok) {
    const msg = await parseError(res);
    throw new Error(msg);
  }

  return res.json() as Promise<WorkspaceArtifact>;
}
