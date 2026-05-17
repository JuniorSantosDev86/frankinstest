# Tasks: FrankInTest Check-up MVP

**Input**: Design documents from `specs/004-checkup-mvp/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅, quickstart.md ✅

**Tests**: Obrigatórios por constituição — regras de negócio de crédito e ciclo de AI run exigem unit tests; fronteiras de API, persistência e auditoria exigem integration tests; fluxos críticos do frontend exigem component tests. Provider de IA SEMPRE mockado nos testes.

**Organization**: Tarefas organizadas por user story para entrega independente e incremental.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências de tarefas incompletas)
- **[Story]**: User story à qual a tarefa pertence (US1–US4)

## Path Conventions

- **Frontend**: `apps/web/src/`, `apps/web/tests/`
- **Backend**: `services/api/src/main/java/com/frankintest/api/`, `services/api/src/test/java/com/frankintest/api/`
- **Migrations**: `services/api/src/main/resources/db/migration/`

---

## Phase 1: Setup (Infraestrutura Compartilhada)

**Purpose**: Criar a estrutura de diretórios e arquivos base do módulo `checkup` antes de qualquer implementação.

- [x] T001 Criar estrutura de diretórios do módulo backend: `services/api/src/main/java/com/frankintest/api/checkup/` e `services/api/src/test/java/com/frankintest/api/checkup/`
- [x] T002 [P] Criar estrutura de diretórios do frontend: `apps/web/src/app/checkup/`, `apps/web/src/app/checkup/[runId]/`, `apps/web/src/lib/checkup/`
- [x] T003 [P] Criar migration SQL: `services/api/src/main/resources/db/migration/V004__checkup_reports.sql` com a tabela `checkup_reports` (JSONB columns conforme data-model.md) e os índices `idx_checkup_reports_org (organization_id)` e `idx_checkup_reports_ai_run (ai_run_id)`

---

## Phase 2: Foundational (Pré-requisitos Bloqueantes)

**Purpose**: Infraestrutura core do módulo `checkup` que bloqueia todas as user stories. DEVE estar completa antes de qualquer user story começar.

**⚠️ CRÍTICO**: Nenhuma user story pode ser iniciada até esta fase estar completa.

- [x] T004 Criar `CheckupModels.java` em `services/api/src/main/java/com/frankintest/api/checkup/` com todos os enums (`TargetType`, `CheckupDepth`, `OutputMode`, `ReportStatus`, `Severity`, `ScenarioType`, `Priority`), records de request/response (`CheckupRequest`, `CheckupEstimateResponse`, `CheckupRunResponse`, `CheckupRunStatusResponse`), e records de items (`FindingItem`, `ScenarioItem`, `TestCaseItem`, `ActionItem`)
- [x] T005 Estender `AiRunModels.java` em `services/api/src/main/java/com/frankintest/api/airuns/AiRunModels.java`: adicionar `checkup` ao enum `AiRunFeature`, `checkup_report` ao enum `OutputArtifactType`, e o campo `rawOutput: String` ao record `AiRun` (preserva output bruto da IA para auditoria; nullable — preenchido apenas em runs de Check-up)
- [x] T006 Criar `CheckupRepository.java` em `services/api/src/main/java/com/frankintest/api/checkup/` com Spring JDBC: métodos `save(CheckupReport)`, `findByAiRunId(String aiRunId)`, `findById(String id)` — serialização/deserialização das colunas JSONB via Jackson
- [x] T007 [P] Criar `checkupTypes.ts` em `apps/web/src/lib/checkup/` com todos os tipos TypeScript do domínio Check-up (espelha `CheckupModels.java`)
- [x] T008 [P] Criar `checkupApi.ts` em `apps/web/src/lib/checkup/` com funções `estimateCheckup(request)`, `runCheckup(request)`, `getCheckupRun(aiRunId)` — chamadas exclusivas ao backend; sem importações de SDKs de providers de IA (anthropic, openai, etc.); sem API keys no módulo

**Checkpoint**: Módulo foundational pronto. User stories podem ser implementadas em paralelo.

---

## Phase 3: User Story 1 — Submissão de Contexto e Estimativa de Créditos (Priority: P1) 🎯 MVP

**Goal**: Usuário preenche formulário, confirma autorização, e recebe estimativa de créditos antes de qualquer execução de IA.

**Independent Test**: Acessar `/checkup`, preencher o formulário completo com `userAuthorizationConfirmed: true`, clicar em "Estimar créditos" — sistema deve retornar estimativa sem iniciar nenhum AI run.

### Tests para User Story 1 ⚠️

- [x] T009 [P] [US1] Unit test `CheckupCreditEstimatorTest` em `services/api/src/test/java/com/frankintest/api/checkup/`: validar cálculo de estimativa para todas as combinações de `depth` × `outputMode` (6 casos) + rejeição com `userAuthorizationConfirmed: false` (HTTP 422) + rejeição com campos obrigatórios ausentes (HTTP 400)
- [x] T010 [P] [US1] Integration test `CheckupEstimateControllerTest` em `services/api/src/test/java/com/frankintest/api/checkup/`: `POST /api/checkup/estimate` com payload válido retorna 200 com `estimatedCredits` e `breakdown`; sem autorização retorna 422; campos ausentes retorna 400

### Implementation para User Story 1

- [x] T011 [US1] Criar `CheckupCreditEstimator.java` em `services/api/src/main/java/com/frankintest/api/checkup/` com lógica de cálculo: `base(depth) × multiplier(outputMode)` conforme tabela do data-model.md
- [x] T012 [US1] Criar `CheckupService.java` em `services/api/src/main/java/com/frankintest/api/checkup/`: método `estimate(CheckupRequest)` — valida input (incluindo `userAuthorizationConfirmed`), calcula e retorna `CheckupEstimateResponse`
- [x] T013 [US1] Criar `CheckupController.java` em `services/api/src/main/java/com/frankintest/api/checkup/`: endpoint `POST /api/checkup/estimate` thin controller que delega ao `CheckupService`; validação de input via Bean Validation
- [x] T014 [P] [US1] Criar componente de formulário `apps/web/src/app/checkup/page.tsx`: campos obrigatórios (`targetType`, `targetValue`, `context`, `goal`, `depth`, `outputMode`), checkbox de autorização obrigatório, campos opcionais colapsáveis (`targetAudience`, `criticalFlows`, `knownRisks`, `technologies`), botão "Estimar créditos" habilitado apenas quando todos os campos obrigatórios + checkbox preenchidos — todos os textos em pt-BR
- [x] T015 [US1] Conectar formulário ao `checkupApi.ts`: ao clicar "Estimar créditos", chamar `estimateCheckup(request)` e exibir tela de confirmação com estimativa e breakdown — sem chamar provider de IA diretamente

**Checkpoint**: User Story 1 funcional — formulário exibe estimativa antes de qualquer execução.

---

## Phase 4: User Story 2 — Execução do Check-up e Geração do Relatório (Priority: P1) 🎯 MVP

**Goal**: Usuário confirma execução, sistema processa via IA, persiste relatório como DRAFT, frontend exibe relatório estruturado com badge "Rascunho · Assistido por IA".

**Independent Test**: Com `MockAiProvider` ativo, executar `POST /api/checkup/run` com payload válido — sistema deve criar AI run, reservar créditos, chamar provider mock, parsear output, persistir `CheckupReport` com status `DRAFT` e todas as seções, capturar créditos. Frontend deve exibir polling → relatório completo.

### Tests para User Story 2 ⚠️

- [x] T016 [P] [US2] Unit test `CheckupReportParserTest` em `services/api/src/test/java/com/frankintest/api/checkup/`: parse de output JSON válido completo; parse com uma seção inválida (fallback para lista vazia nessa seção, demais seções preservadas); parse com JSON totalmente inválido (todas as seções ficam vazias, `rawAiOutput` preservado)
- [x] T017 [P] [US2] Unit test `CheckupPromptBuilderTest` em `services/api/src/test/java/com/frankintest/api/checkup/`: prompt gerado contém todos os campos obrigatórios do `CheckupRequest`; prompt instrui output em JSON estruturado com as seções do relatório; prompt não inclui instrução que afirme garantia de ausência de bugs
- [x] T018 [P] [US2] Integration test `CheckupRunControllerTest` em `services/api/src/test/java/com/frankintest/api/checkup/` com `MockAiProvider`: fluxo completo PENDING→RUNNING→COMPLETED; créditos reservados antes da chamada ao provider; créditos capturados após COMPLETED; `CheckupReport` persistido com `status=DRAFT`; resposta HTTP 202 com `aiRunId`, `reportId`, `status`
- [x] T019 [P] [US2] Integration test `CheckupRunStatusTest` em `services/api/src/test/java/com/frankintest/api/checkup/`: `GET /api/checkup/runs/{aiRunId}` retorna status RUNNING sem relatório; retorna COMPLETED com relatório completo e `creditsConsumed`; retorna 404 para ID inexistente
- [x] T020 [P] [US2] Frontend component test em `apps/web/tests/`: estado de loading exibe texto "Analisando..."; estado de sucesso renderiza badge "Rascunho · Assistido por IA" e pelo menos uma seção do relatório; `checkupApi.ts` não contém importações de SDKs de providers de IA

### Implementation para User Story 2

- [x] T021 [US2] Criar `CheckupPromptBuilder.java` em `services/api/src/main/java/com/frankintest/api/checkup/`: monta prompt estruturado para `AiProviderPort` com papel de QA Lead, instrução de output JSON com as seções do relatório, contexto do usuário — sem afirmar garantia de ausência de bugs
- [x] T022 [US2] Criar `CheckupReportParser.java` em `services/api/src/main/java/com/frankintest/api/checkup/`: deserializa output da IA para `CheckupReport`; aplica fallback por seção (seção com parse inválido → lista vazia); preserva `rawAiOutput` sempre
- [x] T023 [US2] Estender `CheckupService.java`: método `run(CheckupRequest, organizationId, userId)` — valida input, cria AI run (`reserved`), reserva créditos via `CreditService`, atualiza run para `running`, chama `AiProviderPort` via `CheckupPromptBuilder`, faz parse via `CheckupReportParser`, persiste `CheckupReport` via `CheckupRepository`, captura créditos (`completed`), registra eventos de auditoria em cada etapa
- [x] T024 [US2] Estender `CheckupController.java`: adicionar endpoint `POST /api/checkup/run` e `GET /api/checkup/runs/{aiRunId}` — thin controllers delegando ao `CheckupService`
- [x] T025 [US2] Criar `useCheckupPolling.ts` em `apps/web/src/lib/checkup/`: hook React que faz polling de `getCheckupRun(aiRunId)` a cada 3 segundos com timeout de 5 minutos; retorna `{ status, report, error }`
- [x] T026 [US2] Criar `apps/web/src/app/checkup/[runId]/page.tsx`: estado loading com texto "Analisando... isso pode levar alguns instantes."; estado sucesso com badge "Rascunho · Assistido por IA", seções do relatório (riscos, cenários, casos de teste, próximas ações) com títulos e severidades; créditos consumidos visíveis; botão "Salvar como artefato" desabilitado com tooltip "em breve" — todos os textos em pt-BR
- [x] T027 [US2] Conectar tela de confirmação de estimativa ao fluxo de execução: botão "Executar Check-up" chama `runCheckup(request)`, navega para `/checkup/[aiRunId]` e inicia polling

**Checkpoint**: User Stories 1 + 2 funcionais — fluxo completo de submissão, execução e exibição do relatório.

---

## Phase 5: User Story 3 — Tratamento de Falha sem Perda de Créditos (Priority: P2)

**Goal**: Falha no provider preserva créditos integralmente; usuário recebe mensagem clara em pt-BR com opção de tentar novamente.

**Independent Test**: Injetar falha no `MockAiProvider`, executar `POST /api/checkup/run` — créditos reservados devem ser liberados, AI run marcado como `failed`, frontend exibe mensagem de erro correta.

### Tests para User Story 3 ⚠️

- [x] T028 [P] [US3] Integration test `CheckupCreditFlowTest` em `services/api/src/test/java/com/frankintest/api/checkup/` com `MockAiProvider` configurado para falhar: créditos reservados antes da chamada; créditos liberados após falha (`release` chamado); créditos capturados `= 0`; AI run com status `failed`; `CheckupReport` não criado
- [x] T029 [P] [US3] Integration test `CheckupAuditEventTest` em `services/api/src/test/java/com/frankintest/api/checkup/`: verificar que todos os 6 eventos de auditoria são registrados nos respectivos momentos (CHECK_UP_REQUESTED, CHECK_UP_CREDITS_RESERVED, CHECK_UP_RUNNING, CHECK_UP_COMPLETED ou CHECK_UP_FAILED, CHECK_UP_CREDITS_RELEASED quando aplicável)

### Implementation para User Story 3

- [x] T030 [US3] Implementar tratamento de falha no `CheckupService.java`: catch de exceção do `AiProviderPort`; liberar créditos via `CreditService.release()`; marcar AI run como `failed`; registrar `CHECK_UP_FAILED` e `CHECK_UP_CREDITS_RELEASED` no `AuditService`; não criar `CheckupReport`
- [x] T031 [US3] Implementar estado de erro no `apps/web/src/app/checkup/[runId]/page.tsx`: quando polling retorna status `failed`, exibir mensagem "Não foi possível concluir a análise. Seus créditos foram preservados." em pt-BR; botão "Tentar novamente" que navega de volta ao formulário
- [x] T032 [US3] Implementar tratamento de saldo insuficiente no `CheckupService.java`: verificar `CreditService.hasEnoughCredits()` antes de reservar; retornar HTTP 402 com `required` e `available` sem criar AI run ou chamar provider

**Checkpoint**: Falhas são tratadas corretamente — zero cobranças por análises não concluídas.

---

## Phase 6: User Story 4 — Submissão com Diferentes Tipos de Alvo (Priority: P2)

**Goal**: Formulário aceita todos os `TargetType` definidos; sistema processa sem realizar crawling/scanning da URL.

**Independent Test**: Submeter formulário com cada `targetType` (URL, FEATURE_DESCRIPTION, API_DESCRIPTION, DOCUMENT, MOBILE_FLOW, OTHER) — sistema deve aceitar e processar via mock sem erros. Verificar que nenhuma requisição HTTP é feita ao `targetValue` quando `targetType = URL`.

### Tests para User Story 4 ⚠️

- [x] T033 [P] [US4] Unit test `CheckupTargetTypeValidationTest` em `services/api/src/test/java/com/frankintest/api/checkup/`: cada `TargetType` válido aceito; `targetValue` vazio rejeitado para tipos não-OTHER; nenhum método de requisição HTTP chamado internamente para qualquer `TargetType`
- [x] T034 [P] [US4] Frontend component test em `apps/web/tests/`: seletor de `targetType` renderiza todas as 6 opções; label de cada opção está em pt-BR; campo `targetValue` atualiza placeholder conforme `targetType` selecionado

### Implementation para User Story 4

- [x] T035 [US4] Estender validação no `CheckupService.java`: verificar `targetValue` mínimo por `TargetType`; garantir que nenhuma requisição HTTP é feita ao `targetValue` — analisar apenas contexto textual fornecido pelo usuário
- [x] T036 [US4] Atualizar campo `targetType` no formulário `apps/web/src/app/checkup/page.tsx`: seletor com todas as opções em pt-BR, placeholder dinâmico do campo `targetValue` por tipo (ex: "Cole a URL aqui" / "Descreva a feature aqui")
- [x] T037 [US4] Estender `CheckupPromptBuilder.java`: adaptar instruções do prompt conforme `targetType` (ex: para API_DESCRIPTION incluir foco em cobertura de endpoints, status codes, autenticação)

**Checkpoint**: Todos os tipos de alvo funcionais — formulário aceita e processa corretamente cada `TargetType`.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Segurança, qualidade, validação final e run report.

- [x] T038 [P] Verificar segurança do frontend: `grep -r "ANTHROPIC\|sk-ant\|api_key\|anthropic.com\|api.openai.com" apps/web/src/` deve retornar zero resultados — nenhuma API key ou chamada direta a provider
- [x] T039 [P] Verificar que `userAuthorizationConfirmed: false` retorna HTTP 422 em ambos os endpoints (`/estimate` e `/run`) sem criar AI run ou reservar créditos — adicionar caso de teste se não coberto em T009/T010
- [x] T040 [P] Executar `npm run lint && npm test && npm run build` em `apps/web/` — todos devem passar sem erros
- [x] T041 [P] Executar `./mvnw test` em `services/api/` — todos os testes do módulo `checkup` devem passar com `MockAiProvider`
- [x] T042 Produzir run report completo (arquivos alterados, funcionalidades implementadas, regras de negócio preservadas, testes, comandos de validação, limitações conhecidas, atualizações de roadmap, mensagem de commit sugerida) conforme formato obrigatório do AGENTS.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Sem dependências — pode iniciar imediatamente
- **Phase 2 (Foundational)**: Depende da conclusão da Phase 1 — BLOQUEIA todas as user stories
- **Phase 3 (US1)**: Depende da Phase 2 — pode rodar em paralelo com Phase 4 após Phase 2 concluída
- **Phase 4 (US2)**: Depende da Phase 2 + Phase 3 (fluxo de execução usa tela de confirmação de estimativa)
- **Phase 5 (US3)**: Depende da Phase 4 (tratamento de falha é extensão do fluxo de execução)
- **Phase 6 (US4)**: Depende da Phase 2 — pode rodar em paralelo com Phases 3/4/5
- **Phase 7 (Polish)**: Depende de todas as user stories desejadas estarem completas

### User Story Dependencies

- **US1 (P1)**: Pode iniciar após Phase 2 — sem dependências de outras US
- **US2 (P1)**: Depende de US1 estar funcional (confirmação de estimativa → execução)
- **US3 (P2)**: Depende de US2 (é extensão do tratamento de falha do fluxo de execução)
- **US4 (P2)**: Pode iniciar após Phase 2 — independente de US1/US2/US3

### Within Each User Story

- Testes DEVEM ser escritos antes da implementação (T009/T010 antes de T011–T015, etc.)
- Models/enums (`CheckupModels`) antes de services
- Services antes de controllers
- Backend completo antes de conectar frontend

### Parallel Opportunities

- T001, T002, T003 (Phase 1) — paralelos entre si
- T004, T005, T006, T007, T008 (Phase 2) — T004/T005 sequenciais entre si; T007/T008 paralelos com T004–T006
- T009 e T010 (US1 tests) — paralelos entre si
- T014 (frontend form) — paralelo com T011/T012 (backend)
- T016, T017, T018, T019, T020 (US2 tests) — todos paralelos entre si
- T021, T022 (US2 builders) — paralelos entre si; antes de T023
- T028, T029 (US3 tests) — paralelos entre si
- T033, T034 (US4 tests) — paralelos entre si
- T038–T041 (Polish validações) — todos paralelos entre si

---

## Parallel Example: User Story 2

```bash
# Rodar todos os testes de US2 em paralelo (antes da implementação):
Task T016: CheckupReportParserTest
Task T017: CheckupPromptBuilderTest
Task T018: CheckupRunControllerTest
Task T019: CheckupRunStatusTest
Task T020: Frontend component test

