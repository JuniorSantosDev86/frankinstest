# Tasks: AI Test Design Assistance

> Historical SDD artifact. This file records the original Bloco 09A/09B task generation and interim execution notes. It is not the current product status after Bloco 09C. Current AI foundation status, cleanup decisions, and validation results are tracked in `specs/002-ai-foundation-cleanup/`, `docs/CURRENT_STATUS.md`, `docs/API_DESIGN.md`, and `docs/ARCHITECTURE.md`.

**Input**: Design documents from `/specs/001-ai-test-design/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ai-test-design.openapi.yaml, quickstart.md

**Tests**: Required by the FrankInTest constitution and this feature spec. Backend business rules require unit tests. Backend API, persistence, permission, credit, and audit boundaries require integration tests when applicable. Frontend critical flows require tests. AI provider calls MUST be mocked in automated tests.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files or has no dependency on incomplete tasks.
- **[Story]**: User story label for story phases only.
- Every task includes exact file paths.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Align project configuration, contracts, and documentation surfaces before feature work.

- [ ] T001 Update backend Java target to Java 21-compatible project rules in `services/api/pom.xml`
- [ ] T002 [P] Add AI Test Design contract reference to `docs/API_DESIGN.md`
- [ ] T003 [P] Add AI run, credit transaction, draft artifact, and audit model updates to `docs/DATA_MODEL.md`
- [ ] T004 [P] Document backend-only AI environment variables and mock-provider defaults in `README.md`
- [ ] T005 [P] Reconcile existing frontend AI client route names with `specs/001-ai-test-design/contracts/ai-test-design.openapi.yaml` in `apps/web/src/lib/ai-assistance/aiAssistanceClient.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core backend foundations that MUST be complete before user stories can be implemented safely.

**CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T006 Extend AI run, credit, test scenario, test case, and audit tables in `services/api/src/main/resources/db/schema.sql`
- [ ] T007 [P] Create AI run domain records and enums in `services/api/src/main/java/com/frankintest/api/airuns/AiRunModels.java`
- [ ] T008 [P] Create credit domain records and enums in `services/api/src/main/java/com/frankintest/api/credits/CreditModels.java`
- [ ] T009 [P] Create test design artifact records for backend persistence in `services/api/src/main/java/com/frankintest/api/testdesign/TestDesignModels.java`
- [ ] T010 [P] Create audit event record and service interface in `services/api/src/main/java/com/frankintest/api/audit/AuditService.java`
- [ ] T011 Implement AI run repository using JDBC in `services/api/src/main/java/com/frankintest/api/airuns/AiRunRepository.java`
- [ ] T012 Implement credit balance and transaction repository using JDBC in `services/api/src/main/java/com/frankintest/api/credits/CreditRepository.java`
- [ ] T013 Implement test scenario and test case repository using JDBC in `services/api/src/main/java/com/frankintest/api/testdesign/TestDesignRepository.java`
- [ ] T014 Implement audit logging repository using JDBC in `services/api/src/main/java/com/frankintest/api/audit/JdbcAuditService.java`
- [ ] T015 Implement organization/project access validation foundation in `services/api/src/main/java/com/frankintest/api/system/WorkspaceAccessService.java`
- [ ] T016 Refactor existing AI provider classes into provider package boundaries in `services/api/src/main/java/com/frankintest/api/ai/provider/`
- [ ] T017 Refactor existing AI orchestration entry point into orchestration package in `services/api/src/main/java/com/frankintest/api/ai/orchestration/AiTestDesignOrchestrationService.java`
- [ ] T018 Implement structured provider output parser and validator in `services/api/src/main/java/com/frankintest/api/ai/orchestration/AiGeneratedArtifactParser.java`
- [ ] T019 Implement shared API error response model in `services/api/src/main/java/com/frankintest/api/system/ApiErrorResponse.java`
- [ ] T020 [P] Add backend unit tests for AI output parser validation in `services/api/src/test/java/com/frankintest/api/ai/orchestration/AiGeneratedArtifactParserTest.java`
- [ ] T021 [P] Add backend unit tests for credit reserve/capture/release rules in `services/api/src/test/java/com/frankintest/api/credits/CreditServiceTest.java`

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Estimar e gerar cenários de teste a partir de uma regra de negócio (Priority: P1) MVP

