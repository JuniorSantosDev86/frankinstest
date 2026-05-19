# Data Model: Workspace Artifact Navigation & Traceability Polish

**Feature**: 011-artifact-navigation-traceability
**Date**: 2026-05-19

---

## Mudanças no Modelo de Dados

Este bloco adiciona **1 coluna nova** à tabela `workspace_artifacts`: `source_ai_run_id`. Esta mudança é necessária porque a rota `/checkup/[runId]` usa `aiRunId` (ID do `AiRun`), mas `sourceCheckupReportId` armazenado no artefato é o `id` do `CheckupReport` — IDs distintos. Sem `sourceAiRunId`, não é possível construir o link de navegação de volta ao relatório de forma correta.

Todas as demais mudanças são exclusivamente de apresentação (frontend) e de query filtering (backend já suportado).

---

## Entidades Existentes Relevantes

### WorkspaceArtifact

Tabela: `workspace_artifacts`

| Campo | Tipo | Comportamento neste bloco |
|---|---|---|
| `id` | `VARCHAR` PK | Sem alteração |
| `organization_id` | `VARCHAR` NOT NULL | Sem alteração — scoping de segurança |
| `project_id` | `VARCHAR` NULL | Sem alteração |
| `artifact_type` | `VARCHAR` NOT NULL | Sem alteração |
| `title` | `VARCHAR(500)` NOT NULL | Sem alteração |
| `description` | `TEXT` NULL | Sem alteração |
| `status` | `VARCHAR` NOT NULL | Sem alteração |
| `ai_assisted` | `BOOLEAN` NOT NULL | Exibido como badge "Gerado com IA" — leitura melhorada |
| `source_checkup_report_id` | `VARCHAR` NULL | Preservado — usado para filtrar artefatos por relatório; não é o `runId` da rota de Check-up |
| `source_ai_run_id` | `VARCHAR` NULL | **NOVO CAMPO**: `aiRunId` do `AiRun` associado ao relatório de origem; preenchido na conversão a partir de `CheckupReport.aiRunId`; usado para construir o link `/checkup/${sourceAiRunId}` |
| `source_section` | `VARCHAR` NULL | **Novo uso**: exibir diretamente como string; fallback "Seção de origem não informada" |
| `source_item_index` | `INTEGER` NULL | **Novo uso**: exibir como "Item de origem #N" (0-based → 1-based) |
| `details` | `JSONB` NULL | Sem alteração |
| `created_by` | `VARCHAR` NOT NULL | Sem alteração |
| `created_at` | `TIMESTAMPTZ` NOT NULL | Sem alteração |
| `updated_at` | `TIMESTAMPTZ` NOT NULL | Sem alteração |

**Imutabilidade**: `id`, `organization_id`, `project_id`, `artifact_type`, `ai_assisted`, `source_checkup_report_id`, `source_ai_run_id`, `source_section`, `source_item_index`, `created_by`, `created_at` — nunca editáveis via PATCH. `source_ai_run_id` é adicionado à lista de campos imutáveis.

### CheckupReport (AiRun / CheckupRun)

A página `/checkup/[runId]` já carrega `status.report` com `report.id`. Este bloco usa `report.id` como `sourceCheckupReportId` para filtrar artefatos. Nenhuma mudança no modelo de dados do relatório.

---

## Contratos de Interface

### ArtifactListFilters (Frontend — já existe, sem alteração)

```typescript
interface ArtifactListFilters {
  projectId?: string;
  sourceCheckupReportId?: string;  // usado para filtrar por relatório
  artifactType?: ArtifactType;
  status?: ArtifactStatus;
}
```

### WorkspaceArtifact (Frontend — sem alteração de tipo)

```typescript
interface WorkspaceArtifact {
  id: string;
  organizationId: string;
  projectId: string | null;
  artifactType: ArtifactType;
  title: string;
  description: string | null;
  status: ArtifactStatus;
  aiAssisted: boolean;
  sourceCheckupReportId: string | null;  // null para artefatos sem origem em Check-up; não é o runId da rota
  sourceAiRunId: string | null;          // NOVO: aiRunId do AiRun — usado em /checkup/${sourceAiRunId}
  sourceSection: string | null;          // string livre pt-BR; null → "Seção de origem não informada"
  sourceItemIndex: number | null;        // 0-based; null → não exibir; N → "Item de origem #N+1"
  details: Record<string, unknown> | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

**Nota**: `sourceAiRunId` é o campo novo adicionado neste bloco. Os tipos `string | null` para `sourceCheckupReportId`, `sourceSection` e `number | null` para `sourceItemIndex` são adições de precisão de tipo necessárias para o tratamento correto de null na UI.

---

## URL Query Params (Nova funcionalidade de navegação)

A página `/workspace/artifacts` passa a aceitar e ler o query param `sourceCheckupReportId` na URL:

```
/workspace/artifacts?sourceCheckupReportId=<report_id>
```

- Lido via `useSearchParams()` na montagem da página
- Pré-popula o estado de filtros
- Exibe banner de contexto do filtro ativo
- Removido via botão "Ver todos os artefatos" (limpa query param e estado)

---

## Regras de Apresentação (Novas — Frontend apenas)

| Campo | Valor no banco | Apresentação na UI |
|---|---|---|
| `sourceSection` | `"Segurança"` | `"Segurança"` |
| `sourceSection` | `null` ou `""` | `"Seção de origem não informada"` |
| `sourceItemIndex` | `0` | `"Item de origem #1"` |
| `sourceItemIndex` | `2` | `"Item de origem #3"` |
| `sourceItemIndex` | `null` | não exibir o campo |
| `sourceCheckupReportId` | não-nulo | link clicável "Ver relatório de origem" |
| `sourceCheckupReportId` | `null` ou `""` | sem link de origem |
| `aiAssisted` | `true` | badge "Gerado com IA" (já existe, preservado) |

---

## Migration Necessária

**1 migration SQL** necessária: adicionar coluna `source_ai_run_id VARCHAR(255) NULL` à tabela `workspace_artifacts`.

```sql
-- VNNN__add_source_ai_run_id_to_workspace_artifacts.sql
ALTER TABLE workspace_artifacts
  ADD COLUMN source_ai_run_id VARCHAR(255) NULL;
```

Artefatos existentes terão `source_ai_run_id = NULL` — compatível com os três estados da UI (link desabilitado "Relatório de origem não disponível" para artefatos criados antes desta migration, se `sourceCheckupReportId` não-nulo). Novos artefatos convertidos após a migration terão o campo preenchido automaticamente.

A coluna não precisa de índice — é lida por artefato individual no painel de detalhes, não usada em filtros de listagem.