# Rodar builders em paralelo:
Task T021: CheckupPromptBuilder.java
Task T022: CheckupReportParser.java
```

---

## Implementation Strategy

### MVP Mínimo (User Stories 1 + 2 apenas)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (CRÍTICO — bloqueia tudo)
3. Completar Phase 3: US1 (formulário + estimativa)
4. Completar Phase 4: US2 (execução + relatório)
5. **PARAR e VALIDAR**: fluxo completo funcional com MockAiProvider
6. Executar checklist de segurança (T038, T039)
7. Rodar `npm test` + `./mvnw test` (T040, T041)

### Entrega Incremental Completa

1. Setup + Foundational → base pronta
2. US1 → estimativa funcional (demo: usuário vê custo antes de confirmar)
3. US2 → relatório funcional (demo: primeiro relatório gerado por IA)
4. US3 → confiabilidade (falhas não cobram créditos)
5. US4 → amplitude de casos de uso (múltiplos tipos de alvo)
6. Polish → qualidade e run report

---

## Notes

- `[P]` = arquivos diferentes, sem dependências de tarefas incompletas
- `[Story]` mapeia cada tarefa à user story correspondente para rastreabilidade
- Cada user story é independentemente testável após sua phase estar completa
- Provider de IA SEMPRE mockado nos testes — nenhum teste chama provider real
- Não fazer commit automaticamente — o desenvolvedor faz commit manualmente
- `rawAiOutput` é armazenado internamente e nunca retornado nas respostas de API
- Parar em qualquer checkpoint para validar a user story independentemente antes de continuar
