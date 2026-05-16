# Tasks: AI Foundation Cleanup & Spec Alignment

**Input**: Design documents from `/specs/002-ai-foundation-cleanup/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ai-foundation-cleanup.md, quickstart.md

**Tests**: Required by FrankInTest constitution for backend AI orchestration, provider boundaries, credit lifecycle, AI run tracking, audit behavior, protected API behavior, and frontend critical AI flow.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Inspection)

**Purpose**: Establish the current AI surface and protect unrelated work before changing code.

- [x] T001 Generate current AI surface inventory in `specs/002-ai-foundation-cleanup/ai-surface-inventory.md` covering `services/api/src/main/java/com/frankintest/api/ai/`, `services/api/src/test/java/com/frankintest/api/ai/`, `apps/web/src/lib/ai-assistance/`, `docs/`, and `specs/001-ai-test-design/`
- [x] T002 [P] Record current frontend AI endpoint usage in `specs/002-ai-foundation-cleanup/ai-surface-inventory.md` from `apps/web/src/lib/ai-assistance/aiAssistanceClient.ts`
- [x] T003 [P] Record current backend AI test coverage and legacy test dependencies in `specs/002-ai-foundation-cleanup/ai-surface-inventory.md` from `services/api/src/test/java/com/frankintest/api/ai/`
- [x] T004 [P] Record unrelated dirty worktree files in `specs/002-ai-foundation-cleanup/ai-surface-inventory.md` so implementation does not revert `apps/web/next-env.d.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define the canonical target and make task execution unambiguous.

**CRITICAL**: No user story implementation should begin until this phase is complete.

- [x] T005 Confirm `specs/002-ai-foundation-cleanup/spec.md` defines retained legacy endpoints as wrapper-only and defines active AI generation flow as executable production code paths or frontend-consumed endpoints
- [x] T006 Confirm `specs/002-ai-foundation-cleanup/spec.md` documents protected-request behavior for authentication/local mock auth, organization/project access, input schema validation, entitlement non-applicability, and audit expectations
- [x] T007 [P] Document the canonical Java classes and forbidden legacy responsibilities in `specs/002-ai-foundation-cleanup/ai-surface-inventory.md`
- [x] T008 [P] Confirm canonical API contract remains `/api/ai/test-design/estimate`, `/api/ai/test-design/scenarios`, `/api/ai/test-design/test-cases`, and `/api/ai/runs/{aiRunId}` in `specs/002-ai-foundation-cleanup/contracts/ai-foundation-cleanup.md`

**Checkpoint**: Canonical target is documented and implementation can safely modify AI code.

---

## Phase 3: User Story 1 - Consolidar a arquitetura de IA canônica (Priority: P1) MVP

**Goal**: Leave one active backend AI orchestration architecture and remove or adapt duplicate legacy paths.

**Independent Test**: Backend AI generation, run status, credits, audit, parser, provider selector, and failure tests pass while legacy duplicate orchestration is absent or wrapper-only.

### Tests for User Story 1

- [x] T009 [P] [US1] Update legacy endpoint tests to assert wrapper/deprecation behavior, protected-request parity, or remove obsolete expectations in `services/api/src/test/java/com/frankintest/api/ai/AiRunControllerTest.java`
- [x] T010 [P] [US1] Update canonical controller tests for estimate, scenarios, test-cases, malformed/invalid input rejection, organization/project access denial, insufficient credits, provider failure, and malformed output in `services/api/src/test/java/com/frankintest/api/ai/AiTestDesignControllerTest.java`
- [x] T011 [P] [US1] Update orchestration service tests for canonical estimate/generate flows and no duplicate provider path in `services/api/src/test/java/com/frankintest/api/ai/orchestration/AiTestDesignOrchestrationServiceTest.java`
- [x] T012 [P] [US1] Update provider selector/mock provider tests to prove deterministic mock usage for tests in `services/api/src/test/java/com/frankintest/api/ai/provider/MockAiProviderTest.java`
- [x] T013 [P] [US1] Update AI run failure integration tests for provider and output-validation failures releasing credits through the canonical path in `services/api/src/test/java/com/frankintest/api/ai/AiRunFailureIntegrationTest.java`
- [x] T014 [P] [US1] Add or update backend documentation/test coverage for authentication behavior if supported, or mocked/local auth rationale if real auth is not implemented, in `services/api/src/test/java/com/frankintest/api/ai/AiTestDesignControllerTest.java`

