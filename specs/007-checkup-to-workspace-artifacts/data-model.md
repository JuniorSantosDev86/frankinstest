# Data Model: Check-up to Workspace Artifacts

**Phase 1 output** | **Branch**: `007-checkup-to-workspace-artifacts` | **Date**: 2026-05-18

---

## Existing Tables (sem alteração)

### `checkup_reports` (existente)

Sem alterações de schema. Utilizada somente para leitura via `findById`.

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | VARCHAR(120) PK | ID do relatório de origem |
| `ai_run_id` | VARCHAR(120) | Usado para resolver `project_id` via `ai_runs` |
| `organization_id` | VARCHAR(120) | Validação de acesso |
| `status` | VARCHAR(20) | DRAFT / REVIEWED — não usado para guard de conversão |
| `quality_risks` | TEXT (JSON) | Lista de `FindingItem` |
| `missing_or_unclear_requirements` | TEXT (JSON) | Lista de `FindingItem` |
| `suggested_test_scenarios` | TEXT (JSON) | Lista de `ScenarioItem` |
| `suggested_test_cases` | TEXT (JSON) | Lista de `TestCaseItem` |
| `ux_product_risks` | TEXT (JSON) | Lista de `FindingItem` |
| `release_readiness_notes` | TEXT (JSON) | Lista de `FindingItem` |

**Guard de elegibilidade**: verificar `ai_runs.status = 'completed'` via `ai_run_id`.

---

## Tabelas Modificadas (ADD COLUMN)

### `test_scenarios` — novas colunas de rastreabilidade

```sql
ALTER TABLE test_scenarios
  ADD COLUMN IF NOT EXISTS source_checkup_report_id VARCHAR(120),
  ADD COLUMN IF NOT EXISTS source_section           VARCHAR(100),
  ADD COLUMN IF NOT EXISTS source_item_index        INTEGER;

CREATE INDEX IF NOT EXISTS idx_test_scenarios_source_checkup
  ON test_scenarios(source_checkup_report_id, source_section, source_item_index);
```

| Coluna nova | Tipo | Descrição |
|-------------|------|-----------|
| `source_checkup_report_id` | VARCHAR(120) | ID do relatório de Check-up de origem |
| `source_section` | VARCHAR(100) | Nome da seção: `suggested_test_scenarios` |
| `source_item_index` | INTEGER | Posição do item na lista (0-based) |

### `test_cases` — novas colunas de rastreabilidade

```sql
ALTER TABLE test_cases
  ADD COLUMN IF NOT EXISTS source_checkup_report_id VARCHAR(120),
  ADD COLUMN IF NOT EXISTS source_section           VARCHAR(100),
  ADD COLUMN IF NOT EXISTS source_item_index        INTEGER;

CREATE INDEX IF NOT EXISTS idx_test_cases_source_checkup
  ON test_cases(source_checkup_report_id, source_section, source_item_index);
```

---

## Nova Tabela

### `workspace_artifacts`

Armazena artefatos do Workspace gerados por conversão de Check-up que não mapeiam para tabelas existentes: REQUIREMENT, RISK_ITEM, QA_ACTION.

```sql
CREATE TABLE IF NOT EXISTS workspace_artifacts (
    id                        VARCHAR(120) PRIMARY KEY,
    organization_id           VARCHAR(120) NOT NULL,
    project_id                VARCHAR(120),
    artifact_type             VARCHAR(50)  NOT NULL,
    title                     VARCHAR(500) NOT NULL,
    description               TEXT,
    status                    VARCHAR(50)  NOT NULL DEFAULT 'DRAFT',
    ai_assisted               BOOLEAN      NOT NULL DEFAULT TRUE,
    source_checkup_report_id  VARCHAR(120) NOT NULL,
    source_section            VARCHAR(100) NOT NULL,
    source_item_index         INTEGER      NOT NULL,
    details                   TEXT,
    created_by                VARCHAR(120) NOT NULL,
    created_at                TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at                TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workspace_artifacts_org
  ON workspace_artifacts(organization_id);

CREATE INDEX IF NOT EXISTS idx_workspace_artifacts_source
  ON workspace_artifacts(source_checkup_report_id, source_section, source_item_index);

CREATE INDEX IF NOT EXISTS idx_workspace_artifacts_type
  ON workspace_artifacts(artifact_type);
```

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | VARCHAR(120) PK | UUID gerado no backend |
| `organization_id` | VARCHAR(120) NOT NULL | Organização proprietária |
| `project_id` | VARCHAR(120) NULL | Projeto de destino resolvido via `ai_runs.project_id`; NULL = escopo de org |
| `artifact_type` | VARCHAR(50) NOT NULL | REQUIREMENT, RISK_ITEM, QA_ACTION |
| `title` | VARCHAR(500) NOT NULL | Título do artefato |
| `description` | TEXT | Descrição/corpo do artefato |
| `status` | VARCHAR(50) NOT NULL | DRAFT (fixo neste bloco) |
| `ai_assisted` | BOOLEAN NOT NULL | TRUE (fixo neste bloco) |
| `source_checkup_report_id` | VARCHAR(120) NOT NULL | Rastreabilidade: ID do relatório |
| `source_section` | VARCHAR(100) NOT NULL | Rastreabilidade: seção de origem |
| `source_item_index` | INTEGER NOT NULL | Rastreabilidade: índice do item (0-based) |
| `details` | TEXT (JSON) | Campos específicos por tipo (ver abaixo) |
| `created_by` | VARCHAR(120) NOT NULL | ID do usuário que confirmou a conversão |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

