# API Contracts: Check-up History & Project Command Center

**Feature**: 016-checkup-history-command-center
**Date**: 2026-05-19

Todos os endpoints são protegidos por JWT (`Authorization: Bearer {token}`) e `X-Organization-Id`.
Nenhum endpoint chama o provedor de IA.

---

## GET /api/checkup/runs

Lista paginada de Check-ups da organização autenticada, ordenados por `createdAt` decrescente.

### Request

```
GET /api/checkup/runs?page=0&size=20
Authorization: Bearer {jwt}
X-Organization-Id: {orgId}
```

| Parâmetro | Tipo | Padrão | Máximo | Descrição |
|-----------|------|--------|--------|-----------|
| `page` | int | 0 | — | Página zero-based |
| `size` | int | 20 | 50 | Itens por página |

### Response 200

```json
{
  "content": [
    {
      "aiRunId": "550e8400-e29b-41d4-a716-446655440000",
      "reportId": "660e8400-e29b-41d4-a716-446655440000",
      "status": "completed",
      "targetType": "URL",
      "targetValue": "https://exemplo.com",
      "depth": "STANDARD",
      "estimatedCredits": 10,
      "consumedCredits": 8,
      "artifactCount": 3,
      "createdAt": "2026-05-19T14:00:00Z",
      "completedAt": "2026-05-19T14:01:32Z"
    }
  ],
  "totalElements": 42,
  "totalPages": 3,
  "page": 0,
  "size": 20
}
```

**Campos opcionais/nullable**:
- `reportId` — null quando `status != completed`
- `targetType`, `targetValue`, `depth` — null quando o CheckupReport ainda não foi criado (run muito recente)
- `completedAt` — null quando run não está concluído

**Valores de `status`** (mapeados de `AiRunStatus`):

| Valor na resposta | AiRunStatus de origem |
|---|---|
| `running` | `estimated`, `reserved`, `running` |
| `completed` | `completed` |
| `failed` | `failed`, `cancelled` |

### Responses de Erro

| Código | Condição |
|--------|----------|
| 401 | Token JWT ausente ou inválido |
| 403 | Header `X-Organization-Id` ausente ou inválido |

---

## GET /api/checkup/runs/summary

Totais agregados para o Command Center da organização autenticada.

### Request

```
GET /api/checkup/runs/summary
Authorization: Bearer {jwt}
X-Organization-Id: {orgId}
```

Sem parâmetros de query.

### Response 200

```json
{
  "totalRuns": 42,
  "completedRuns": 35,
  "runningRuns": 2,
  "failedRuns": 5,
  "totalConsumedCredits": 280,
  "totalArtifacts": 91
}
```

**Definições**:
- `totalRuns` — todos os `ai_runs` com `feature='checkup'` da org
- `completedRuns` — `status = 'completed'`
- `runningRuns` — `status IN ('estimated', 'reserved', 'running')`
- `failedRuns` — `status IN ('failed', 'cancelled')`
- `totalConsumedCredits` — `SUM(consumed_credits)` de todos os runs da org
- `totalArtifacts` — `COUNT` em `workspace_artifacts` com `source_ai_run_id` de runs da org

**Valores zerados**: quando a organização não tem nenhum Check-up, todos os campos retornam `0`.

### Responses de Erro

| Código | Condição |
|--------|----------|
| 401 | Token JWT ausente ou inválido |
| 403 | Header `X-Organization-Id` ausente ou inválido |

---

## Endpoint Existente — Sem Alteração

```
GET /api/checkup/runs/{aiRunId}
```

Este endpoint **não é alterado** por este bloco. Continua funcionando exatamente como antes.

---

## Tipos Frontend (TypeScript)

```typescript
// Item individual da lista
export interface CheckupRunListItem {
  aiRunId: string;
  reportId: string | null;
  status: 'running' | 'completed' | 'failed';
  targetType: string | null;
  targetValue: string | null;
  depth: 'QUICK' | 'STANDARD' | 'DEEP' | null;
  estimatedCredits: number;
  consumedCredits: number;
  artifactCount: number;
  createdAt: string;       // ISO-8601
  completedAt: string | null;
}

// Envelope de paginação
export interface CheckupRunsPage {
  content: CheckupRunListItem[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

// Resumo do Command Center
export interface CheckupRunsSummary {
  totalRuns: number;
  completedRuns: number;
  runningRuns: number;
  failedRuns: number;
  totalConsumedCredits: number;
  totalArtifacts: number;
}
```

---

## Funções de API Client (checkupApi.ts)

```typescript
export async function listCheckupRuns(
  orgId: string,
  page = 0,
  size = 20
): Promise<CheckupRunsPage>

export async function getCheckupRunsSummary(
  orgId: string
): Promise<CheckupRunsSummary>
```

Ambas devem incluir `X-Organization-Id` no header e o JWT via cookie/header de autenticação, seguindo o padrão existente em `checkupApi.ts`.
