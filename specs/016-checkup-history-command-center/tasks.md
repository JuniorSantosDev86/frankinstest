# Tasks: Check-up History & Project Command Center

**Input**: Design documents from `specs/016-checkup-history-command-center/`

**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/api.md ✓

**Tests**: Constitution exige testes de integração para endpoints protegidos e fronteiras de permissão
no backend. Frontend requer lint + build. Nenhuma chamada ao provedor de IA — sem necessidade de mock.

**Organization**: Tasks agrupadas por User Story para implementação e teste independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode executar em paralelo (arquivos diferentes, sem dependências incompletas)
- **[Story]**: User story a que a task pertence (US1–US4)
- Caminhos exatos incluídos em cada descrição

## Path Conventions

- **Frontend**: `apps/web/src/`, `apps/web/tests/`
- **Backend**: `services/api/src/main/java/com/frankintest/api/`,
  `services/api/src/test/java/com/frankintest/api/`

---

## Phase 1: Setup (Infraestrutura Compartilhada)

**Purpose**: Verificar pré-requisitos e criar esqueleto de arquivos sem lógica.

- [ ] T001 Verificar que a coluna `source_ai_run_id` existe em `workspace_artifacts` (migration do Bloco 15); se ausente, documentar blocker antes de continuar
- [ ] T002 [P] Criar arquivo `apps/web/src/app/checkup/history/page.tsx` com scaffold vazio (sem lógica ainda)
- [ ] T003 [P] Criar diretório `apps/web/src/app/checkup/history/components/` com arquivos vazios: `CommandCenterPanel.tsx`, `CheckupHistoryList.tsx`, `CheckupHistoryItem.tsx`

**Checkpoint**: Estrutura de arquivos criada, pré-requisito de DB confirmado.

---

## Phase 2: Foundational (Pré-requisitos Bloqueantes)

**Purpose**: Records Java, tipos TypeScript e métodos de repository que todas as user stories precisam.
**⚠️ CRÍTICO**: Nenhuma user story pode começar até esta fase estar completa.

- [ ] T004 Adicionar records `CheckupRunListItem`, `CheckupRunsPage` e `CheckupRunsSummary` em `services/api/src/main/java/com/frankintest/api/checkup/CheckupModels.java`
- [ ] T005 [P] Adicionar método `findByOrganizationAndFeature(String organizationId, String feature, int offset, int limit)` em `services/api/src/main/java/com/frankintest/api/airuns/AiRunRepository.java` com SQL nativo via JdbcTemplate
- [ ] T006 [P] Adicionar método `countByOrganizationAndFeature(String organizationId, String feature)` em `services/api/src/main/java/com/frankintest/api/airuns/AiRunRepository.java`
- [ ] T007 [P] Adicionar método `countBySourceAiRunId(String organizationId, String sourceAiRunId)` em `services/api/src/main/java/com/frankintest/api/conversion/WorkspaceArtifactRepository.java`
- [ ] T008 Adicionar interfaces `CheckupRunListItem`, `CheckupRunsPage` e `CheckupRunsSummary` em `apps/web/src/lib/checkup/checkupTypes.ts`

**Checkpoint**: Foundation pronta — user stories podem começar em paralelo.

---

## Phase 3: User Story 1 — Acessar histórico de Check-ups (Priority: P1) 🎯 MVP

**Goal**: Usuário vê lista paginada de todos os Check-ups da organização sem saber o runId.

**Independent Test**: Criar dois Check-ups via API; acessar `GET /api/checkup/runs`; verificar que ambos aparecem com os campos corretos; tentar com org diferente e verificar 403.

### Testes para User Story 1 ⚠️