### Implementation for User Story 1

- [x] T015 [US1] Remove or convert `services/api/src/main/java/com/frankintest/api/ai/AiRunController.java` into a thin compatibility wrapper around `AiTestDesignOrchestrationService`
- [x] T016 [US1] Remove or retire duplicate business logic in `services/api/src/main/java/com/frankintest/api/ai/AiOrchestrationService.java`
- [x] T017 [US1] Remove or retire duplicate root provider selection in `services/api/src/main/java/com/frankintest/api/ai/AiProviderFactory.java`
- [x] T018 [US1] Remove, adapt, or isolate root provider DTO/interfaces in `services/api/src/main/java/com/frankintest/api/ai/AiProvider.java`, `services/api/src/main/java/com/frankintest/api/ai/AiResponse.java`, `services/api/src/main/java/com/frankintest/api/ai/AnthropicAiProvider.java`, and `services/api/src/main/java/com/frankintest/api/ai/MockAiProvider.java`
- [x] T019 [US1] Remove or adapt legacy request/response DTOs in `services/api/src/main/java/com/frankintest/api/ai/AiEstimateRequest.java`, `services/api/src/main/java/com/frankintest/api/ai/AiEstimateResponse.java`, `services/api/src/main/java/com/frankintest/api/ai/AiGenerateScenariosRequest.java`, `services/api/src/main/java/com/frankintest/api/ai/AiGenerateTestCasesRequest.java`, `services/api/src/main/java/com/frankintest/api/ai/AiRunResponse.java`
- [x] T020 [US1] Ensure `services/api/src/main/java/com/frankintest/api/ai/AiTestDesignController.java` remains the canonical controller for estimate, scenario generation, and test-case generation
- [x] T021 [US1] Ensure `services/api/src/main/java/com/frankintest/api/ai/AiRunStatusController.java` remains the safe metadata endpoint for `GET /api/ai/runs/{aiRunId}`
- [x] T022 [US1] Ensure `services/api/src/main/java/com/frankintest/api/ai/orchestration/AiTestDesignOrchestrationService.java` owns input validation handoff, organization/project access validation, credit reserve/capture/release, AI run lifecycle, audit events, output parsing, and artifact persistence
- [x] T023 [US1] Ensure `services/api/src/main/java/com/frankintest/api/ai/provider/AiProviderSelector.java` and `services/api/src/main/java/com/frankintest/api/ai/provider/AiProviderPort.java` are the only active provider-selection boundary
- [x] T024 [US1] Run full backend validation with `./mvnw test` from `services/api` and fix failures in `services/api/src/main/java/com/frankintest/api/` or `services/api/src/test/java/com/frankintest/api/`

**Checkpoint**: User Story 1 is complete when duplicate AI business logic is gone or wrapper-only and backend AI tests pass.

---

## Phase 4: User Story 2 - Preservar a experiência existente do Workspace (Priority: P2)

**Goal**: Preserve the existing Workspace AI assistance UI and ensure it calls only canonical FrankInTest backend APIs.

**Independent Test**: Frontend AI tests, lint, and build pass; source inspection shows no direct provider calls or provider secrets in `apps/web`.

### Tests for User Story 2

- [x] T025 [P] [US2] Update frontend AI assistance tests for canonical endpoint calls and pt-BR states in `apps/web/tests/ai-assistance.test.mjs`
- [x] T026 [P] [US2] Add or update frontend source-safety assertions for no direct provider URL/key usage in `apps/web/tests/ai-assistance.test.mjs`

