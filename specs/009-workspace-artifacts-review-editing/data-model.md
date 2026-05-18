# Data Model: Workspace Artifacts Review & Editing

**Phase 1 output** | **Branch**: `009-workspace-artifacts-review-editing` | **Date**: 2026-05-18

---

## Tabelas sem alteração de schema

### `workspace_artifacts` (existente — criada no Bloco 13)

Nenhuma coluna nova neste bloco. Todos os campos necessários para listagem, leitura e edição já existem.

| Coluna | Tipo | Imutável? | Notas |
|--------|------|-----------|-------|
| `id` | VARCHAR(120) PK | ✅ | UUID gerado no backend |
| `organization_id` | VARCHAR(120) NOT NULL | ✅ | Nunca alterado após criação |
| `project_id` | VARCHAR(120) NULL | ✅ | Nunca alterado após criação |
| `artifact_type` | VARCHAR(50) NOT NULL | ✅ | REQUIREMENT, RISK_ITEM, QA_ACTION |
| `title` | VARCHAR(500) NOT NULL | — | **Editável** |
| `description` | TEXT | — | **Editável** |
| `status` | VARCHAR(50) NOT NULL | — | **Editável** — válidos: DRAFT, REVIEWED, ACCEPTED, ARCHIVED |
| `ai_assisted` | BOOLEAN NOT NULL | ✅ | Sempre TRUE para artefatos de Check-up |
| `source_checkup_report_id` | VARCHAR(120) NOT NULL | ✅ | Rastreabilidade |
| `source_section` | VARCHAR(100) NOT NULL | ✅ | Rastreabilidade |
| `source_item_index` | INTEGER NOT NULL | ✅ | Rastreabilidade (0-based) |
| `details` | TEXT (JSON) | — | **Editável** — validado contra esquema mínimo por `artifact_type` |
| `created_by` | VARCHAR(120) NOT NULL | ✅ | Rastreabilidade |
| `created_at` | TIMESTAMP | ✅ | Rastreabilidade |
| `updated_at` | TIMESTAMP | — | Gerenciado pelo backend a cada atualização |

**Campos editáveis via PATCH**: `title`, `description`, `status`, `details`

**Campos imutáveis** (PATCH com qualquer desses campos → 400): `source_checkup_report_id`, `source_section`, `source_item_index`, `ai_assisted`, `created_by`, `created_at`

---

## Alteração de schema: novo índice

```sql
-- Suporte eficiente a filtros combinados por org + status + type na listagem
-- (o Bloco 13 criou índices por org e por source, mas não por status/type combinados)
CREATE INDEX IF NOT EXISTS idx_workspace_artifacts_org_status_type
  ON workspace_artifacts(organization_id, status, artifact_type);
```

---

## Valores válidos de `status`

| Valor | Descrição | Status inicial |
|-------|-----------|---------------|
| `DRAFT` | Rascunho gerado pela conversão — aguarda revisão | ✅ padrão |
| `REVIEWED` | Revisado pelo usuário, ainda não aprovado | — |
| `ACCEPTED` | Aprovado para uso no Workspace | — |
| `ARCHIVED` | Descartado — não ativo, não deletado | — |

Transições livres no MVP (sem restrições de direção). Restrições de fluxo são escopo pós-MVP.

---

## Esquemas mínimos de `details` por `artifact_type` (validação na criação e na edição)

**REQUIREMENT**
```json
{
  "severity": "HIGH | MEDIUM | LOW",
  "originalText": "string não vazia"
}
```
Campos obrigatórios: `severity` (enum HIGH/MEDIUM/LOW), `originalText` (string não vazia).

**RISK_ITEM**
```json
{
  "severity": "CRITICAL | HIGH | MEDIUM | LOW",
  "riskCategory": "QUALITY | UX_PRODUCT | RELEASE_READINESS",
  "originalText": "string não vazia"
}
```
Campos obrigatórios: `severity` (enum CRITICAL/HIGH/MEDIUM/LOW), `riskCategory` (enum), `originalText` (string não vazia).

**QA_ACTION**
```json
{
  "priority": "HIGH | MEDIUM | LOW",
  "action": "string não vazia",
  "rationale": "string não vazia",
  "originalText": "string não vazia"
}
```
Campos obrigatórios: `priority` (enum HIGH/MEDIUM/LOW), `action` (string não vazia), `rationale` (string não vazia), `originalText` (string não vazia).