- [ ] T009 [P] [US1] Adicionar teste de integração para `GET /api/checkup/runs` (lista runs da org, paginação, ordem decrescente, campos obrigatórios) em `services/api/src/test/java/com/frankintest/api/checkup/CheckupControllerTest.java`
- [ ] T010 [P] [US1] Adicionar teste de integração para `GET /api/checkup/runs` com JWT ausente (espera 401) em `services/api/src/test/java/com/frankintest/api/checkup/CheckupControllerTest.java`
- [ ] T011 [P] [US1] Adicionar teste de integração para `GET /api/checkup/runs` com `X-Organization-Id` inválido/ausente (espera 403) em `services/api/src/test/java/com/frankintest/api/checkup/CheckupControllerTest.java`
- [ ] T012 [P] [US1] Adicionar teste de integração para isolamento de org: run de org B não aparece na resposta de org A em `services/api/src/test/java/com/frankintest/api/checkup/CheckupControllerTest.java`

### Implementação para User Story 1

- [ ] T013 [US1] Implementar query JOIN em `CheckupService.listRuns(orgId, page, size)` em `services/api/src/main/java/com/frankintest/api/checkup/CheckupService.java`: JOIN `ai_runs` + `checkup_reports` + COUNT de `workspace_artifacts` por `source_ai_run_id`; mapear `AiRunStatus` para `running/completed/failed`; retornar `CheckupRunsPage` (depende de T004, T005, T006, T007)
- [ ] T014 [US1] Adicionar endpoint `GET /api/checkup/runs` em `services/api/src/main/java/com/frankintest/api/checkup/CheckupController.java`: validar JWT + `X-Organization-Id`; parâmetros `page` (default 0) e `size` (default 20, max 50); delegar a `CheckupService.listRuns`; não alterar os três endpoints existentes (depende de T013)
- [ ] T015 [US1] Adicionar funções `listCheckupRuns(orgId, page, size)` em `apps/web/src/lib/checkup/checkupApi.ts` (depende de T008)
- [ ] T016 [US1] Implementar `CheckupHistoryList.tsx` em `apps/web/src/app/checkup/history/components/CheckupHistoryList.tsx`: tabela/lista com colunas alvo, profundidade, status (badge pt-BR: "Em andamento"/"Concluído"/"Falhou"/"Cancelado"), data, créditos estimados/consumidos, contagem de artefatos; estado vazio com CTA em pt-BR; controles de paginação simples (depende de T015)
- [ ] T017 [US1] Implementar `CheckupHistoryItem.tsx` em `apps/web/src/app/checkup/history/components/CheckupHistoryItem.tsx`: linha individual com link para `/checkup/{aiRunId}` apenas quando status = "completed"; runs "Em andamento" e "Falhou" sem link de relatório (depende de T016)
- [ ] T018 [US1] Montar a página base `/checkup/history` em `apps/web/src/app/checkup/history/page.tsx`: buscar dados via `listCheckupRuns`; renderizar `CheckupHistoryList`; botão "Atualizar" no topo que recarrega a lista; mensagem de erro em pt-BR com botão "Tentar novamente" em caso de falha de carregamento (depende de T016, T017)
- [ ] T019 [US1] Adicionar entrada "Histórico de Check-ups" apontando para `/checkup/history` em `apps/web/src/app/workspaceNavigation.ts` (sem quebrar entradas existentes)

**Checkpoint**: US1 completamente funcional — usuário acessa `/checkup/history`, vê lista, navega páginas, abre relatórios de runs concluídos.

---

## Phase 4: User Story 2 — Reabrir relatório de Check-up concluído (Priority: P1)

**Goal**: Usuário clica em run "Concluído" na lista e é levado ao relatório — sem saber o runId antecipadamente.

**Independent Test**: Com US1 funcional, clicar em item "Concluído" na lista e confirmar que abre `/checkup/{aiRunId}` com relatório completo e links de artefatos funcionando.

> **Nota**: A navegação para o relatório é implementada em T017 (link condicional por status). Esta fase consolida os testes específicos de US2 e verifica a integração com a página de relatório existente.