**Goal**: User can request a credit estimate and generate draft AI-assisted test scenarios from an existing business rule.

**Independent Test**: Use a business rule in an accessible project, request estimate, confirm generation, and verify generated scenarios are persisted as draft AI-assisted artifacts linked to the source rule and AI run.

### Tests for User Story 1

- [ ] T022 [P] [US1] Add backend service test for estimating scenario generation credits in `services/api/src/test/java/com/frankintest/api/ai/orchestration/AiTestDesignOrchestrationServiceTest.java`
- [ ] T023 [P] [US1] Add backend integration test for `POST /api/ai/test-design/estimate` in `services/api/src/test/java/com/frankintest/api/ai/AiTestDesignControllerTest.java`
- [ ] T024 [P] [US1] Add backend integration test for `POST /api/ai/test-design/scenarios` success persistence in `services/api/src/test/java/com/frankintest/api/ai/AiTestDesignControllerTest.java`
- [ ] T025 [P] [US1] Add backend integration test for permission denial and insufficient credits in `services/api/src/test/java/com/frankintest/api/ai/AiTestDesignControllerTest.java`
- [ ] T026 [P] [US1] Add frontend test for estimate-before-generate scenario UX in `apps/web/tests/ai-assistance.test.mjs`
- [ ] T027 [P] [US1] Add frontend test ensuring generated scenarios are labeled as rascunho and assistido por IA in `apps/web/tests/ai-assistance.test.mjs`

### Implementation for User Story 1

- [ ] T028 [US1] Implement credit estimate logic for business-rule scenario generation in `services/api/src/main/java/com/frankintest/api/ai/orchestration/AiTestDesignOrchestrationService.java`
- [ ] T029 [US1] Implement scenario generation orchestration with reserve, run, validate, persist, capture, audit in `services/api/src/main/java/com/frankintest/api/ai/orchestration/AiTestDesignOrchestrationService.java`
- [ ] T030 [US1] Implement scenario generation DTOs in `services/api/src/main/java/com/frankintest/api/ai/orchestration/AiTestDesignDtos.java`
- [ ] T031 [US1] Implement AI Test Design controller endpoints for estimate and scenarios in `services/api/src/main/java/com/frankintest/api/ai/AiTestDesignController.java`
- [ ] T032 [US1] Update mock provider to return structured scenario payloads in `services/api/src/main/java/com/frankintest/api/ai/provider/MockAiProvider.java`
- [ ] T033 [US1] Update Anthropic provider adapter to request structured scenario output without exposing provider details in `services/api/src/main/java/com/frankintest/api/ai/provider/AnthropicAiProvider.java`
- [ ] T034 [US1] Persist generated draft scenarios with traceability in `services/api/src/main/java/com/frankintest/api/testdesign/TestDesignRepository.java`
- [ ] T035 [US1] Update frontend AI assistance types for estimate and scenario result contracts in `apps/web/src/lib/ai-assistance/types.ts`
- [ ] T036 [US1] Update frontend AI assistance client to call `/api/ai/test-design/estimate` and `/api/ai/test-design/scenarios` in `apps/web/src/lib/ai-assistance/aiAssistanceClient.ts`
- [ ] T037 [US1] Update AI generation modal to show pt-BR estimate, confirmation, loading, success, and error states in `apps/web/src/app/components/AiGenerationModal.tsx`
- [ ] T038 [US1] Integrate scenario generation into the business-rule-to-scenario workflow in `apps/web/src/app/components/TestScenarioSection.tsx`
- [ ] T039 [US1] Ensure generated scenario cards show rascunho and assistido por IA labels in `apps/web/src/app/components/TestScenarioSection.tsx`

**Checkpoint**: User Story 1 is independently functional and testable as the MVP.

---

## Phase 4: User Story 2 - Gerar casos de teste a partir de um cenário existente (Priority: P2)

**Goal**: User can request a credit estimate and generate draft AI-assisted test cases from an existing scenario when safe structured persistence is available.

**Independent Test**: Select a scenario in an accessible project, request estimate, confirm generation, and verify generated test cases are persisted as draft AI-assisted artifacts linked to the source scenario.

### Tests for User Story 2

