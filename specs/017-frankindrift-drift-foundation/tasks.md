# Tasks: FrankInDrift — Drift Detection Foundation

**Input**: Design documents from `specs/017-frankindrift-drift-foundation/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅ | quickstart.md ✅

**Tests**: Incluídos conforme constituição FrankInTest: unit tests para regras de negócio do `DriftService`; integration tests (MockMvc) para `DriftController` cobrindo auth, isolamento de org e respostas HTTP; lint + build do frontend.

**Organization**: Tarefas agrupadas por user story para implementação e teste independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências incompletas)
- **[Story]**: User story correspondente (US1, US2, US3)
- Caminhos completos incluídos em cada tarefa

## Path Conventions

- **Frontend**: `apps/web/src/`
- **Backend main**: `services/api/src/main/java/com/frankintest/api/`
- **Backend test**: `services/api/src/test/java/com/frankintest/api/`
- **Infrastructure/Schema**: `services/api/src/main/resources/db/schema.sql`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Única mudança de infraestrutura — adicionar o índice composto ao schema existente.

- [X] T001 Adicionar índice composto `idx_workspace_artifacts_org_source_report` em `(organization_id, source_checkup_report_id)` ao final do bloco de índices de `workspace_artifacts` em `services/api/src/main/resources/db/schema.sql`, com comentário `-- Bloco 17` e `IF NOT EXISTS`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Modelos, constante de elegibilidade e repositório de leitura — bloqueiam todas as user stories.

**⚠️ CRITICAL**: Nenhuma user story pode começar antes desta fase estar completa.

- [X] T002 Criar `services/api/src/main/java/com/frankintest/api/drift/DriftModels.java` com os 4 enums/records: `DriftStatus` (SEM_DRIFT, POSSIVEL_DRIFT, RASTREABILIDADE_INCOMPLETA, RELATORIO_INDISPONIVEL), `DriftSignalCode` (EDITED_AFTER_CREATION, STATUS_CHANGED, INCOMPLETE_TRACEABILITY, SOURCE_UNAVAILABLE), `DriftSignal(code, reasonPtBr)`, `DriftResult(artifactId, driftStatus, signals)`, `MissingSection(sectionName, eligibleItemCount, existingArtifactCount)`, `DriftSummary(reportId, totalAnalyzed, countByStatus, missingSections)`
- [X] T003 Criar `services/api/src/main/java/com/frankintest/api/conversion/ConversionEligibility.java` com constante `ELIGIBLE_SECTIONS` mapeando as 6 seções elegíveis do Bloco 13 para suas tabelas de destino (workspace_artifacts, test_scenarios, test_cases) — sem alterar `ConversionService`
- [X] T004 Criar `services/api/src/main/java/com/frankintest/api/drift/DriftRepository.java` com queries JDBC read-only: `findArtifactById(id, organizationId)`, `findReportById(reportId, organizationId)`, `findArtifactsBySourceReport(reportId, organizationId)`, `countArtifactsBySectionAndReport(reportId, sectionName, organizationId)` em workspace_artifacts + equivalentes em test_scenarios e test_cases para `MISSING_ARTIFACTS`

**Checkpoint**: Modelos, elegibilidade e repositório prontos — implementação das user stories pode começar.

---

## Phase 3: User Story 1 — Drift Status no Detalhe do Artefato (Priority: P1) 🎯 MVP

**Goal**: QA visualiza indicador de drift na tela de detalhe de artefato derivado de Check-up, com todos os 4 sinais detectáveis e hierarquia de severidade funcionando.

**Independent Test**: Criar artefato derivado de Check-up, editar seu título, acessar tela de detalhe → indicador deve exibir "Possível drift" com razão "Título ou descrição editados após criação".

### Testes para User Story 1

- [X] T005 [P] [US1] Criar `services/api/src/test/java/com/frankintest/api/drift/DriftServiceTest.java` com unit tests para os 4 sinais de drift: `EDITED_AFTER_CREATION` (updatedAt > createdAt), `STATUS_CHANGED` (artifact.status != ArtifactStatus.DRAFT — DRAFT é o valor canônico, RASCUNHO é apenas o rótulo pt-BR), `INCOMPLETE_TRACEABILITY` (sourceCheckupReportId presente + source_item_index null), `SOURCE_UNAVAILABLE` (sourceCheckupReportId presente + reportId não resolve na org), `SEM_DRIFT` (nenhum sinal), e hierarquia de severidade quando múltiplos sinais ativos
- [X] T006 [P] [US1] Criar `services/api/src/test/java/com/frankintest/api/drift/DriftControllerTest.java` com integration tests (MockMvc) para `GET /api/drift/artifacts/{id}`: 200 com SEM_DRIFT, 200 com POSSIVEL_DRIFT, 401 sem JWT, 403 com X-Organization-Id inválido, 404 para artefato de outra org (isolamento), 404 para artefato sem sourceCheckupReportId, 500 para falha interna simulada

### Implementação de User Story 1

- [X] T007 [US1] Criar `services/api/src/main/java/com/frankintest/api/drift/DriftService.java` com método `calculateArtifactDrift(artifactId, organizationId)` implementando todos os 4 sinais, hierarquia de severidade e retorno de `DriftResult` — sem chamadas a AI, sem mutações, usando `DriftRepository` e `ConversionEligibility` (depende de T002, T003, T004)
- [X] T008 [US1] Criar `services/api/src/main/java/com/frankintest/api/drift/DriftController.java` com `GET /api/drift/artifacts/{artifactId}`, protegido por JWT e `X-Organization-Id`, retornando `DriftResult` como JSON; HTTP 500 para exceção técnica inesperada; HTTP 404 para artefato não encontrado no org-scope (depende de T007)
- [X] T009 [P] [US1] Criar `apps/web/src/lib/drift/driftTypes.ts` com tipos TypeScript espelhando os records do backend: `DriftStatus`, `DriftSignalCode`, `DriftSignal`, `DriftResult`
- [X] T010 [P] [US1] Criar `apps/web/src/lib/drift/driftApi.ts` com função `getArtifactDrift(artifactId: string): Promise<DriftResult>` chamando `GET /api/drift/artifacts/{artifactId}` com JWT e `X-Organization-Id` — sem lógica de negócio, sem chamada a AI provider (depende de T009)
- [X] T011 [P] [US1] Criar `apps/web/src/components/drift/DriftIndicator.tsx` exibindo badge/label com `driftStatus` em pt-BR, lista de razões ativas, estado de loading, e estado de erro discreto ("Não foi possível calcular drift agora") — sem chamar API diretamente, recebe `driftResult`/`loading`/`error` como props
- [X] T012 [US1] Integrar `DriftIndicator` na tela de detalhe de artefato em `apps/web/src/app/workspace/artifacts/page.tsx` (dentro de `WorkspaceArtifactDetailPanel`): `useEffect` que chama `driftApi.getArtifactDrift` após carregar o artefato; chamada somente se `artifact.sourceCheckupReportId` estiver preenchido; não bloqueia renderização do artefato; falha exibe estado discreto em pt-BR (depende de T010, T011)
- [X] T013 [US1] Verificar que todos os labels de drift em `DriftIndicator.tsx` e na integração em `page.tsx` estão em pt-BR: "Sem drift detectado", "Possível drift", "Rastreabilidade incompleta", "Relatório de origem indisponível", "Não foi possível calcular drift agora" e razões de cada sinal

**Checkpoint**: US1 completamente funcional. QA consegue ver indicador de drift no detalhe do artefato com todos os 4 sinais e comportamento não-bloqueante.

---

## Phase 4: User Story 2 — Resumo de Drift do Relatório (Priority: P2)

**Goal**: QA visualiza painel de resumo de drift na página de relatório de Check-up, com contagens por status e seções sem artefato criado.

**Independent Test**: Acessar página de relatório de Check-up com artefatos em diferentes estados → resumo exibe contagens corretas por status e lista seções com itens elegíveis não convertidos.

### Testes para User Story 2

- [X] T014 [P] [US2] Adicionar unit tests em `services/api/src/test/java/com/frankintest/api/drift/DriftServiceTest.java` para `calculateReportDrift`: contagens por status corretas, `MISSING_ARTIFACTS` detectado em workspace_artifacts + test_scenarios + test_cases, relatório sem artefatos retorna totalAnalyzed=0 e missingSections preenchido, isolamento de org no summary
- [X] T015 [P] [US2] Adicionar integration tests em `services/api/src/test/java/com/frankintest/api/drift/DriftControllerTest.java` para `GET /api/drift/reports/{reportId}`: 200 com summary correto, estado vazio (totalAnalyzed=0), 401/403/404 e isolamento de org

### Implementação de User Story 2

- [X] T016 [US2] Adicionar método `calculateReportDrift(reportId, organizationId)` em `services/api/src/main/java/com/frankintest/api/drift/DriftService.java` — verifica acessibilidade do relatório, agrega drift individual de cada artefato, calcula countByStatus, detecta missingSections via `ConversionEligibility` comparando itens elegíveis contra artefatos existentes nas 3 tabelas (depende de T007)
- [X] T017 [US2] Adicionar `GET /api/drift/reports/{reportId}` em `services/api/src/main/java/com/frankintest/api/drift/DriftController.java` retornando `DriftSummary` como JSON (depende de T016)
- [X] T018 [P] [US2] Adicionar `getDriftSummary(reportId: string): Promise<DriftSummary>` em `apps/web/src/lib/drift/driftApi.ts` e adicionar `DriftSummary`, `MissingSection` em `apps/web/src/lib/drift/driftTypes.ts`
- [X] T019 [P] [US2] Criar `apps/web/src/components/drift/DriftSummaryPanel.tsx` exibindo: contagens por status em pt-BR, lista de seções com itens sem artefato, estado vazio ("Nenhum artefato foi criado a partir deste relatório") e estado de erro discreto — recebe `driftSummary`/`loading`/`error` como props
- [X] T020 [US2] Integrar `DriftSummaryPanel` na página de relatório em `apps/web/src/app/checkup/[runId]/page.tsx`: após carregar o relatório, extrair `reportId` do `CheckupReport` retornado (não usar `runId` do URL diretamente); chamar `driftApi.getDriftSummary(reportId)` de forma não-bloqueante; se `reportId` não estiver disponível ou a chamada falhar, exibir estado discreto "Resumo de drift indisponível" em pt-BR — nunca passar `aiRunId` como `reportId` ao endpoint de drift (depende de T018, T019)

**Checkpoint**: US2 completamente funcional. QA consegue ver resumo de drift do relatório com contagens e seções sem cobertura.

---

## Phase 5: User Story 3 — Rastreabilidade Incompleta e Origem Indisponível (Priority: P3)

**Goal**: QA identifica artefatos com campos de rastreabilidade ausentes (`RASTREABILIDADE_INCOMPLETA`) e artefatos cujo relatório de origem está inacessível (`RELATORIO_INDISPONIVEL`) — ambos já calculados pelo DriftService, validar cobertura de testes e exibição na UI.

**Independent Test**: Verificar artefato com `sourceCheckupReportId` presente e `sourceItemIndex` ausente → indicador exibe "Rastreabilidade incompleta"; verificar artefato com `sourceCheckupReportId` que não resolve na organização atual → indicador exibe "Relatório de origem indisponível".

### Testes para User Story 3

- [X] T021 [P] [US3] Adicionar integration tests específicos em `DriftControllerTest.java` para cenários de US3: artefato com `source_checkup_report_id = NULL` retorna 404 (não é derivado de Check-up), artefato com `source_checkup_report_id` preenchido mas relatório de outra org retorna 200 com `RELATORIO_INDISPONIVEL`, artefato com `source_item_index = NULL` retorna 200 com `RASTREABILIDADE_INCOMPLETA`
- [X] T022 [P] [US3] Adicionar unit tests de hierarquia em `DriftServiceTest.java`: RELATORIO_INDISPONIVEL + RASTREABILIDADE_INCOMPLETA ativos simultaneamente → status = RELATORIO_INDISPONIVEL; RASTREABILIDADE_INCOMPLETA + POSSIVEL_DRIFT → status = RASTREABILIDADE_INCOMPLETA; todas as combinações de sinais respeitam a hierarquia

### Implementação de User Story 3

- [X] T023 [US3] Confirmar que T013 (US1) já cobriu todos os 4 labels pt-BR do `DriftIndicator.tsx`; ajustar se necessário. Verificar adicionalmente que a integração em `apps/web/src/app/workspace/artifacts/page.tsx` não exibe drift para artefatos sem `sourceCheckupReportId` e que o estado de erro ("Não foi possível calcular drift agora") aparece corretamente ao simular falha do endpoint

**Checkpoint**: Todos os 4 sinais, todos os status de drift e toda a hierarquia de severidade verificados com testes e exibição correta na UI.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validação final, qualidade e run report.

- [X] T025 [P] Executar `./mvnw test` em `services/api/` e confirmar que todos os testes passam, incluindo `DriftServiceTest` e `DriftControllerTest` — zero regressões nos testes existentes
- [X] T026 [P] Executar `npm run lint && npm run build` em `apps/web/` e confirmar que lint e build passam sem erros
- [X] T027 [P] Verificar que nenhum dos endpoints de artefatos existentes (`GET /api/workspace/artifacts/{id}`, `GET /api/workspace/artifacts`, `PATCH /api/workspace/artifacts/{id}`) foi modificado — executar smoke tests dos endpoints existentes
- [X] T028 [P] Verificar via revisão de código que `DriftController`, `DriftService` e `DriftRepository` não contêm chamadas a `AiProviderPort`, `AnthropicAiProvider`, `CreditService` ou qualquer provider de AI — zero consumo de crédito
- [X] T029 Confirmar via `psql` ou log de startup que o índice `idx_workspace_artifacts_org_source_report` foi criado corretamente em `workspace_artifacts(organization_id, source_checkup_report_id)`
- [X] T030 Executar smoke tests do `quickstart.md` — verificar os 4 cenários: SEM_DRIFT, POSSIVEL_DRIFT após edição, resumo de relatório, e isolamento de organização (404 cross-org para artefato e relatório; 403 para X-Organization-Id ausente/inválido); verificar que o `DriftSummaryPanel` exibe estado discreto "Resumo de drift indisponível" quando `reportId` não está disponível
- [X] T031 Produzir run report com: arquivos alterados/criados, funcionalidades implementadas, regras de negócio preservadas, testes adicionados, comandos de validação executados, limitações conhecidas, atualizações de roadmap/status e mensagem de commit sugerida; incluir nota sobre latência observada do endpoint `/api/drift/artifacts/{id}` (target < 500ms p95 per plan.md)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — iniciar imediatamente
- **Foundational (Phase 2)**: Depende de Phase 1 — **BLOQUEIA todas as user stories**
- **US1 (Phase 3)**: Depende de Phase 2 — MVP independente e testável
- **US2 (Phase 4)**: Depende de Phase 2 + reusa DriftService de US1 — T016 depende de T007
- **US3 (Phase 5)**: Depende de Phase 3 e 4 estarem completas — validação de cobertura
- **Polish (Phase 6)**: Depende de todas as fases anteriores

### User Story Dependencies

- **US1 (P1)**: Pode começar após Phase 2. Nenhuma dependência em US2 ou US3.
- **US2 (P2)**: Pode começar após Phase 2. Reutiliza `DriftService` criado em US1 (T016 depende de T007).
- **US3 (P3)**: Pode começar após US1 e US2. Não cria código novo — adiciona testes e validações sobre o que foi criado.

### Within Each User Story

- Testes (T005/T006) → criados antes ou em paralelo com implementação (escrita de test-first para signals)
- DriftModels + ConversionEligibility + DriftRepository (Phase 2) → antes de DriftService
- DriftService → antes de DriftController
- driftTypes.ts → antes de driftApi.ts → antes de DriftIndicator/DriftSummaryPanel
- Componentes frontend → antes de integração nas pages

### Parallel Opportunities

- T005 e T006 (testes US1) podem ser escritos em paralelo
- T009 (driftTypes.ts) e T014/T015 (testes US2) podem rodar em paralelo após T002
- T018 e T019 (frontend US2) podem rodar em paralelo
- T021 e T022 (testes US3) podem rodar em paralelo
- T025, T026, T027, T028, T029 (polish) podem rodar em paralelo

---

## Parallel Example: User Story 1

```bash
# Após Phase 2 completa, lançar em paralelo:
Task T005: "DriftServiceTest — unit tests dos 4 sinais"
Task T006: "DriftControllerTest — integration tests do endpoint /api/drift/artifacts/{id}"
Task T009: "driftTypes.ts — tipos TypeScript"

