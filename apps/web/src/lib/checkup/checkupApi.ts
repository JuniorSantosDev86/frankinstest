import type {
  CheckupEstimateResponse,
  CheckupRequest,
  CheckupRunResponse,
  CheckupRunStatusResponse,
} from './checkupTypes'
import { getDevToken } from '@/lib/auth/getDevToken'
import { getMockSession } from '@/lib/auth/mockSession'

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? ''
const BASE = `${API_BASE}/api/checkup`

function buildAuthHeaders(): Record<string, string> {
  const token = getDevToken()
  const orgId = getMockSession().activeOrganization.id
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'X-Organization-Id': orgId,
  }
}

export async function estimateCheckup(
  request: CheckupRequest
): Promise<CheckupEstimateResponse> {
  const res = await fetch(`${BASE}/estimate`, {
    method: 'POST',
    headers: buildAuthHeaders(),
    body: JSON.stringify(request),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new ApiError(res.status, err.message ?? 'Erro ao estimar créditos.', err.field)
  }
  return res.json()
}

export async function runCheckup(
  request: CheckupRequest
): Promise<CheckupRunResponse> {
  const res = await fetch(`${BASE}/run`, {
    method: 'POST',
    headers: buildAuthHeaders(),
    body: JSON.stringify(request),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new ApiError(res.status, err.message ?? 'Erro ao executar Check-up.', err.field)
  }
  return res.json()
}

export async function getCheckupRun(
  aiRunId: string
): Promise<CheckupRunStatusResponse> {
  const res = await fetch(`${BASE}/runs/${encodeURIComponent(aiRunId)}`, {
    headers: buildAuthHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new ApiError(res.status, err.message ?? 'Erro ao consultar o Check-up.')
  }
  return res.json()
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly field?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }

  get isAuthorizationRequired() {
    return this.status === 422
  }

  get isInsufficientCredits() {
    return this.status === 402
  }

  get isUnauthorized() {
    return this.status === 401
  }
}