- [ ] T040 [P] [US2] Add backend service test for estimating test-case generation credits in `services/api/src/test/java/com/frankintest/api/ai/orchestration/AiTestDesignOrchestrationServiceTest.java`
- [ ] T041 [P] [US2] Add backend integration test for `POST /api/ai/test-design/test-cases` success persistence in `services/api/src/test/java/com/frankintest/api/ai/AiTestDesignControllerTest.java`
- [ ] T042 [P] [US2] Add backend integration test for invalid source scenario and malformed provider output in `services/api/src/test/java/com/frankintest/api/ai/AiTestDesignControllerTest.java`
- [ ] T043 [P] [US2] Add frontend test for test-case estimate and generation UX in `apps/web/tests/ai-assistance.test.mjs`
- [ ] T044 [P] [US2] Add frontend test ensuring generated test cases are labeled as rascunho and assistido por IA in `apps/web/tests/ai-assistance.test.mjs`

### Implementation for User Story 2

- [ ] T045 [US2] Implement credit estimate logic for scenario-to-test-case generation in `services/api/src/main/java/com/frankintest/api/ai/orchestration/AiTestDesignOrchestrationService.java`
- [ ] T046 [US2] Implement test-case generation orchestration with reserve, run, validate, persist, capture, audit in `services/api/src/main/java/com/frankintest/api/ai/orchestration/AiTestDesignOrchestrationService.java`
- [ ] T047 [US2] Extend AI Test Design DTOs for generated test cases in `services/api/src/main/java/com/frankintest/api/ai/orchestration/AiTestDesignDtos.java`
- [ ] T048 [US2] Add test-case generation endpoint in `services/api/src/main/java/com/frankintest/api/ai/AiTestDesignController.java`
- [ ] T049 [US2] Update mock provider to return structured test-case payloads in `services/api/src/main/java/com/frankintest/api/ai/provider/MockAiProvider.java`
- [ ] T050 [US2] Update Anthropic provider adapter to request structured test-case output in `services/api/src/main/java/com/frankintest/api/ai/provider/AnthropicAiProvider.java`
- [ ] T051 [US2] Persist generated draft test cases with traceability in `services/api/src/main/java/com/frankintest/api/testdesign/TestDesignRepository.java`
- [ ] T052 [US2] Update frontend AI assistance types and client for test-case generation in `apps/web/src/lib/ai-assistance/types.ts`
- [ ] T053 [US2] Update frontend AI assistance client for `/api/ai/test-design/test-cases` in `apps/web/src/lib/ai-assistance/aiAssistanceClient.ts`
- [ ] T054 [US2] Integrate test-case generation into the scenario-to-test-case workflow in `apps/web/src/app/components/TestCaseSection.tsx`
- [ ] T055 [US2] Ensure generated test case cards show rascunho and assistido por IA labels in `apps/web/src/app/components/TestCaseSection.tsx`

**Checkpoint**: User Story 2 is independently functional after the foundation and can be demoed without changing User Story 1 behavior.

---

## Phase 5: User Story 3 - Rastrear ciclo de vida, falhas e créditos de runs de IA (Priority: P3)

**Goal**: Platform and workspace stakeholders can trace AI run lifecycle, failures, output references, and fair credit movements.

**Independent Test**: Run success and controlled failure cases, then verify AI run records, credit transactions, status transitions, audit events, and absence of final credit consumption on provider/platform failure.

### Tests for User Story 3

- [ ] T056 [P] [US3] Add backend unit test for AI run status transitions in `services/api/src/test/java/com/frankintest/api/airuns/AiRunLifecycleTest.java`
- [ ] T057 [P] [US3] Add backend integration test for provider failure releasing reserved credits in `services/api/src/test/java/com/frankintest/api/ai/AiRunFailureIntegrationTest.java`
- [ ] T058 [P] [US3] Add backend integration test for output-validation failure releasing reserved credits in `services/api/src/test/java/com/frankintest/api/ai/AiRunFailureIntegrationTest.java`
- [ ] T059 [P] [US3] Add backend integration test for `GET /api/ai/runs/{aiRunId}` safe metadata in `services/api/src/test/java/com/frankintest/api/ai/AiRunControllerTest.java`
- [ ] T060 [P] [US3] Add backend integration test for audit log events in `services/api/src/test/java/com/frankintest/api/audit/AuditLogIntegrationTest.java`
- [ ] T061 [P] [US3] Add frontend test for generation failure message and non-consumed credit note in `apps/web/tests/ai-assistance.test.mjs`