### Testes para User Story 2 ⚠️

- [ ] T020 [P] [US2] Adicionar teste de integração para `GET /api/checkup/runs/{aiRunId}` (endpoint existente) garantindo que não foi alterado e continua retornando 200 com relatório completo em `services/api/src/test/java/com/frankintest/api/checkup/CheckupControllerTest.java`
- [ ] T021 [P] [US2] Adicionar smoke test de frontend: verificar que link de relatório está presente para status "completed" e ausente para "running"/"failed" em `apps/web/tests/` (pode ser componente ou snapshot)

### Implementação para User Story 2

- [ ] T022 [US2] Verificar que `CheckupHistoryItem.tsx` implementado em T017 cobre todos os estados de US2: "Concluído" → link `/checkup/{aiRunId}`; "Em andamento"/"Falhou" → badge sem link; ajustar se necessário em `apps/web/src/app/checkup/history/components/CheckupHistoryItem.tsx`
- [ ] T023 [US2] Verificar que a abertura do relatório a partir do histórico não quebra links de artefatos e rastreabilidade existentes (regressão manual documentada no run report)

**Checkpoint**: US1 + US2 funcionais — usuário localiza e reabre qualquer relatório anterior sem saber o runId.

---

## Phase 5: User Story 3 — Visualizar artefatos gerados por cada Check-up (Priority: P2)

**Goal**: Usuário vê `artifactCount` na linha de cada Check-up na lista, sem navegar para o Workspace.

**Independent Test**: Criar artefatos a partir de um run via API de conversão; acessar `/checkup/history`; verificar que `artifactCount > 0` para aquele run e `0` para runs sem artefatos.

> **Nota**: `artifactCount` já é calculado no backend em T013 e retornado em `CheckupRunListItem`. Esta fase garante que o valor é exibido corretamente na UI.

### Testes para User Story 3 ⚠️

- [ ] T024 [P] [US3] Adicionar teste de integração para `GET /api/checkup/runs` que valida `artifactCount` correto (incluindo `0` quando não há artefatos) em `services/api/src/test/java/com/frankintest/api/checkup/CheckupControllerTest.java`

### Implementação para User Story 3

- [ ] T025 [US3] Garantir que `CheckupHistoryItem.tsx` exibe `artifactCount` corretamente: "N artefatos criados" para N > 0; "Nenhum artefato" ou "—" para N = 0; "—" para runs não concluídos; ajustar texto pt-BR em `apps/web/src/app/checkup/history/components/CheckupHistoryItem.tsx` (depende de T017)

**Checkpoint**: US1 + US2 + US3 funcionais — lista exibe contagem de artefatos por run.

---

## Phase 6: User Story 4 — Command Center do projeto (Priority: P2)

**Goal**: Usuário vê bloco de resumo operacional no topo de `/checkup/history` com totais da organização.

**Independent Test**: Acessar `/checkup/history`; verificar que o bloco Command Center exibe: total de runs, concluídos, em andamento/falhos, créditos consumidos totais e total de artefatos — com rótulos pt-BR; verificar que `GET /api/checkup/runs/summary` retorna 0s para org sem runs e retorna dados corretos para org com runs.

### Testes para User Story 4 ⚠️

- [ ] T026 [P] [US4] Adicionar teste de integração para `GET /api/checkup/runs/summary` (org com runs, org sem runs, org errada) em `services/api/src/test/java/com/frankintest/api/checkup/CheckupControllerTest.java`
- [ ] T027 [P] [US4] Adicionar teste de integração para `GET /api/checkup/runs/summary` com JWT ausente (401) e `X-Organization-Id` inválido (403) em `services/api/src/test/java/com/frankintest/api/checkup/CheckupControllerTest.java`

### Implementação para User Story 4

