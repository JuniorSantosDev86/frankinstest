# Data Model: FrankInDrift — Drift Detection Foundation

**Branch**: `017-frankindrift-foundation` | **Date**: 2026-05-20

> Nenhuma tabela nova é criada neste bloco. Todos os modelos de drift são computados sob demanda e retornados via API. Uma migration de índice é adicionada ao `schema.sql` existente.

---

## Modelos Computados (não persistidos)

### DriftStatus (enum)

Status agregado de drift para um artefato. Calculado pela hierarquia de severidade.

| Valor | Severidade | Descrição |
|---|---|---|
| `RELATORIO_INDISPONIVEL` | 4 (mais severo) | `sourceCheckupReportId` não resolve para relatório acessível na organização |
| `RASTREABILIDADE_INCOMPLETA` | 3 | Artefato possui `sourceCheckupReportId` mas `sourceItemIndex` está ausente |
| `POSSIVEL_DRIFT` | 2 | Título, descrição ou status foram alterados após criação |
| `SEM_DRIFT` | 1 (menos severo) | Nenhum sinal de drift detectado |

Quando múltiplos sinais estão ativos, o status exibido é o de maior severidade.

---

### DriftSignalCode (enum)

Código canônico de cada sinal de drift individual.

| Código | Condição de Detecção |
|---|---|
| `EDITED_AFTER_CREATION` | `artifact.updatedAt > artifact.createdAt` (proxy MVP). Qualquer atualização aciona o proxy — incluindo mudanças de status, que podem fazer este sinal coexistir com `STATUS_CHANGED`. Refinamento campo-a-campo contra conteúdo original do relatório é pós-MVP. |
| `STATUS_CHANGED` | `artifact.status != ArtifactStatus.DRAFT` — `DRAFT` é o valor canônico no enum/banco; `RASCUNHO` é apenas o rótulo pt-BR |
| `INCOMPLETE_TRACEABILITY` | `artifact.source_checkup_report_id IS NOT NULL` **e** `artifact.source_item_index IS NULL`. Artefatos sem `source_checkup_report_id` retornam 404 (fora do escopo) — nunca disparam este sinal. |
| `SOURCE_UNAVAILABLE` | `source_checkup_report_id` não retorna relatório acessível para a `organization_id` do usuário autenticado |

---

### DriftSignal (record)

Um sinal individual ativo em um artefato.

```java
record DriftSignal(
    DriftSignalCode code,
    String reasonPtBr   // Mensagem legível ao usuário, em pt-BR
)
```

**Mensagens pt-BR canônicas por sinal**:

| Código | `reasonPtBr` |
|---|---|
| `EDITED_AFTER_CREATION` | "Título ou descrição editados após criação" |
| `STATUS_CHANGED` | "Status alterado desde a criação" |
| `INCOMPLETE_TRACEABILITY` | "Campos de rastreabilidade ausentes" |
| `SOURCE_UNAVAILABLE` | "Relatório de origem indisponível" |

---

### DriftResult (record)

Resposta completa de drift para um artefato individual. Retornado por `GET /api/drift/artifacts/{artifactId}`.

```java
record DriftResult(
    String artifactId,
    DriftStatus driftStatus,
    List<DriftSignal> signals    // Todos os sinais ativos; vazio quando SEM_DRIFT
)
```

**Hierarquia de status**: O `driftStatus` é determinado pelo sinal de maior severidade na lista `signals`. Se `signals` estiver vazio, `driftStatus = SEM_DRIFT`.

---

### MissingSection (record)

Seção de um relatório de Check-up cujos itens elegíveis não geraram artefatos.

```java
record MissingSection(
    String sectionName,          // Ex.: "missing_or_unclear_requirements"
    int eligibleItemCount,       // Total de itens elegíveis na seção
    int existingArtifactCount    // Artefatos já criados para esta seção
)
```

---

### DriftSummary (record)