### Implementation for User Story 3

- [ ] T062 [US3] Implement AI run lifecycle service in `services/api/src/main/java/com/frankintest/api/airuns/AiRunService.java`
- [ ] T063 [US3] Implement credit reserve, capture, release, and balance checks in `services/api/src/main/java/com/frankintest/api/credits/CreditService.java`
- [ ] T064 [US3] Implement audit event writes for AI run and credit events in `services/api/src/main/java/com/frankintest/api/audit/JdbcAuditService.java`
- [ ] T065 [US3] Add safe run status endpoint in `services/api/src/main/java/com/frankintest/api/ai/AiRunController.java`
- [ ] T066 [US3] Add provider and output-validation failure mapping to API errors in `services/api/src/main/java/com/frankintest/api/ai/AiTestDesignController.java`
- [ ] T067 [US3] Add frontend client support for AI run status lookup in `apps/web/src/lib/ai-assistance/aiAssistanceClient.ts`
- [ ] T068 [US3] Add pt-BR failure and credit release messaging to `apps/web/src/app/components/AiGenerationModal.tsx`

**Checkpoint**: User Story 3 provides traceability and fair credit handling for success and controlled failures.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, validation, cleanup, and release readiness for the full block.

- [ ] T069 [P] Update `docs/CURRENT_STATUS.md` with Bloco 09A + 09B implementation status and validation notes
- [ ] T070 [P] Update `docs/ROADMAP.md` to mark Bloco 09A + 09B according to actual completion state
- [ ] T071 [P] Update `docs/AI_USAGE_POLICY.md` with the reserve/capture/release lifecycle chosen for this block
- [ ] T072 [P] Update `docs/QA_STRATEGY.md` with AI Test Design mock-provider and credit lifecycle test expectations
- [ ] T073 Review frontend code for absence of provider secrets and provider-direct calls in `apps/web/src/lib/ai-assistance/aiAssistanceClient.ts`
- [ ] T074 Review all new UI copy for pt-BR-only compliance in `apps/web/src/app/components/AiGenerationModal.tsx`
- [ ] T075 Run backend validation command documented in `specs/001-ai-test-design/quickstart.md` against `services/api/pom.xml`
- [ ] T076 Run frontend lint, test, and build commands documented in `specs/001-ai-test-design/quickstart.md` against `apps/web/package.json`
- [ ] T077 Produce final run report for Bloco 09A + 09B in `specs/001-ai-test-design/tasks.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion; blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational; MVP scope.
- **User Story 2 (Phase 4)**: Depends on Foundational and benefits from US1 provider/orchestration patterns, but remains independently testable.
- **User Story 3 (Phase 5)**: Depends on Foundational; can proceed in parallel with US1/US2 after shared lifecycle services exist, but should validate behavior across generated artifacts.
- **Polish (Phase 6)**: Depends on selected user stories being complete.

### User Story Dependencies

- **US1 (P1)**: First deliverable and suggested MVP.
- **US2 (P2)**: Can start after Phase 2, but should reuse US1 DTO/provider/orchestration conventions once available.
- **US3 (P3)**: Can start after Phase 2; deepest validation depends on at least one successful and one failing generation path.

### Within Each User Story

- Tests first for protected behavior and business rules.
- Models and DTOs before services.
- Services before controllers.
- Backend API before frontend integration.
- UI states before final visual labels and polish.

## Parallel Opportunities

- Setup documentation tasks T002-T004 can run in parallel with route reconciliation T005.
- Foundational model/interface tasks T007-T010 can run in parallel.
- Foundational tests T020-T021 can run in parallel with repositories T011-T014 once models exist.
- US1 tests T022-T027 can be split across backend and frontend.
- US2 tests T040-T044 can be split across backend and frontend.
- US3 tests T056-T061 can be split across lifecycle, failure, audit, and frontend surfaces.
- Polish documentation tasks T069-T072 can run in parallel.

## Parallel Example: User Story 1

```text
Task: "T022 [US1] Add backend service test for estimating scenario generation credits in services/api/src/test/java/com/frankintest/api/ai/orchestration/AiTestDesignOrchestrationServiceTest.java"
Task: "T023 [US1] Add backend integration test for POST /api/ai/test-design/estimate in services/api/src/test/java/com/frankintest/api/ai/AiTestDesignControllerTest.java"
Task: "T026 [US1] Add frontend test for estimate-before-generate scenario UX in apps/web/tests/ai-assistance.test.mjs"
Task: "T027 [US1] Add frontend test ensuring generated scenarios are labeled as rascunho and assistido por IA in apps/web/tests/ai-assistance.test.mjs"
```

## Parallel Example: User Story 2

```text
Task: "T040 [US2] Add backend service test for estimating test-case generation credits in services/api/src/test/java/com/frankintest/api/ai/orchestration/AiTestDesignOrchestrationServiceTest.java"
Task: "T041 [US2] Add backend integration test for POST /api/ai/test-design/test-cases success persistence in services/api/src/test/java/com/frankintest/api/ai/AiTestDesignControllerTest.java"
Task: "T043 [US2] Add frontend test for test-case estimate and generation UX in apps/web/tests/ai-assistance.test.mjs"
```

## Parallel Example: User Story 3

```text
Task: "T056 [US3] Add backend unit test for AI run status transitions in services/api/src/test/java/com/frankintest/api/airuns/AiRunLifecycleTest.java"
Task: "T057 [US3] Add backend integration test for provider failure releasing reserved credits in services/api/src/test/java/com/frankintest/api/ai/AiRunFailureIntegrationTest.java"
Task: "T060 [US3] Add backend integration test for audit log events in services/api/src/test/java/com/frankintest/api/audit/AuditLogIntegrationTest.java"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 setup.
2. Complete Phase 2 foundation.
3. Complete Phase 3 User Story 1.
4. Stop and validate: backend tests, frontend lint/test/build, and manual QA for estimate-before-generation.
5. Demo scenario generation from a business rule as draft AI-assisted artifacts.