#### Estrutura do campo `details` por `artifact_type`

**REQUIREMENT**
```json
{
  "severity": "HIGH | MEDIUM | LOW",
  "originalText": "texto original do item no relatório"
}
```

**RISK_ITEM**
```json
{
  "severity": "CRITICAL | HIGH | MEDIUM | LOW",
  "riskCategory": "QUALITY | UX_PRODUCT | RELEASE_READINESS",
  "originalText": "texto original do item no relatório"
}
```

**QA_ACTION**
```json
{
  "priority": "HIGH | MEDIUM | LOW",
  "action": "ação recomendada",
  "rationale": "racional da ação",
  "originalText": "texto original do item no relatório"
}
```

---

## Mapeamento Completo: Seção → Tabela de destino

| Seção do relatório | `source_section` value | Tabela de destino | `artifact_type` |
|---|---|---|---|
| `missingOrUnclearRequirements` | `missing_or_unclear_requirements` | `workspace_artifacts` | `REQUIREMENT` |
| `suggestedTestScenarios` | `suggested_test_scenarios` | `test_scenarios` | — |
| `suggestedTestCases` | `suggested_test_cases` | `test_cases` | — |
| `qualityRisks` | `quality_risks` | `workspace_artifacts` | `RISK_ITEM` |
| `uxProductRisks` | `ux_product_risks` | `workspace_artifacts` | `RISK_ITEM` |
| `releaseReadinessNotes` | `release_readiness_notes` | `workspace_artifacts` | `QA_ACTION` |

---

## Entidades do Domínio de Conversão

### `WorkspaceArtifactRow` (Java record em `ConversionModels.java`)

Record Java que mapeia uma linha da tabela `workspace_artifacts` para uso em `WorkspaceArtifactRepository`.

```java
record WorkspaceArtifactRow(
    String id,
    String organizationId,
    String projectId,           // null = escopo de org
    String artifactType,        // REQUIREMENT | RISK_ITEM | QA_ACTION
    String title,
    String description,
    String status,              // DRAFT
    boolean aiAssisted,         // true
    String sourceCheckupReportId,
    String sourceSection,
    int    sourceItemIndex,     // 0-based
    String details,             // JSON
    String createdBy,
    Instant createdAt,
    Instant updatedAt
)
```

> **Nota**: `WorkspaceArtifactRepository.save(WorkspaceArtifactRow)` e `findBySource(reportId, section, index)` são os dois métodos mínimos para este bloco.

---

### `ConversionItemIntent`

Representa a intenção do usuário por item selecionado no payload de confirmação.

```
sourceSection: String        — nome da seção
sourceItemIndex: int         — posição 0-based na lista
intent: SKIP | CREATE_NEW    — decisão do usuário (padrão: SKIP se alreadyConverted)
```

### `ConversionPreviewItem`

Retornado pelo endpoint de preview por item selecionado.

```
sourceSection: String
sourceItemIndex: int
artifactType: String         — tipo que seria criado
title: String                — título derivado do item
description: String          — descrição derivada do item
alreadyConverted: boolean    — true se já existe artefato com mesma tripla
existingArtifactId: String?  — ID do artefato existente, quando alreadyConverted=true
existingArtifactTable: String? — 'test_scenarios' | 'test_cases' | 'workspace_artifacts'
```

### `ConversionResult`

Retornado pelo endpoint de confirmação.

```
createdArtifacts: List<CreatedArtifact>
skippedItems: int
```

```
CreatedArtifact:
  artifactId: String
  artifactType: String
  table: String              — tabela onde foi criado
  sourceSection: String
  sourceItemIndex: int
```
