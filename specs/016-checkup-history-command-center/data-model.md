# Data Model: Check-up History & Project Command Center

**Feature**: 016-checkup-history-command-center
**Date**: 2026-05-19

---

## Entidades Existentes (sem alteração de schema)

### `ai_runs` (tabela existente)

Nenhuma coluna nova. A query de listagem usa as colunas existentes:

| Coluna | Tipo | Uso neste bloco |
|--------|------|----------------|
| `id` | VARCHAR(120) PK | `aiRunId` na resposta |
| `organization_id` | VARCHAR(120) | Filtro de escopo obrigatório |
| `feature` | VARCHAR(60) | Filtro: `feature = 'checkup'` |
| `status` | VARCHAR(30) | Exibido como label PT-BR |
| `estimated_credits` | BIGINT | Exibido na lista |
| `consumed_credits` | BIGINT | Exibido na lista e somado no summary |
| `created_at` | TIMESTAMPTZ | Ordenação decrescente |
| `completed_at` | TIMESTAMPTZ | Exibido na lista (nullable) |
| `output_artifact_ids` | TEXT | `reportId` — primeiro elemento quando `feature='checkup'` |

### `checkup_reports` (tabela existente)

Nenhuma coluna nova. A query faz JOIN com `ai_runs` via `ai_run_id`:

| Coluna | Tipo | Uso neste bloco |
|--------|------|----------------|
| `id` | VARCHAR(120) PK | `reportId` na resposta (confirma via JOIN) |
| `ai_run_id` | VARCHAR(120) FK | JOIN com `ai_runs.id` |
| `organization_id` | VARCHAR(120) | Confirma escopo no JOIN |
| `target_type` | VARCHAR(60) | Exibido na lista |
| `target_value` | TEXT | Exibido na lista (truncado na UI) |
| `depth` | VARCHAR(30) | Exibido na lista |

### `workspace_artifacts` (tabela existente)

Nenhuma coluna nova. A query de contagem usa coluna existente:

| Coluna | Tipo | Uso neste bloco |
|--------|------|----------------|
| `source_ai_run_id` | VARCHAR(255) | `COUNT` por `ai_run_id` para `artifactCount` |
| `organization_id` | VARCHAR(120) | Filtro de escopo no COUNT |

---

## Novos Records Java (sem novas tabelas)

### `CheckupModels.CheckupRunListItem`

Record de resposta por item da lista. Mapeado a partir do resultado do JOIN.

| Campo | Tipo Java | Fonte |
|-------|-----------|-------|
| `aiRunId` | String | `ai_runs.id` |
| `reportId` | String (nullable) | `checkup_reports.id` via JOIN |
| `status` | String | Mapeado de `ai_runs.status` (ver tabela de labels) |
| `targetType` | String (nullable) | `checkup_reports.target_type` |
| `targetValue` | String (nullable) | `checkup_reports.target_value` |
| `depth` | String (nullable) | `checkup_reports.depth` |
| `estimatedCredits` | long | `ai_runs.estimated_credits` |
| `consumedCredits` | long | `ai_runs.consumed_credits` |
| `artifactCount` | long | `COUNT(workspace_artifacts)` por `source_ai_run_id` |
| `createdAt` | Instant | `ai_runs.created_at` |
| `completedAt` | Instant (nullable) | `ai_runs.completed_at` |

### `CheckupModels.CheckupRunsPage`

Record envelope de paginação.

| Campo | Tipo Java | Descrição |
|-------|-----------|-----------|
| `content` | List<CheckupRunListItem> | Itens da página atual |
| `totalElements` | long | Total de runs da organização com `feature='checkup'` |
| `totalPages` | int | `ceil(totalElements / size)` |
| `page` | int | Página atual (zero-based) |
| `size` | int | Tamanho da página |

### `CheckupModels.CheckupRunsSummary`

Record de resposta do endpoint de resumo.

| Campo | Tipo Java | Query |
|-------|-----------|-------|
| `totalRuns` | long | `COUNT(*)` onde `organization_id = ? AND feature = 'checkup'` |
| `completedRuns` | long | `COUNT(*) FILTER (WHERE status = 'completed')` |
| `runningRuns` | long | `COUNT(*) FILTER (WHERE status IN ('estimated','reserved','running'))` |
| `failedRuns` | long | `COUNT(*) FILTER (WHERE status IN ('failed','cancelled'))` |
| `totalConsumedCredits` | long | `SUM(consumed_credits)` |
| `totalArtifacts` | long | Subquery `COUNT(wa.id) FROM workspace_artifacts wa WHERE wa.organization_id = ? AND wa.source_ai_run_id IN (SELECT id FROM ai_runs WHERE organization_id = ? AND feature = 'checkup')` |

---

## Mapeamento de Status

| `AiRunStatus` (Java enum) | Label PT-BR na UI |
|---|---|
| `estimated` | Em andamento |
| `reserved` | Em andamento |
| `running` | Em andamento |
| `completed` | Concluído |
| `failed` | Falhou |
| `cancelled` | Cancelado |

---

## Novos Métodos de Repository

### `AiRunRepository` — novos métodos

```java
// Lista paginada de ai_runs de uma org por feature
List<AiRun> findByOrganizationAndFeature(String organizationId, String feature, int offset, int limit);

// Conta total de ai_runs de uma org por feature (para paginação)
long countByOrganizationAndFeature(String organizationId, String feature);
```

### `WorkspaceArtifactRepository` — novo método

```java
// Conta artefatos de um run específico, respeitando org
long countBySourceAiRunId(String organizationId, String sourceAiRunId);
```

---

## Query de Listagem (lógica)

```sql
-- Lista de runs (página)
SELECT
  ar.id              AS ai_run_id,
  cr.id              AS report_id,
  ar.status,
  cr.target_type,
  cr.target_value,
  cr.depth,
  ar.estimated_credits,
  ar.consumed_credits,
  ar.created_at,
  ar.completed_at,
  COUNT(wa.id)       AS artifact_count
FROM ai_runs ar
LEFT JOIN checkup_reports cr ON cr.ai_run_id = ar.id AND cr.organization_id = ar.organization_id
LEFT JOIN workspace_artifacts wa ON wa.source_ai_run_id = ar.id AND wa.organization_id = ar.organization_id
WHERE ar.organization_id = :orgId
  AND ar.feature = 'checkup'
GROUP BY ar.id, cr.id, cr.target_type, cr.target_value, cr.depth
ORDER BY ar.created_at DESC
LIMIT :size OFFSET :offset;
```

> **Nota**: A query pode ser implementada via `JdbcTemplate` com SQL nativo, consistente com o padrão existente no projeto (sem JPA/Hibernate).

---

## Sem Migrações de Schema

Este bloco **não requer** novas tabelas nem novas colunas. Todos os dados necessários já existem nas tabelas `ai_runs`, `checkup_reports` e `workspace_artifacts`. A coluna `source_ai_run_id` em `workspace_artifacts` foi adicionada no Bloco 15 (conforme comentário no código).

Se `source_ai_run_id` não existir na tabela em ambiente de desenvolvimento, verificar se a migration do Bloco 15 foi executada antes de rodar este bloco.