### Incremental Delivery

1. Foundation ready.
2. Add US1 scenario generation and validate independently.
3. Add US2 test-case generation and validate independently.
4. Add US3 traceability/failure/credit hardening and validate success/failure cases.
5. Complete docs and run report.

### Notes

- Do not implement billing purchase flow.
- Do not add streaming.
- Do not add Check-up.
- Do not add workers or microservices.
- Do not expose Anthropic or any provider key to `apps/web`.

---

## Run Report — Estado da Implementação (2026-05-15)

### Status: Implementação parcial — testes backend com falhas

### Arquivos criados ou alterados

**Backend — `services/api`**
- `pom.xml` — Java version corrigida de 25 → 21
- `src/main/resources/db/schema.sql` — Extendido com `ai_runs` (campos completos), `credit_balances`, `credit_transactions` (atualizado), `test_scenarios`, `test_cases`, `audit_log`
- `src/main/java/.../airuns/AiRunModels.java` — Enums e records de domínio
- `src/main/java/.../airuns/AiRunRepository.java` — JDBC repository
- `src/main/java/.../airuns/AiRunService.java` — Service de lifecycle
- `src/main/java/.../credits/CreditModels.java` — Enums e records de domínio
- `src/main/java/.../credits/CreditRepository.java` — JDBC reserve/capture/release
- `src/main/java/.../credits/CreditService.java` — Service de créditos
- `src/main/java/.../testdesign/TestDesignModels.java` — Records de TestScenario, TestCase, GeneratedQaArtifact
- `src/main/java/.../testdesign/TestDesignRepository.java` — JDBC insert/find
- `src/main/java/.../audit/AuditService.java` — Interface + AuditEvent record
- `src/main/java/.../audit/JdbcAuditService.java` — Implementação JDBC
- `src/main/java/.../system/ApiErrorResponse.java` — Record de erro padronizado
- `src/main/java/.../system/WorkspaceAccessService.java` — Fundação de validação de acesso
- `src/main/java/.../ai/provider/AiProviderPort.java` — Interface nova
- `src/main/java/.../ai/provider/MockAiProvider.java` — Mock estruturado com output JSON
- `src/main/java/.../ai/provider/AnthropicAiProvider.java` — Adapter no novo package
- `src/main/java/.../ai/provider/AiProviderSelector.java` — Seletor de provider
- `src/main/java/.../ai/orchestration/AiTestDesignDtos.java` — DTOs de request/response
- `src/main/java/.../ai/orchestration/AiGeneratedArtifactParser.java` — Parser de JSON do provider
- `src/main/java/.../ai/orchestration/AiTestDesignOrchestrationService.java` — Orquestração completa (estimate, generateScenarios, generateTestCases)
- `src/main/java/.../ai/AiTestDesignController.java` — Endpoints `/api/ai/test-design/*`
- `src/main/java/.../ai/AiRunStatusController.java` — Endpoint `GET /api/ai/runs/{id}`
- `src/test/java/.../ai/orchestration/AiGeneratedArtifactParserTest.java` — 9 testes ✅ passando
- `src/test/java/.../ai/orchestration/AiTestDesignOrchestrationServiceTest.java` — 8 testes (6 ✅, 2 ❌ falha no generateTestCases)
- `src/test/java/.../ai/AiTestDesignControllerTest.java` — 8 testes (7 ✅, 1 ❌)
- `src/test/java/.../ai/AiRunFailureIntegrationTest.java` — 4 testes (1 ✅, 3 ❌)
- `src/test/java/.../airuns/AiRunLifecycleTest.java` — 5 testes ✅ todos passando
- `src/test/java/.../credits/CreditServiceTest.java` — 5 testes ❌ todos falhando
- `src/test/java/.../audit/AuditLogIntegrationTest.java` — 2 testes ❌ falhando

