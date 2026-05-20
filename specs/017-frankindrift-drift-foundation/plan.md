# Implementation Plan: FrankInDrift — Drift Detection Foundation

**Branch**: `017-frankindrift-foundation` | **Date**: 2026-05-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/017-frankindrift-drift-foundation/spec.md`

---

## Summary

Implementar a fundação de detecção de drift do FrankInDrift: um novo módulo `drift/` no backend Spring Boot que calcula sob demanda (sem AI, sem persistência) o alinhamento entre artefatos de Workspace e seus relatórios de Check-up de origem. Dois endpoints REST dedicados expõem o resultado. O frontend exibe indicadores de drift via chamadas não-bloqueantes adicionadas às telas existentes de detalhe de artefato e página de relatório.

---

## Technical Context

**Language/Version**: Next.js 14 / TypeScript em `apps/web`; Java 21 / Spring Boot 3 em `services/api`

**Primary Dependencies**: Spring Boot (Web, JDBC, Security), PostgreSQL, Next.js, Tailwind, JWT (`system/JwtAuthFilter`)

**Storage**: PostgreSQL via `schema.sql` com `IF NOT EXISTS`. Nenhuma tabela nova. Uma migration de índice composto adicionada ao `schema.sql` existente.

**Testing**: Backend — JUnit 5 unit tests para `DriftService` (5 sinais: 4 sinais de artefato + 1 sinal de relatório + hierarquia + isolamento), MockMvc integration tests para `DriftController`. Frontend — lint + build; sem novos E2E (drift é feature aditiva não-bloqueante).

**Target Platform**: Servidor Linux, JVM 21, PostgreSQL 15+

**Performance Goals**: `GET /api/drift/artifacts/{id}` < 500ms p95 (contribuição backend para SC-001 < 2s end-to-end)

**Constraints**: Read-only — nenhuma mutação. Zero chamadas a AI provider. Isolamento de organização obrigatório em 100% dos cálculos.

**Scale/Scope**: Volume de artefatos por relatório limitado pelo tamanho do relatório de Check-up. Sem paginação no resumo de relatório.

---

## Constitution Check

| Princípio | Status | Observação |
|---|---|---|
| **Arquitetura**: UI em `apps/web`, lógica em `services/api`, PostgreSQL como fonte de verdade | PASS | Novo módulo `drift/` no monolito Spring Boot; frontend consome via API |
| **Monolito modular**: sem microserviços no MVP | PASS | `drift/` é um sub-pacote do monolito `services/api` |
| **Fronteiras de responsabilidade**: permissões, persistência, segurança no backend | PASS | Cálculo de drift, validação JWT/org, isolamento — todos no backend |
| **AI governance**: sem chamadas a AI provider; sem consumo de créditos | PASS | FR-018: zero chamadas a AI. Cálculo é determinístico. |
| **Segurança/LGPD**: secrets server-side, validação org/auth, sem dados cross-org | PASS | JWT + `X-Organization-Id` em todos os endpoints; 403/404 para cross-org |
| **Idioma pt-BR**: toda UI nova em pt-BR | PASS | Todos os labels, mensagens e estados vazios de drift em pt-BR |
| **Testing discipline**: unit tests para lógica de negócio, integration tests para API | PASS | `DriftServiceTest` (5 sinais: 4 sinais de artefato + 1 sinal de relatório) + `DriftControllerTest` (auth, isolamento) |
| **Execution discipline**: escopo pequeno, sem refactors não relacionados | PASS | Bloco aditivo; endpoints existentes não são modificados |

---

## Project Structure

### Documentation (this feature)

```text
specs/017-frankindrift-drift-foundation/
├── plan.md              # Este arquivo
├── research.md          # Phase 0 — unknowns resolvidos
├── data-model.md        # Phase 1 — modelos computados e schema
├── quickstart.md        # Phase 1 — setup e smoke tests
├── contracts/
│   ├── drift-artifact-endpoint.md   # GET /api/drift/artifacts/{id}
│   └── drift-report-endpoint.md     # GET /api/drift/reports/{reportId}
└── tasks.md             # Phase 2 — gerado pelo /speckit-tasks
```

### Source Code

```text
services/api/src/main/java/com/frankintest/api/
├── drift/                                          (novo pacote)
│   ├── DriftController.java                        (novo)
│   ├── DriftService.java                           (novo)
│   ├── DriftModels.java                            (novo — enums + records)
│   └── DriftRepository.java                        (novo — queries read-only)
├── conversion/
│   ├── ConversionService.java                      (sem alteração — leitura de referência)
│   ├── ConversionEligibility.java                  (novo — constante de seções elegíveis, centraliza regra do Bloco 13)
│   └── WorkspaceArtifactRepository.java            (sem alteração — leitura de referência)
└── workspace/
    └── ArtifactReviewController.java               (sem alteração)