Campos extras em `details` são permitidos (forward compatibility). A validação verifica apenas a presença e tipo dos campos obrigatórios.

---

## Novos métodos em `WorkspaceArtifactRepository`

Os métodos abaixo são adicionados ao repositório existente do Bloco 13.

### `findById(id, organizationId)` → `Optional<WorkspaceArtifactRow>`

```sql
SELECT * FROM workspace_artifacts
WHERE id = :id AND organization_id = :organizationId
```

Retorna `Optional.empty()` se não encontrado (→ 404) ou se `organization_id` não bate (→ 403, verificado no service).

### `findByOrganization(filters, limit)` → `List<WorkspaceArtifactRow>`

```sql
SELECT * FROM workspace_artifacts
WHERE organization_id = :organizationId
  [AND project_id = :projectId]                        -- opcional
  [AND source_checkup_report_id = :sourceReportId]     -- opcional
  [AND artifact_type = :artifactType]                  -- opcional
  [AND status = :status]                               -- opcional
ORDER BY created_at DESC
LIMIT 200
```

Sempre aplica `LIMIT 200`. Retorna lista vazia quando nenhum item bate nos filtros (não é erro).

Retorna também um campo adicional indicando se o total sem LIMIT excede 200 (`limitReached`), via `COUNT(*)` separado quando a lista retornar exatamente 200 itens.

### `updateEditableFields(id, organizationId, title, description, status, details)` → `boolean`

```sql
UPDATE workspace_artifacts
SET title       = COALESCE(:title, title),
    description = COALESCE(:description, description),
    status      = COALESCE(:status, status),
    details     = COALESCE(:details, details),
    updated_at  = NOW()
WHERE id = :id AND organization_id = :organizationId
```

**Assinatura**: parâmetros individuais em vez de um record `ArtifactPatch` — evita dependência do pacote `conversion/` em DTOs do pacote `workspace/`. O service `ArtifactReviewService` extrai os campos de `ArtifactPatch` (que vive em `workspace/`) e passa os valores individualmente ao repositório.

Retorna `true` se a linha foi atualizada, `false` se não encontrada (→ 404 no service).

`COALESCE` garante que campos omitidos no PATCH não sobrescrevam valores existentes.

**Pré-condição**: coluna `updated_at` deve existir na tabela `workspace_artifacts` (criada no Bloco 13). Verificar com `SELECT column_name FROM information_schema.columns WHERE table_name = 'workspace_artifacts' AND column_name = 'updated_at';` antes de implementar.

---

## Entidades de domínio novas

### `ArtifactPatch` (Java record — DTO de entrada do PATCH, vive em `workspace/`)

```java
record ArtifactPatch(
    String title,        // null = não alterar
    String description,  // null = não alterar
    String status,       // null = não alterar; validado contra enum ArtifactStatus
    String details       // null = não alterar; validado contra esquema do artifactType
)
```

**Nota de pacote**: `ArtifactPatch` pertence ao pacote `workspace/` e é usado apenas por `ArtifactReviewService` e `ArtifactReviewController`. O `WorkspaceArtifactRepository` (pacote `conversion/`) **não depende** de `ArtifactPatch` — recebe os campos como parâmetros individuais (`title`, `description`, `status`, `details`) para evitar acoplamento entre pacotes.

### `ArtifactListFilters` (Java record — parâmetros de query da listagem)

```java
record ArtifactListFilters(
    String organizationId,          // obrigatório (do header)
    String projectId,               // opcional
    String sourceCheckupReportId,   // opcional
    String artifactType,            // opcional — validado contra enum ArtifactType
    String status                   // opcional — validado contra enum ArtifactStatus
)
```

### `ArtifactListResponse` (Java record — resposta da listagem)

```java
record ArtifactListResponse(
    List<WorkspaceArtifactRow> artifacts,
    boolean limitReached   // true quando existem mais de 200 artefatos para os filtros
)
```

---

## Tabelas não alteradas neste bloco

- `audit_log` — reutilizada sem alteração de schema. Novo valor de `action`: `ARTIFACT_UPDATED`.
- `test_scenarios` — sem alteração.
- `test_cases` — sem alteração.
- `checkup_reports` — sem alteração.
- `ai_runs` — sem alteração.