- [ ] T028 [US4] Implementar `CheckupService.getRunsSummary(orgId)` em `services/api/src/main/java/com/frankintest/api/checkup/CheckupService.java`: query única com COUNTs separados (`totalRuns`, `completedRuns`, `runningRuns`, `failedRuns`) e `SUM(consumed_credits)` + subquery para `totalArtifacts`; retornar `CheckupRunsSummary` com zeros em todos os campos quando org não tem runs (depende de T004, T005, T006, T007)
- [ ] T029 [US4] Adicionar endpoint `GET /api/checkup/runs/summary` em `services/api/src/main/java/com/frankintest/api/checkup/CheckupController.java`: validar JWT + `X-Organization-Id`; delegar a `CheckupService.getRunsSummary`; rota DEVE ser registrada antes de `GET /runs/{aiRunId}` para evitar conflito de roteamento (depende de T028)
- [ ] T030 [US4] Adicionar função `getCheckupRunsSummary(orgId)` em `apps/web/src/lib/checkup/checkupApi.ts` (depende de T008)
- [ ] T031 [US4] Implementar `CommandCenterPanel.tsx` em `apps/web/src/app/checkup/history/components/CommandCenterPanel.tsx`: exibir 4 métricas (total runs, concluídos, em andamento/falhos, créditos consumidos no total) + total de artefatos; rótulo de créditos: "Créditos consumidos no total"; estado vazio pt-BR; estado de loading; estado de erro com botão "Tentar novamente" (depende de T030)
- [ ] T032 [US4] Integrar `CommandCenterPanel` na página `/checkup/history` em `apps/web/src/app/checkup/history/page.tsx`: buscar `listCheckupRuns` e `getCheckupRunsSummary` em paralelo; botão "Atualizar" existente deve recarregar AMBOS; Command Center no topo, lista abaixo (depende de T031, T018)

**Checkpoint**: Bloco completo — `/checkup/history` exibe Command Center + lista + artefatos + navegação.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validação final, qualidade e run report.

- [ ] T033 [P] Executar `cd services/api && ./mvnw test` e confirmar que todos os testes passam (incluindo os novos de T009–T012, T020, T024, T026–T027)
- [ ] T034 [P] Executar `cd apps/web && npm run lint` e corrigir todos os warnings/errors
- [ ] T035 [P] Executar `cd apps/web && npm run build` e confirmar build sem erros
- [ ] T036 Executar fluxo de teste manual completo do `quickstart.md`: criar run → aguardar conclusão → acessar `/checkup/history` → verificar lista → abrir relatório → converter artefatos → verificar `artifactCount` atualizado → verificar totais do Command Center → testar com org diferente (zero vazamento). **Validação de SC-002**: usando dataset de pelo menos 100 runs de teste na organização, medir que `GET /api/checkup/runs` responde em menos de 2 segundos (usar `curl -o /dev/null -s -w "%{time_total}\n"` ou equivalente); documentar o tempo medido no run report.
- [ ] T037 Verificar que: (a) nenhum dos endpoints novos (`GET /api/checkup/runs`, `GET /api/checkup/runs/summary`) faz chamada ao provedor de IA; (b) nenhum texto de UI novo está em en/es; (c) os estados de erro da lista e do Command Center usam cópia pt-BR consistente com botão "Tentar novamente" em ambos os componentes.
- [ ] T038 Verificar que os três endpoints existentes (`POST /estimate`, `POST /run`, `GET /runs/{aiRunId}`) não foram alterados e continuam passando nos testes
- [ ] T039 Produzir run report com: arquivos alterados/criados, funcionalidades implementadas, regras de negócio preservadas, testes adicionados, comandos de validação executados, limitações conhecidas, atualizações de roadmap/status e mensagem de commit sugerida

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Sem dependências — iniciar imediatamente
- **Phase 2 (Foundational)**: Depende do Phase 1 — **bloqueia todas as user stories**
- **Phase 3 (US1)**: Depende do Phase 2 — nenhuma dependência de outras stories
- **Phase 4 (US2)**: Depende do Phase 3 (US1 deve estar funcional para testar navegação ao relatório)
- **Phase 5 (US3)**: Depende do Phase 2 (T013 já calcula `artifactCount`) — pode rodar em paralelo com US2
- **Phase 6 (US4)**: Depende do Phase 2; integração final em T032 depende do Phase 3 (T018)
- **Phase 7 (Polish)**: Depende de todas as user stories desejadas estarem completas

