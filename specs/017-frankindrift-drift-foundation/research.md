# Research: FrankInDrift — Drift Detection Foundation

**Branch**: `017-frankindrift-foundation` | **Date**: 2026-05-20

---

## R-001 — STATUS_CHANGED: como detectar status original

**Decision**: Comparação direta `artifact.status != ArtifactStatus.DRAFT`. `DRAFT` é o valor canônico no enum Java e no banco; `RASCUNHO` é o rótulo pt-BR e não deve ser usado como valor de comparação no código.

**Rationale**: O schema `workspace_artifacts` declara `status VARCHAR(50) NOT NULL DEFAULT 'DRAFT'`. A `ConversionService.confirm()` cria artefatos sem override de status — a invariante `DRAFT` está codificada no schema e no serviço de conversão. Nenhum campo `original_status` é necessário.

**Alternatives considered**: Campo `original_status` na tabela (overhead de schema sem ganho real para o MVP), leitura de `audit_log` para reconstruir status inicial (acoplamento fraco com tabela de auditoria, custo extra de query, sem benefício adicional).

---

## R-002 — MISSING_ARTIFACTS: elegibilidade de itens do relatório

**Decision**: Itens elegíveis = as 6 seções que `ConversionService.extractItem()` aceita com mapeamento definido.

| Seção do Relatório | Tipo de Artefato | Tabela Destino |
|---|---|---|
| `missing_or_unclear_requirements` | REQUIREMENT | workspace_artifacts |
| `quality_risks` | RISK_ITEM | workspace_artifacts |
| `ux_product_risks` | RISK_ITEM | workspace_artifacts |
| `release_readiness_notes` | QA_ACTION | workspace_artifacts |
| `suggested_test_scenarios` | TEST_SCENARIO | test_scenarios |
| `suggested_test_cases` | TEST_CASE | test_cases |

**Rationale**: A `ConversionService` é a única fonte de verdade para elegibilidade. Duplicar essa lista no DriftService criaria divergência futura. O DriftService deve referenciar ou extrair a lista canônica de seções elegíveis da camada de conversão.

**Implementação recomendada**: Extrair a lista de seções elegíveis para uma constante/helper compartilhado em `conversion/` (ex.: `ConversionEligibility.ELIGIBLE_SECTIONS`) que o `DriftService` importa. Não duplicar no pacote `drift/`.

**MISSING_ARTIFACTS query strategy**: Para verificar se um item elegível gerou artefato, consultar as 3 tabelas com `organization_id` + `source_checkup_report_id` + `source_section` + `source_item_index`:
1. `workspace_artifacts` — REQUIREMENT, RISK_ITEM, QA_ACTION
2. `test_scenarios` — TEST_SCENARIO
3. `test_cases` — TEST_CASE

**Alternatives considered**: Lista manual no DriftService (viola regra de não duplicação do spec), consultar histórico de conversões de outras orgs (viola isolamento de organização).

---

## R-003 — Frontend: chamada separada vs bundled

**Decision**: Chamada separada e não-bloqueante. Dois novos endpoints dedicados em `/api/drift/`.

**Rationale**: Os endpoints existentes `GET /api/workspace/artifacts/{id}` e `GET /api/checkup/runs/{aiRunId}` não são alterados neste bloco. O drift é um módulo aditivo que não pode bloquear carregamento de artefatos ou relatórios. Frontend usa chamadas independentes após o carregamento principal.

**Frontend pattern**:
```
// WorkspaceArtifactDetailPanel: após fetch do artefato
useEffect(() => {
  if (artifact?.sourceCheckupReportId) {
    driftApi.getArtifactDrift(artifactId)
      .then(setDriftResult)
      .catch(() => setDriftError(true))
  }
}, [artifactId])
```

**Alternatives considered**: Bundled no payload do artefato (modifica Bloco 14, cria acoplamento), polling após edição (desnecessário no MVP).