Resumo de drift para todos os artefatos derivados de um relatório de Check-up. Retornado por `GET /api/drift/reports/{reportId}`.

```java
record DriftSummary(
    String reportId,
    int totalAnalyzed,                         // Total de artefatos com sourceCheckupReportId = reportId
    Map<DriftStatus, Integer> countByStatus,   // Contagem por status de drift
    List<MissingSection> missingSections       // Seções com itens elegíveis sem artefato criado
)
```

---

## Tabelas Existentes Relevantes (leitura apenas)

### workspace_artifacts

Campos lidos pelo DriftService:

| Campo | Tipo | Uso no Drift |
|---|---|---|
| `id` | VARCHAR(120) | Identificador do artefato |
| `organization_id` | VARCHAR(120) | Isolamento de organização (todos os queries) |
| `source_checkup_report_id` | VARCHAR(120) | Detectar INCOMPLETE_TRACEABILITY, SOURCE_UNAVAILABLE, MISSING_ARTIFACTS |
| `source_section` | VARCHAR(100) | Agrupar por seção em MISSING_ARTIFACTS |
| `source_item_index` | INTEGER | Detectar INCOMPLETE_TRACEABILITY |
| `source_ai_run_id` | VARCHAR(255) | Correlação adicional (referência, não usado no cálculo de drift neste bloco) |
| `status` | VARCHAR(50) | Detectar STATUS_CHANGED (`!= 'DRAFT'`) |
| `title` | VARCHAR(500) | Detectar EDITED_AFTER_CREATION (comparação indireta via updatedAt) |
| `description` | TEXT | Detectar EDITED_AFTER_CREATION |
| `created_at` | TIMESTAMP | Detectar EDITED_AFTER_CREATION (`updatedAt > createdAt`) |
| `updated_at` | TIMESTAMP | Detectar EDITED_AFTER_CREATION |

### checkup_reports

Campos lidos pelo DriftService:

| Campo | Tipo | Uso no Drift |
|---|---|---|
| `id` | VARCHAR(?) | Verificar acessibilidade do relatório (SOURCE_UNAVAILABLE) |
| `organization_id` | VARCHAR(?) | Validar que o relatório pertence à organização do usuário |

### test_scenarios / test_cases

Campos lidos para MISSING_ARTIFACTS:

| Campo | Uso |
|---|---|
| `source_checkup_report_id` | Correlação com relatório |
| `organization_id` | Isolamento de organização |
| `source_section` | Agrupar por seção |
| `source_item_index` | Identificar item específico |

---

## Schema Change: Novo Índice

Adicionar ao `services/api/src/main/resources/db/schema.sql` após os índices existentes de `workspace_artifacts`:

```sql
-- Bloco 17: compound index for drift queries (org-scoped lookups by source report)
CREATE INDEX IF NOT EXISTS idx_workspace_artifacts_org_source_report
    ON workspace_artifacts(organization_id, source_checkup_report_id);
```

**Justificativa**: A query principal de drift — `WHERE organization_id = ? AND source_checkup_report_id = ?` — não é coberta por nenhum índice existente. Sem este índice, a query fará seq scan na tabela inteira conforme o volume cresce.

---

## Seções Elegíveis para MISSING_ARTIFACTS

Constante compartilhada entre `conversion/` e `drift/` (centralizada em `conversion/ConversionEligibility.java` ou similar):

| Seção | Tabela de Artefatos | Tipo |
|---|---|---|
| `missing_or_unclear_requirements` | workspace_artifacts | REQUIREMENT |
| `quality_risks` | workspace_artifacts | RISK_ITEM |
| `ux_product_risks` | workspace_artifacts | RISK_ITEM |
| `release_readiness_notes` | workspace_artifacts | QA_ACTION |
| `suggested_test_scenarios` | test_scenarios | TEST_SCENARIO |
| `suggested_test_cases` | test_cases | TEST_CASE |
