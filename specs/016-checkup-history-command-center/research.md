# Research: Check-up History & Project Command Center

**Feature**: 016-checkup-history-command-center
**Date**: 2026-05-19
**Branch**: 012-checkup-history-command-center

---

## 1. Modelo de Dados Existente

### AiRun (entidade raiz de uma execução)

- **Arquivo**: `services/api/src/main/java/com/frankintest/api/airuns/AiRunModels.java`
- **Tabela**: `ai_runs`
- **Campos relevantes para o histórico**:
  - `id` — UUID (String)
  - `organizationId` — String
  - `feature` — enum `AiRunFeature` (valor relevante: `checkup`)
  - `status` — enum `AiRunStatus`: `estimated | reserved | running | completed | failed | cancelled`
  - `estimatedCredits` — long
  - `consumedCredits` — long
  - `createdAt` — Instant
  - `startedAt` — Instant (nullable)
  - `completedAt` — Instant (nullable)
  - `outputArtifactIds` — List<String> (IDs dos CheckupReports gerados)
- **Sem campo `targetUrl`, `depth` ou `targetType`** — esses atributos vivem no `CheckupReport`.

### CheckupReport (relatório gerado pelo check-up)

- **Arquivo**: `services/api/src/main/java/com/frankintest/api/checkup/CheckupModels.java`
- **Tabela**: `checkup_reports`
- **Campos relevantes**:
  - `id` — UUID (String)
  - `aiRunId` — String (FK para `ai_runs.id`)
  - `organizationId` — String
  - `targetType` — enum `TargetType`
  - `targetValue` — String
  - `depth` — enum `CheckupDepth`: `QUICK | STANDARD | DEEP`
  - `createdAt` — Instant
- **Index existente**: `organization_id`, `ai_run_id`

### WorkspaceArtifact (artefatos convertidos do relatório)

- **Arquivo**: `services/api/src/main/java/com/frankintest/api/conversion/ConversionModels.java`
- **Tabela**: `workspace_artifacts`
- **Campos de ligação com o run**:
  - `sourceAiRunId` — VARCHAR(255) — liga ao `ai_runs.id` ✓
  - `sourceCheckupReportId` — VARCHAR(120) — liga ao `checkup_reports.id`
- **Método de contagem existente**: `WorkspaceArtifactRepository.countByOrganization(...)` — filtra por `sourceCheckupReportId`; **não** filtra por `sourceAiRunId` ainda.

---

## 2. Backend Existente (Controllers / Services / Repositories)

### CheckupController

- **Arquivo**: `services/api/src/main/java/com/frankintest/api/checkup/CheckupController.java`
- **Base mapping**: `/api/checkup`
- **Rotas existentes** (NÃO alterar):
  - `POST /api/checkup/estimate`
  - `POST /api/checkup/run`
  - `GET /api/checkup/runs/{aiRunId}`

### AiRunRepository

- **Arquivo**: `services/api/src/main/java/com/frankintest/api/airuns/AiRunRepository.java`
- **Métodos existentes**: `insert`, `findById`, `updateStatus`, `updateToRunning`, `updateReservedCredits`
- **Não possui**: `findByOrganizationAndFeature`, `countByOrganizationAndFeature`

### CheckupRepository

- **Arquivo**: `services/api/src/main/java/com/frankintest/api/checkup/CheckupRepository.java`
- **Métodos existentes**: `save`, `findByAiRunId`, `findById`
- **Não possui**: `findByOrganization` (lista paginada)

### WorkspaceArtifactRepository

- **Arquivo**: `services/api/src/main/java/com/frankintest/api/conversion/WorkspaceArtifactRepository.java`
- **Método relevante**: `countByOrganization(organizationId, projectId, sourceCheckupReportId, artifactType, status)` — pode ser reutilizado ou estendido.
- **Não possui**: `countByAiRunId(organizationId, aiRunId)` — novo método necessário para `artifactCount` por run.

---

## 3. Frontend Existente

### Rotas