### Implementation for User Story 2

- [x] T027 [US2] Confirm `apps/web/src/lib/ai-assistance/aiAssistanceClient.ts` calls only `/api/ai/test-design/estimate`, `/api/ai/test-design/scenarios`, `/api/ai/test-design/test-cases`, and `/api/ai/runs/{aiRunId}`
- [x] T028 [US2] Update `apps/web/src/lib/ai-assistance/types.ts` only if backend canonical response shapes changed during US1
- [x] T029 [US2] Verify `apps/web/src/app/components/AiGenerationModal.tsx` still presents estimate, loading, success, error, draft, and AI-assisted states in pt-BR without new UI redesign
- [x] T030 [US2] Verify `apps/web/src/app/components/TestScenarioSection.tsx` and `apps/web/src/app/components/TestCaseSection.tsx` still integrate generated draft artifacts without provider details
- [x] T031 [US2] Run `npm run lint`, `npm test`, and `npm run build` from `apps/web` and fix failures in `apps/web/src/` or `apps/web/tests/`

**Checkpoint**: User Story 2 is complete when Workspace AI UX remains functional and frontend validation passes.

---

## Phase 5: User Story 3 - Atualizar documentação e status do bloco (Priority: P3)

**Goal**: Make docs/spec/status accurately describe the post-09C AI foundation and known limitations.

**Independent Test**: Docs identify the canonical path, removed/adapted legacy paths, preserved behavior, limitations, and next steps without contradicting the constitution or scope.

### Documentation Tests for User Story 3

- [x] T032 [P] [US3] Review `docs/API_DESIGN.md` for active canonical AI endpoints versus future/planned AI endpoints and mark planned endpoints clearly
- [x] T033 [P] [US3] Review `docs/ARCHITECTURE.md` for canonical AI orchestration ownership and remove conflicting legacy descriptions
- [x] T034 [P] [US3] Review `docs/CURRENT_STATUS.md` for Bloco 09C status, preserved 09A/09B behavior, and Check-up MVP readiness notes
- [x] T035 [P] [US3] Review `docs/ROADMAP.md` for next-step alignment after AI foundation cleanup
- [x] T036 [P] [US3] Review `specs/001-ai-test-design/tasks.md` and either update stale failing-test/legacy references if it is living documentation or explicitly classify it as historical SDD artifact outside current status

### Implementation for User Story 3

- [x] T037 [US3] Update `docs/API_DESIGN.md` with canonical AI Test Design endpoints and any deprecated compatibility endpoint notes
- [x] T038 [US3] Update `docs/ARCHITECTURE.md` to state the canonical backend AI orchestration path and server-side provider boundary
- [x] T039 [US3] Update `docs/CURRENT_STATUS.md` with Bloco 09C outcome, validation status, limitations, and readiness for Check-up MVP
- [x] T040 [US3] Update `docs/ROADMAP.md` only where roadmap/status currently contradicts the 09C canonical AI foundation
- [x] T041 [US3] Update `specs/002-ai-foundation-cleanup/ai-surface-inventory.md` with final removed/adapted/preserved decisions and rationale

**Checkpoint**: User Story 3 is complete when docs/status match the final code state.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and run report across all user stories.