**Frontend — `apps/web`**
- `src/lib/ai-assistance/types.ts` — Tipos alinhados ao contrato OpenAPI
- `src/lib/ai-assistance/aiAssistanceClient.ts` — Rotas corrigidas + mock helpers exportados
- `src/app/components/AiGenerationModal.tsx` — Modal refatorado: artifacts[], labels rascunho/assistido por IA, estado de erro com nota de créditos não consumidos
- `src/app/components/TestScenarioSection.tsx` — Integrado com novo onAccept(artifacts[]), badges rascunho/assistido por IA
- `src/app/components/TestCaseSection.tsx` — Integrado com AiGenerationModal, handler, badges
- `tests/ai-assistance.test.mjs` — 143 testes ✅ todos passando

**Documentação**
- `docs/API_DESIGN.md` — Rotas do Bloco 09 documentadas
- `docs/DATA_MODEL.md` — AiRun, CreditTransaction, CreditBalance, TestScenario, TestCase atualizados
- `README.md` — Variáveis de ambiente do backend documentadas

### Testes — Resultado atual

| Conjunto | Estado |
|---|---|
| Frontend (npm test) | ✅ 143/143 passando |
| `AiGeneratedArtifactParserTest` | ✅ 9/9 passando |
| `AiRunLifecycleTest` | ✅ 5/5 passando |
| `AiTestDesignOrchestrationServiceTest` | ⚠️ 6/8 — generateTestCases falha (502) |
| `AiTestDesignControllerTest` | ⚠️ 7/8 — generateTestCases falha (502) |
| `AiRunFailureIntegrationTest` | ⚠️ 1/4 — generateScenarios retorna 502 |
| `CreditServiceTest` | ❌ 0/5 — falha de contexto/H2 |
| `AuditLogIntegrationTest` | ❌ 0/2 — dependente da geração |

### Causa das falhas backend

Os testes de integração que chamam `POST /api/ai/test-design/scenarios` e `/test-cases` recebem 502 em vez de 201. A causa provável é o `MockAiProvider` (novo, no package `provider/`) retornando JSON com `"scenarios"` mas o parser `AiGeneratedArtifactParser` ou o `AiProviderSelector` não estando corretamente injetado/selecionado. Os testes do `CreditRepository` falham provavelmente por incompatibilidade com o H2 no modo PostgreSQL para as operações de UPDATE de saldo.

### O que NÃO foi tocado

- Bloco de billing/compra de créditos
- Workers ou microserviços
- Check-up flow
- Streaming
- Chaves de provider no frontend
- Textos de UI em idiomas além de pt-BR
- Testes existentes não relacionados ao bloco (todos continuam passando)

### Próximo passo sugerido

Antes de prosseguir com as fases 5 e 6 (US3 + polish), resolver as falhas de backend:
1. Verificar se `AiProviderSelector` injeta `MockAiProvider` corretamente no perfil `test` (mock-enabled=true)
2. Ajustar `CreditRepository` para compatibilidade H2 (possível problema com UPDATE sem WHERE que não retorna linhas)
3. Reexecutar `./mvnw test` e confirmar verde antes de continuar