- `/checkup` — página de criação de check-up (`apps/web/src/app/checkup/page.tsx`)
- `/checkup/[runId]` — página de resultado (`apps/web/src/app/checkup/[runId]/page.tsx`)
- **Não existe**: rota de histórico/lista

### API Client

- **Arquivo**: `apps/web/src/lib/checkup/checkupApi.ts`
- **Funções existentes**: `estimateCheckup`, `runCheckup`, `getCheckupRun(aiRunId)`
- **Não possui**: `listCheckupRuns`, `getCheckupRunsSummary`

### Tipos

- **Arquivo**: `apps/web/src/lib/checkup/checkupTypes.ts`
- Tipos existentes para request/response de estimate, run e run status.

### Navegação

- **Arquivo**: `apps/web/src/app/workspaceNavigation.ts`
- Check-up não está no menu lateral. Novo item "Histórico de Check-ups" precisa ser adicionado.
- **Dashboard**: `apps/web/src/app/components/WorkspaceDashboard.tsx` — usa `workspaceNavigationTargets`.

---

## 4. Decisões de Design

### D-001: Mapeamento AiRun → CheckupReport para a listagem

- **Decisão**: O endpoint `GET /api/checkup/runs` lista `ai_runs` filtrados por `organizationId` e `feature = 'checkup'`, e faz JOIN (ou consulta secundária) com `checkup_reports` para buscar `targetType`, `targetValue` e `depth`.
- **Rationale**: `AiRun` é o registro de execução e dono de `status`, `estimatedCredits`, `consumedCredits`, `createdAt`. `CheckupReport` é o dono de `targetType`, `targetValue`, `depth`. Um JOIN leve ou subquery é aceitável para o volume MVP.
- **Alternativa rejeitada**: Duplicar `targetType`/`depth` em `ai_runs` — viola DRY e a separação existente de responsabilidades.

### D-002: `artifactCount` — COUNT via query, sem desnormalização

- **Decisão**: `artifactCount` é calculado via `COUNT(wa.id) FROM workspace_artifacts wa WHERE wa.source_ai_run_id = ar.id AND wa.organization_id = ?`. Retorna `0` quando não há artefatos.
- **Rationale**: Volume por organização é pequeno no MVP. Evita lógica de sincronização de campo desnormalizado.
- **Alternativa rejeitada**: Campo `artifact_count` na tabela `ai_runs` — cria acoplamento entre módulos de conversão e ai_runs.

### D-003: `GET /api/checkup/runs/summary` — agregados via query única

- **Decisão**: Uma única query SQL com `COUNT`, `SUM` e `FILTER`/`CASE` retorna todos os totais do Command Center numa chamada ao banco.
- **Rationale**: Evita N+1. O frontend pode chamar `GET /api/checkup/runs` e `GET /api/checkup/runs/summary` em paralelo.

### D-004: Paginação no `GET /api/checkup/runs`

- **Decisão**: Paginação por offset/limit com parâmetros `page` (default 0) e `size` (default 20, máximo 50). Resposta inclui `totalElements` e `totalPages` para o frontend renderizar controles simples.
- **Rationale**: Consistente com padrão Spring Page. Simples de implementar.

### D-005: Status de mapeamento AiRun → label PT-BR na UI

| AiRunStatus | Label PT-BR |
|---|---|
| `estimated` | Em andamento |
| `reserved` | Em andamento |
| `running` | Em andamento |
| `completed` | Concluído |
| `failed` | Falhou |
| `cancelled` | Cancelado |

- **Rationale**: O usuário não precisa saber dos estados internos de crédito. "Em andamento" é suficiente para `estimated/reserved/running`.

### D-006: Página de histórico — rota `/checkup/history`

- **Decisão**: Nova rota `/checkup/history` no Next.js (`apps/web/src/app/checkup/history/page.tsx`). Layout: Command Center no topo (painel de resumo) + lista de histórico abaixo com botão "Atualizar".
- **Rationale**: Não altera as rotas existentes `/checkup` e `/checkup/[runId]`. Escopo controlado.

### D-007: Link de navegação "Histórico de Check-ups"