# Após T005/T006, T009 completos:
Task T007: "DriftService.calculateArtifactDrift"
Task T010: "driftApi.ts (depende de T009)"
Task T011: "DriftIndicator.tsx (depende de T009)"
```

## Parallel Example: User Story 2

```bash
# Após T007 completo, lançar em paralelo:
Task T014: "Unit tests calculateReportDrift"
Task T015: "Integration tests GET /api/drift/reports/{reportId}"
Task T018: "getDriftSummary + DriftSummary types"
Task T019: "DriftSummaryPanel.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup (T001 — índice)
2. Completar Phase 2: Foundational (T002–T004)
3. Completar Phase 3: US1 (T005–T013)
4. **PARAR E VALIDAR**: Testar US1 independentemente — indicador de drift no detalhe do artefato
5. Demo: QA pode ver drift de artefatos editados

### Incremental Delivery

1. Setup + Foundational → Base de drift pronta
2. US1 → Indicador no detalhe do artefato → **Demo MVP** (valor imediato)
3. US2 → Resumo de drift no relatório → **Demo extendido**
4. US3 → Cobertura de testes dos casos estruturais → **Bloco completo**
5. Polish → Run report + validação final

### Parallel Team Strategy

Com dois developers após Phase 2:
- **Developer A**: US1 (T005–T013) — endpoint artifact drift + DriftIndicator
- **Developer B**: US2 T014+T015+T018+T019 (testes e frontend US2, aguarda T007 de Dev A para T016)

---

## Notes

- [P] tasks = arquivos diferentes, sem dependências incompletas — podem rodar em paralelo
- [Story] label mapeia tarefa para user story para rastreabilidade
- Cada user story é independentemente completável e testável
- Não commitar automaticamente — developer commita manualmente após validação
- Parar em cada Checkpoint para validar a story independentemente
- `DriftService` e `DriftController` são novos arquivos — sem modificação de endpoints existentes de artefatos ou relatórios
- Confirmar antes de qualquer tarefa que não há chamada a AI provider no pacote `drift/`