services/api/src/main/resources/db/
└── schema.sql                                      (adicionar índice composto no final do bloco workspace_artifacts)

services/api/src/test/java/com/frankintest/api/
└── drift/
    ├── DriftServiceTest.java                       (novo — unit tests dos 5 sinais: 4 sinais de artefato + 1 sinal de relatório + hierarquia + isolamento)
    └── DriftControllerTest.java                    (novo — integration tests com MockMvc)

apps/web/src/
├── lib/drift/
│   ├── driftApi.ts                                 (novo — fetch para /api/drift/*)
│   └── driftTypes.ts                               (novo — DriftResult, DriftSummary, DriftStatus, DriftSignal)
├── components/drift/
│   ├── DriftIndicator.tsx                          (novo — badge/label para tela de detalhe do artefato)
│   └── DriftSummaryPanel.tsx                       (novo — painel de resumo para página de relatório)
└── app/
    ├── workspace/artifacts/
    │   └── page.tsx                                (existente — integrar DriftIndicator no WorkspaceArtifactDetailPanel)
    └── checkup/[runId]/
        └── page.tsx                                (existente — integrar DriftSummaryPanel)
```

**Structure Decision**: Novo pacote `drift/` no monolito mantém separação de responsabilidades sem criar novo serviço. `ConversionEligibility.java` centraliza a lista de seções elegíveis — compartilhada entre `conversion/` e `drift/` para evitar duplicação. Frontend recebe uma lib `drift/` espelhando o padrão das outras libs (`checkup/`, `artifacts/`).

---

## Design Decisions

### Backend: DriftService — algoritmo de cálculo

```
calculateArtifactDrift(artifactId, organizationId):
  1. Buscar artifact no escopo da org → 404 se não encontrado
  2. Se sourceCheckupReportId == null → 404 (não é derivado de Check-up)
  3. Verificar acessibilidade do relatório de origem:
     - Se relatório não encontrado no org-scope → sinal SOURCE_UNAVAILABLE
  4. Checar INCOMPLETE_TRACEABILITY:
     - Se sourceCheckupReportId || sourceItemIndex == null → sinal
  5. Checar EDITED_AFTER_CREATION:
     - Se updatedAt > createdAt (tolerância: 0s) → sinal
  6. Checar STATUS_CHANGED:
     - Se artifact.status != 'DRAFT' → sinal
  7. Agregar sinais → DriftStatus pela hierarquia de severidade
  8. Retornar DriftResult
```

### Backend: DriftService — resumo de relatório

```
calculateReportDrift(reportId, organizationId):
  1. Verificar que relatório existe e pertence à org → 404/403
  2. Buscar todos os artefatos onde source_checkup_report_id = reportId AND organization_id = orgId
     (nas 3 tabelas: workspace_artifacts, test_scenarios, test_cases)
  3. Para cada artefato, calcular driftStatus individual
  4. Contar por status → countByStatus
  5. Para cada seção elegível (via ConversionEligibility):
     - Contar itens elegíveis na seção do relatório
     - Contar artefatos existentes para essa seção + reportId + orgId
     - Se existingArtifactCount < eligibleItemCount → incluir em missingSections
  6. Retornar DriftSummary
```

### Frontend: non-blocking pattern

```typescript
// DriftIndicator: used inside WorkspaceArtifactDetailPanel
// Calls drift API after artifact loads; never blocks artifact display
useEffect(() => {
  if (!artifact.sourceCheckupReportId) return
  driftApi.getArtifactDrift(artifact.id)
    .then(setDriftResult)
    .catch(() => setDriftError(true))
}, [artifact.id])
```

---

## Complexity Tracking

Nenhuma violação da Constitution justificada neste bloco. O plano é totalmente compatível com todos os princípios.

---

## Artifacts Generated

| Artefato | Caminho | Conteúdo |
|---|---|---|
| research.md | `specs/017-frankindrift-drift-foundation/research.md` | 5 decisões de pesquisa com rationale |
| data-model.md | `specs/017-frankindrift-drift-foundation/data-model.md` | Modelos computados, tabelas existentes, schema change |
| contracts/ | `specs/017-frankindrift-drift-foundation/contracts/` | Contratos dos 2 endpoints de drift |
| quickstart.md | `specs/017-frankindrift-drift-foundation/quickstart.md` | Setup, validação de índice, smoke tests |