- **Decisão**: Adicionar entrada ao array `workspaceNavigationTargets` em `workspaceNavigation.ts` apontando para `/checkup/history`. Ícone: History ou Clock.
- **Rationale**: Segue o padrão existente de navegação do Workspace.

---

## 5. Contrato dos Novos Endpoints

### `GET /api/checkup/runs`

**Headers**: `Authorization: Bearer {jwt}`, `X-Organization-Id: {orgId}`
**Query params**: `page` (default 0), `size` (default 20, max 50)

**Response 200**:
```json
{
  "content": [
    {
      "aiRunId": "uuid",
      "reportId": "uuid | null",
      "status": "completed | running | failed | cancelled",
      "targetType": "URL | FEATURE_DESCRIPTION | ...",
      "targetValue": "string",
      "depth": "QUICK | STANDARD | DEEP",
      "estimatedCredits": 10,
      "consumedCredits": 8,
      "artifactCount": 3,
      "createdAt": "ISO-8601",
      "completedAt": "ISO-8601 | null"
    }
  ],
  "totalElements": 42,
  "totalPages": 3,
  "page": 0,
  "size": 20
}
```

**Erros**: 401 (sem JWT), 403 (X-Organization-Id inválido/ausente)

---

### `GET /api/checkup/runs/summary`

**Headers**: `Authorization: Bearer {jwt}`, `X-Organization-Id: {orgId}`

**Response 200**:
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

**Erros**: 401, 403

---

## 6. Arquivos Novos a Criar

### Backend
- `AiRunRepository.java` — novos métodos: `findByOrganizationAndFeature(orgId, feature, pageable)`, `countSummaryByOrganizationAndFeature(orgId, feature)`
- `WorkspaceArtifactRepository.java` — novo método: `countBySourceAiRunId(orgId, aiRunId)`
- `CheckupService.java` — novos métodos: `listRuns(orgId, page, size)`, `getRunsSummary(orgId)`
- `CheckupController.java` — novas rotas: `GET /api/checkup/runs`, `GET /api/checkup/runs/summary`
- `CheckupModels.java` — novos records: `CheckupRunListItem`, `CheckupRunsPage`, `CheckupRunsSummary`

### Frontend
- `apps/web/src/app/checkup/history/page.tsx` — página de histórico + Command Center
- `apps/web/src/app/checkup/history/components/CommandCenterPanel.tsx`
- `apps/web/src/app/checkup/history/components/CheckupHistoryList.tsx`
- `apps/web/src/app/checkup/history/components/CheckupHistoryItem.tsx`
- `apps/web/src/lib/checkup/checkupApi.ts` — novas funções: `listCheckupRuns`, `getCheckupRunsSummary`
- `apps/web/src/lib/checkup/checkupTypes.ts` — novos tipos: `CheckupRunListItem`, `CheckupRunsPage`, `CheckupRunsSummary`
- `apps/web/src/app/workspaceNavigation.ts` — novo item "Histórico de Check-ups"

### Testes Backend
- `CheckupControllerTest.java` — testes para `GET /api/checkup/runs` e `GET /api/checkup/runs/summary`

---

## 7. Arquivos Existentes a Modificar (com cuidado)

| Arquivo | Modificação |
|---|---|
| `AiRunRepository.java` | Adicionar `findByOrganizationAndFeature` + `countSummaryByOrganizationAndFeature` |
| `CheckupRepository.java` | Nenhuma alteração necessária (relatório acessado via JOIN no novo service) |
| `WorkspaceArtifactRepository.java` | Adicionar `countBySourceAiRunId(orgId, aiRunId)` |
| `CheckupService.java` | Adicionar `listRuns`, `getRunsSummary` |
| `CheckupController.java` | Adicionar dois novos endpoints (não alterar os três existentes) |
| `CheckupModels.java` | Adicionar novos records de resposta |
| `checkupApi.ts` | Adicionar `listCheckupRuns`, `getCheckupRunsSummary` |
| `checkupTypes.ts` | Adicionar novos tipos |
| `workspaceNavigation.ts` | Adicionar entrada de navegação |