- [x] T042 [P] Verify no active duplicate AI production/test path remains by running `rg -n "AiOrchestrationService|AiProviderFactory|AiRunController|generateContent|/api/ai/estimate|/api/ai/scenarios/generate|/api/ai/test-cases/generate" services/api/src/main services/api/src/test apps/web/src apps/web/tests`
- [x] T043 [P] Verify deprecated or historical legacy references are explicitly documented by reviewing `docs/`, `specs/001-ai-test-design/`, and `specs/002-ai-foundation-cleanup/`
- [x] T044 [P] Verify no provider secrets or direct provider calls exist in frontend source/tests/client-facing artifacts by running `rg -n "ANTHROPIC|OPENAI|api-key|x-api-key|provider|generateContent|fetch\\(" apps/web/src apps/web/tests apps/web/public`
- [x] T045 [P] Verify frontend env exposure patterns do not include AI provider keys by reviewing `apps/web/.env*`, `apps/web/next.config.ts`, and `apps/web/src/` if those files exist
- [x] T046 [P] Verify automated tests do not require real provider configuration by reviewing `services/api/src/test/resources/` and `services/api/src/test/java/com/frankintest/api/`
- [x] T047 Run full backend validation with `./mvnw test` from `services/api`
- [x] T048 Run full frontend validation with `npm run lint`, `npm test`, and `npm run build` from `apps/web`
- [x] T049 Review and complete relevant items in `specs/002-ai-foundation-cleanup/checklists/ai-foundation.md`
- [x] T050 Produce required 09C run report in the final response covering changed files, functionality, preserved business rules, tests, validation commands, limitations, roadmap/status updates, and suggested commit message

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion; blocks user-story implementation.
- **US1 (Phase 3)**: Depends on Foundational; must complete before US2 and US3 final validation because it decides final code state.
- **US2 (Phase 4)**: Depends on Foundational and should follow US1 if backend response shapes change.
- **US3 (Phase 5)**: Depends on US1 final decisions and US2 frontend confirmation.
- **Polish (Phase 6)**: Depends on all selected user stories.

### User Story Dependencies

- **US1**: MVP. Required to establish one canonical AI architecture.
- **US2**: Can begin after Foundational for inspection/tests, but final implementation should follow US1 to match final backend shape.
- **US3**: Should follow US1/US2 so docs describe the final outcome, not the intended outcome.

### Within Each User Story

- Tests before implementation when changing protected behavior.
- Inventory before removals.
- Canonical service/controller/provider boundaries before deleting legacy classes.
- Backend validation before frontend final validation.
- Docs after code decisions.

## Parallel Execution Examples

### User Story 1

```bash
Task: "T010 [P] [US1] Update canonical controller tests in services/api/src/test/java/com/frankintest/api/ai/AiTestDesignControllerTest.java"
Task: "T011 [P] [US1] Update orchestration service tests in services/api/src/test/java/com/frankintest/api/ai/orchestration/AiTestDesignOrchestrationServiceTest.java"
Task: "T013 [P] [US1] Update AI run failure integration tests in services/api/src/test/java/com/frankintest/api/ai/AiRunFailureIntegrationTest.java"
```

### User Story 2

```bash
Task: "T025 [P] [US2] Update frontend AI assistance tests in apps/web/tests/ai-assistance.test.mjs"
Task: "T027 [US2] Confirm canonical endpoint calls in apps/web/src/lib/ai-assistance/aiAssistanceClient.ts"
```

### User Story 3

```bash
Task: "T032 [P] [US3] Review docs/API_DESIGN.md"
Task: "T033 [P] [US3] Review docs/ARCHITECTURE.md"
Task: "T034 [P] [US3] Review docs/CURRENT_STATUS.md"
Task: "T035 [P] [US3] Review docs/ROADMAP.md"
```

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1 inventory.
2. Complete Phase 2 clarification/spec alignment.
3. Complete US1 tests and implementation.
4. Validate backend AI foundation.
5. Stop and report if only canonical backend cleanup is desired.

### Full 09C Delivery

1. Complete Setup and Foundational phases.
2. Complete US1 to normalize backend AI architecture.
3. Complete US2 to preserve Workspace frontend behavior.
4. Complete US3 to align docs/status.
5. Complete Polish validation and run report.

## Notes

- [P] tasks are parallelizable when they touch different files and do not depend on incomplete tasks.
- Do not revert unrelated dirty worktree changes such as `apps/web/next-env.d.ts`.
- Do not add new AI features, Check-up MVP behavior, billing purchase flow, streaming, provider expansion, redesign, or microservices.
- Do not commit automatically; the human developer commits manually.