### User Story Dependencies (dentro de cada fase)

```
T001 → T002, T003 (podem ser paralelos após T001)
T004 → T005, T006, T007, T008 (podem ser paralelos após T004)
T005 + T006 + T007 → T013 → T014
T008 → T015 → T016 → T017 → T018
T017 → T019 (independente)
T013 + T028 → T029 (summary endpoint após ambos os service methods)
T030 → T031 → T032 (depende de T018 também)
```

### Parallel Opportunities

- T002, T003: paralelo entre si após T001
- T005, T006, T007, T008: paralelo entre si após T004
- T009, T010, T011, T012: todos os testes de US1 em paralelo
- T020, T021: testes de US2 em paralelo
- T026, T027: testes de US4 em paralelo
- T033, T034, T035: validações finais em paralelo
- **Com dois desenvolvedores**: US3 (T024, T025) pode rodar em paralelo com US2 (T020–T023) após Phase 2

---

## Parallel Example: User Story 1

```bash
# Lançar todos os testes de US1 juntos:
T009 → "Integration test: GET /api/checkup/runs lista correta"
T010 → "Integration test: GET /api/checkup/runs sem JWT → 401"
T011 → "Integration test: GET /api/checkup/runs sem X-Organization-Id → 403"
T012 → "Integration test: isolamento de org"

# Lançar modelos/tipos em paralelo:
T004 → "Records Java: CheckupRunListItem, CheckupRunsPage, CheckupRunsSummary"
T008 → "Tipos TypeScript: CheckupRunListItem, CheckupRunsPage, CheckupRunsSummary"

# Lançar repository methods em paralelo após T004:
T005 → "AiRunRepository.findByOrganizationAndFeature"
T006 → "AiRunRepository.countByOrganizationAndFeature"
T007 → "WorkspaceArtifactRepository.countBySourceAiRunId"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (CRÍTICO — bloqueia tudo)
3. Completar Phase 3: US1 (lista de histórico)
4. Completar Phase 4: US2 (reabrir relatório — consolidação de US1)
5. **PARAR e VALIDAR**: testar fluxo completo manualmente
6. Deploy/demo se pronto

### Incremental Delivery

1. Setup + Foundational → base pronta
2. US1 + US2 → MVP funcional: usuário localiza e reabre qualquer Check-up anterior
3. US3 → adiciona contagem de artefatos na lista
4. US4 → adiciona Command Center com totais
5. Polish → qualidade final e run report

### Parallel Team Strategy

Com dois desenvolvedores após Phase 2:

- Dev A: Phase 3 (US1) + Phase 4 (US2) — foco no fluxo de lista e navegação
- Dev B: Phase 6 (US4) backend (T028, T029) — foco no endpoint de summary

---

## Notes

- [P] = arquivos diferentes, sem dependências incompletas — pode executar em paralelo
- [Story] mapeia cada task para a user story correspondente para rastreabilidade
- Não commitar automaticamente — o desenvolvedor commita manualmente
- Parar em cada checkpoint para validar a story de forma independente
- Nenhuma chamada ao provedor de IA neste bloco — nenhum mock de AI necessário
- A rota `GET /api/checkup/runs/summary` DEVE ser mapeada antes de `GET /api/checkup/runs/{aiRunId}` no controller para evitar que Spring interprete "summary" como um aiRunId
- `source_ai_run_id` em `workspace_artifacts` é pré-requisito — verificar T001 antes de T007 e T013
