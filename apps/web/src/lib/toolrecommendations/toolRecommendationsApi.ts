import type { ToolRecommendationResult, ToolRecommendationSaveResponse } from './toolRecommendationsTypes'
import { getDevToken } from '@/lib/auth/getDevToken'
import { getMockSession } from '@/lib/auth/mockSession'

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? ''
const BASE = `${API_BASE}/api/tool-recommendations`

function buildAuthHeaders(): Record<string, string> {
  const token = getDevToken()
  const orgId = getMockSession().activeOrganization.id
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'X-Organization-Id': orgId,
  }
}

export async function generateRecommendations(reportId: string): Promise<ToolRecommendationResult> {
  const res = await fetch(`${BASE}/${encodeURIComponent(reportId)}`, {
    method: 'POST',
    headers: buildAuthHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new ApiError(res.status, err.message ?? 'Erro ao gerar recomendações.')
  }
  return res.json()
}

export async function saveRecommendationAsArtifact(reportId: string): Promise<ToolRecommendationSaveResponse> {
  const res = await fetch(`${BASE}/${encodeURIComponent(reportId)}/save`, {
    method: 'POST',
    headers: buildAuthHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new ApiError(res.status, err.message ?? 'Erro ao salvar artefato.')
  }
  return res.json()
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