---

## R-004 — Backend: resposta para falha técnica inesperada

**Decision**: HTTP 500 com corpo genérico. Erros de domínio retornam HTTP 200 com `driftStatus` específico.

| Cenário | HTTP Status | driftStatus |
|---|---|---|
| Rastreabilidade incompleta (`sourceCheckupReportId` presente + `sourceItemIndex` ausente) | 200 | RASTREABILIDADE_INCOMPLETA |
| Relatório inacessível (`sourceCheckupReportId` não resolve na org) | 200 | RELATORIO_INDISPONIVEL |
| Artefato sem `sourceCheckupReportId` (não derivado de Check-up) | 404 | — |
| Acesso cross-org (artefato ou relatório de outra org) | 404 | — |
| `X-Organization-Id` ausente ou inválido | 403 | — |
| Timeout de DB / exceção inesperada | 500 | — |

**Frontend treatment**: Qualquer resposta não-2xx do endpoint de drift é tratada como erro não-bloqueante. UI exibe: "Não foi possível calcular drift agora".

---

## R-005 — Índice de banco de dados

**Decision**: Adicionar índice composto `idx_workspace_artifacts_org_source_report` em `(organization_id, source_checkup_report_id)` via `schema.sql` com `IF NOT EXISTS`.

**Schema analysis**:
- `idx_workspace_artifacts_org` → `(organization_id)` — existe, mas não cobre lookup por source_report
- `idx_workspace_artifacts_source` → `(source_checkup_report_id, source_section, source_item_index)` — existe, mas sem `organization_id` como primeira coluna
- `idx_workspace_artifacts_org_status_type` → `(organization_id, status, artifact_type)` — não cobre source_report

**Gap**: Nenhum índice existente cobre a query principal de drift: `WHERE organization_id = ? AND source_checkup_report_id = ?`. Sem o novo índice, a query fará seq scan na tabela.

**Implementation**: Adicionar ao final do bloco de índices em `schema.sql`:
```sql
-- Bloco 17: compound index for drift queries (org-scoped lookups by source report)
CREATE INDEX IF NOT EXISTS idx_workspace_artifacts_org_source_report
    ON workspace_artifacts(organization_id, source_checkup_report_id);
```

**Alternatives considered**: Adiar para post-MVP (aceita risco de degradação com volume crescente), usar apenas `idx_workspace_artifacts_org` (cobertura parcial, ainda precisa filtrar por source_report).

---

## Dependency Map

| Dependência | Localização | Uso no Bloco 17 |
|---|---|---|
| `workspace_artifacts` schema | `db/schema.sql` linhas 129–160 | Leitura de artefatos para cálculo de drift |
| `ConversionService.extractItem()` | `conversion/ConversionService.java` | Referência para elegibilidade de seções (MISSING_ARTIFACTS) |
| `WorkspaceArtifactRepository` | `conversion/WorkspaceArtifactRepository.java` | Reusar ou criar query de drift em repositório próprio |
| `checkup_reports` table | `db/schema.sql` linhas 88–109 | Validar acessibilidade do relatório de origem |
| `test_scenarios` table | `db/schema.sql` | Query para MISSING_ARTIFACTS (TEST_SCENARIO) |
| `test_cases` table | `db/schema.sql` | Query para MISSING_ARTIFACTS (TEST_CASE) |
| `WorkspaceArtifactDetailPanel` | `apps/web/src/app/workspace/artifacts/page.tsx` | Adicionar DriftIndicator (chamada separada) |
| `apps/web/src/app/checkup/[runId]/page.tsx` | frontend | Adicionar DriftSummaryPanel |
| `SecurityConfig` / `JwtAuthFilter` | `system/SecurityConfig.java` | Proteger novos endpoints de drift |
| `WorkspaceAccessService` | `system/WorkspaceAccessService.java` | Validar X-Organization-Id nos endpoints de drift |
