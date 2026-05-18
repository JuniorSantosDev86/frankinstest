---
description: "Task list for Real AI Provider Integration (Bloco 12)"
---

# Tasks: Real AI Provider Integration (Bloco 12)

**Input**: Design documents from `/specs/006-real-ai-provider-integration/`

**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅ quickstart.md ✅

**Tests**: Required by FrankInTest constitution. Backend business rules require unit tests.
Backend API, permission, credit, and audit boundaries require integration tests. AI provider
calls MUST be mocked in all tests.

**Organization**: Tasks grouped by user story for independent implementation and testing.
All changes are in `services/api` only. The API contract gains one additive field (`aiAssisted: boolean`) per FR-013; no existing fields are removed or renamed (FR-019).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)

## Path Conventions

- **Backend src**: `services/api/src/main/java/com/frankintest/api/`
- **Backend test**: `services/api/src/test/java/com/frankintest/api/`
- **Config**: `services/api/src/main/resources/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Configuration corrections and new component scaffolding required before any story work.

- [ ] T001 Update `services/api/src/main/resources/application.yml`: change `ai.anthropic.model` default from `claude-sonnet-4-6` to `claude-haiku-4-5-20251001`, raise `ai.anthropic.max-tokens` default from `1024` to `4096`, add `ai.anthropic.timeout-seconds: ${AI_PROVIDER_TIMEOUT_SECONDS:30}`
- [ ] T002 [P] Update `AnthropicAiProvider` constructor in `services/api/src/main/java/com/frankintest/api/ai/provider/AnthropicAiProvider.java`: inject `@Value("${ai.anthropic.timeout-seconds:30}") int timeoutSeconds` and apply as `Duration.ofSeconds(timeoutSeconds)` on the `HttpRequest.timeout()` call (replacing hardcoded 60s)
- [ ] T003 [P] Add `output_validation` value to `AiRunModels.AiRunFailureCategory` enum in `services/api/src/main/java/com/frankintest/api/airuns/AiRunModels.java`

**Checkpoint**: Config and enum baseline ready — all story work can begin

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: New `CheckupOutputValidator` component must exist before `CheckupService` can use it and before any output-validation tests can be written.

**⚠️ CRITICAL**: Phase 3–5 story work depends on T004 and T005.

- [ ] T004 Create `services/api/src/main/java/com/frankintest/api/checkup/CheckupOutputValidator.java` as a Spring `@Component` with method `ValidationResult validate(JsonNode root)`. Implement the seven-section validation loop per FR-007 and data-model.md: each section key must be present and be a non-null JSON array; each item must have all required fields non-null and non-blank; `suggestedTestCases[].steps` must be a non-empty array; enum values for `severity`, `type`, `priority` must match the declared values. Return a `record ValidationResult(boolean valid, String reason)` — reason must NOT include raw provider output.
- [ ] T005 [P] Write unit tests for `CheckupOutputValidator` in `services/api/src/test/java/com/frankintest/api/checkup/CheckupOutputValidatorTest.java`: test valid full report passes; each of the 7 sections missing individually causes failure; blank/null field in each section type causes failure; `steps` empty array causes failure; invalid enum value causes failure; valid empty-array sections pass.

**Checkpoint**: Validator exists and unit-tested — story phases can begin

---

## Phase 3: User Story 1 — Developer Enables Real Provider Locally (Priority: P1) 🎯 MVP

**Goal**: Real Anthropic provider generates a valid 7-section DRAFT Check-up report when `ANTHROPIC_API_KEY` + `AI_MOCK_ENABLED=false` are configured.

**Independent Test**: Set `ANTHROPIC_API_KEY`, `AI_MOCK_ENABLED=false`, start backend, POST `/api/checkup/run` with valid JWT + `X-Organization-Id`, GET status → `completed` with all 7 sections populated. See `quickstart.md`.

### Tests for User Story 1 ⚠️

- [ ] T006 [P] [US1] Write integration test in `services/api/src/test/java/com/frankintest/api/checkup/CheckupAuditWithRealProviderPathTest.java` (mock provider active): verify that a successful Check-up run emits `CHECK_UP_PROVIDER_CALL_STARTED` and `CHECK_UP_PROVIDER_CALL_COMPLETED` audit events in addition to existing `CHECK_UP_RUNNING` and `CHECK_UP_COMPLETED` events.
- [ ] T007 [P] [US1] Write unit test in `services/api/src/test/java/com/frankintest/api/ai/provider/AnthropicAiProviderConfigTest.java`: verify that `AnthropicAiProvider` reads timeout from injected config value; verify that missing API key returns `AiProviderResponse.failure(...)` without making any HTTP call; verify that the provider name is `"anthropic"`.

### Implementation for User Story 1

- [ ] T008 [US1] Update `CheckupService.run()` in `services/api/src/main/java/com/frankintest/api/checkup/CheckupService.java`: inject `CheckupOutputValidator`; after `response.success() == true`, call `validator.validate(parsed root)`; on validation failure, release credits, call `aiRunRepository.updateStatus(... AiRunStatus.failed, AiRunFailureCategory.output_validation ...)`, emit `CHECK_UP_OUTPUT_VALIDATION_FAILED` + `CHECK_UP_FAILED` audit events, throw `CheckupExecutionException` with pt-BR message; before `provider.generate()` call emit `CHECK_UP_PROVIDER_CALL_STARTED`; after successful response emit `CHECK_UP_PROVIDER_CALL_COMPLETED`. (Depends on T003, T004)
- [ ] T008b [US1] Add `aiAssisted: boolean` field to `CheckupModels.CheckupReportView` in `services/api/src/main/java/com/frankintest/api/checkup/CheckupModels.java` (always `true` for Check-up reports, per FR-013). Update `CheckupService.toView()` to populate it. Update `CheckupRunStatusResponse` JSON output accordingly. (Depends on T008)
- [ ] T008c [P] [US1] Add integration test assertion to T006 (`CheckupAuditWithRealProviderPathTest.java`): verify that the completed run status response includes `"aiAssisted": true` in the `report` object. (Depends on T008b)
- [ ] T009 [US1] Update `CheckupReportParser.parse()` in `services/api/src/main/java/com/frankintest/api/checkup/CheckupReportParser.java`: remove the silent `catch (Exception e) { root = mapper.createObjectNode(); }` at the top-level JSON parse; instead throw `CheckupExecutionException` on malformed JSON so `CheckupService` can handle it as an output-validation failure. (Depends on T008)

**Checkpoint**: Full happy path — real provider, valid output → DRAFT report persisted, audit events emitted, credits captured

---

## Phase 4: User Story 2 — Automated Tests Continue Passing Without Real Key (Priority: P1)

**Goal**: `./mvnw test` passes with zero real provider calls and no `ANTHROPIC_API_KEY` set.

**Independent Test**: `cd services/api && ./mvnw test` — all tests green, no HTTP calls to Anthropic.

### Tests for User Story 2 ⚠️

- [ ] T010 [P] [US2] Verify all existing test classes that exercise `CheckupService` (e.g., `CheckupCreditFlowTest`, `CheckupAuditEventTest`, `CheckupRunControllerTest`) still use `AI_MOCK_ENABLED=true` or inject `MockAiProvider` directly. If any test requires adjustment due to the new `CheckupOutputValidator` injection, update the test to provide the real validator bean (it is pure logic, no side effects). Document any changes inline.
- [ ] T011 [P] [US2] Update `MockAiProvider.buildCheckupMockReport()` in `services/api/src/main/java/com/frankintest/api/ai/provider/MockAiProvider.java` if needed to ensure its output passes `CheckupOutputValidator` (all 7 sections present, item fields valid). Verify with `MockAiProviderTest` that mock output passes the validator. (Depends on T004)

### Implementation for User Story 2

No new production code required — mock routing is already handled by `AiProviderSelector`. Correctness validated entirely through tests T010 and T011.

**Checkpoint**: Full test suite passes without API key; mock output survives the new validator

---

## Phase 5: User Story 3 — Provider Timeout or Failure Preserves Credits (Priority: P2)

**Goal**: Timeout or HTTP 5xx → AI run `FAILED` with `PROVIDER_FAILURE`, credits released, safe pt-BR error returned, no provider internals leaked.

**Independent Test**: Configure `ANTHROPIC_BASE_URL` to an unreachable endpoint + short timeout, trigger Check-up run, verify `status=failed` in AI run table, credit ledger shows reservation released, response body contains only pt-BR error message.

### Tests for User Story 3 ⚠️

- [ ] T012a [P] [US3] Write integration test `services/api/src/test/java/com/frankintest/api/checkup/CheckupProviderFailurePathTest.java`: configure mock provider to return `AiProviderResponse.failure("PROVIDER_FAILURE simulated")` (simulates a provider HTTP error response); exercise the `PROVIDER_FAILURE` credit-release path in `CheckupService`; assert: credits released, AI run status `failed`, failure category `provider`, `CHECK_UP_PROVIDER_CALL_FAILED` audit event row present in DB with correct `organizationId`, `userId`, entity type and run id, response body contains no provider internals. All tests use `MockAiProvider` — no real Anthropic call.
- [ ] T012b [P] [US3] Write unit test `services/api/src/test/java/com/frankintest/api/ai/provider/AnthropicAiProviderTimeoutTest.java`: instantiate `AnthropicAiProvider` directly with a 1-second timeout pointing at a `ServerSocket` that accepts but never responds; call `generate("test prompt")`; assert the returned `AiProviderResponse.success == false` and `errorMessage` does not contain a stack trace or provider secret. No real Anthropic call — uses a local socket stub only.
- [ ] T013 [P] [US3] Write integration test `services/api/src/test/java/com/frankintest/api/checkup/CheckupProviderHttpErrorTest.java`: configure mock provider to return `AiProviderResponse.failure("HTTP 500")` (simulates Anthropic 5xx); assert: credits released, `PROVIDER_FAILURE` failure category, `CHECK_UP_PROVIDER_CALL_FAILED` audit row present in DB with correct `organizationId`, `userId`, and run id, pt-BR error message in API response, no provider error body leaked.

### Implementation for User Story 3

- [ ] T014 [US3] Ensure `AnthropicAiProvider.generate()` catches `java.net.http.HttpTimeoutException` explicitly (before the generic `Exception` catch) and returns `AiProviderResponse.failure("timeout")` — so `CheckupService` can classify it as `PROVIDER_FAILURE` with no provider stack trace. Update `services/api/src/main/java/com/frankintest/api/ai/provider/AnthropicAiProvider.java`. (Depends on T002)
- [ ] T015 [US3] Verify `CheckupController` exception handler in `services/api/src/main/java/com/frankintest/api/checkup/CheckupController.java` maps `CheckupExecutionException` to a safe JSON error response with no provider internals (already should be the case — confirm and add an assertion in T012 if not yet covered).

**Checkpoint**: All provider failure modes return safe pt-BR errors, credits preserved, audit trail complete

---

## Phase 6: User Story 4 — Invalid Provider Output Rejected Safely (Priority: P2)

**Goal**: Provider HTTP success but malformed/missing-section JSON → output rejected, credits released, no partial report persisted, `OUTPUT_VALIDATION_FAILURE` audit event emitted.

**Independent Test**: Configure mock provider to return a response missing `qualityRisks` key, trigger Check-up run, verify AI run `status=failed`, `failure_category=output_validation`, no report row in DB, credits released, pt-BR error in response.

### Tests for User Story 4 ⚠️

- [ ] T016 [P] [US4] Write integration test `services/api/src/test/java/com/frankintest/api/checkup/CheckupOutputValidationFailureTest.java`: use a mock provider that returns `AiProviderResponse.success("{\"qualityRisks\":[]}", ...)` (missing 6 sections); verify: `CHECK_UP_OUTPUT_VALIDATION_FAILED` audit event emitted, AI run status `failed`, failure category `output_validation`, credits released to zero consumed, no report persisted in `checkup_reports` table, response body contains safe pt-BR error, no raw AI content in response.
- [ ] T017 [P] [US4] Write unit test in `services/api/src/test/java/com/frankintest/api/checkup/CheckupReportParserMalformedJsonTest.java`: verify that when `CheckupReportParser.parse()` receives non-JSON text it throws (not silently returns empty report). (Depends on T009)

### Implementation for User Story 4

Covered by T008 (output-validation failure branch in `CheckupService`) and T009 (`CheckupReportParser` no longer swallows parse errors). No additional production code required if T008 and T009 are complete.

**Checkpoint**: No malformed AI output can be persisted; output-validation failure path is audited and credit-safe

---

## Phase 7: User Story 5 — Missing API Key Fails Fast (Priority: P2)

**Goal**: `AI_PROVIDER=anthropic` + blank `ANTHROPIC_API_KEY` → configuration error before any HTTP call, safe pt-BR error, zero silent misconfiguration.

**Independent Test**: Set `AI_MOCK_ENABLED=false`, leave `ANTHROPIC_API_KEY` unset, trigger Check-up run, verify error response has no Anthropic HTTP attempt in logs, and response body is a safe pt-BR configuration error message.

### Tests for User Story 5 ⚠️

- [ ] T018 [P] [US5] Add test case to `AnthropicAiProviderConfigTest.java` (T007): inject blank `apiKey`, call `generate("any prompt")`, verify returned `AiProviderResponse.success == false` and `errorMessage` contains the pt-BR configuration error string but NOT the API key value itself.

### Implementation for User Story 5

- [ ] T019 [US5] Ensure `AnthropicAiProvider.generate()` check for blank `apiKey` is the first statement — before any object construction or HTTP attempt — and that the error message never prints or interpolates the key value. Review `services/api/src/main/java/com/frankintest/api/ai/provider/AnthropicAiProvider.java` line ~47 (already correct per current code; confirm and document). No code change expected unless review reveals a gap.
- [ ] T020 [US5] Add a log statement at `WARN` level (no key value) when blank API key is detected in `AnthropicAiProvider.generate()`, so the misconfiguration is visible in server logs without exposing secrets.

**Checkpoint**: Missing API key produces a safe, logged configuration error before any network activity

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening, documentation, and run report.

- [ ] T021 [P] Run `./mvnw test` in `services/api/` and confirm all tests pass (zero failures, zero real provider calls). Document output in run report.
- [ ] T022 **[GATE — REQUIRED]** Review all new log statements in `AnthropicAiProvider` and `CheckupService` to confirm `ANTHROPIC_API_KEY` and raw provider error body never appear at any log level. Add `// security: never log api key` comment where the guard exists. Also verify: (a) `CheckupReportView` and all API response models contain no API key fields; (b) no `ANTHROPIC_API_KEY` reference appears in `apps/web/` bundle or source. This review must be documented in the run report as a named validation gate — it is not optional.
- [ ] T023 [P] Write unit test `services/api/src/test/java/com/frankintest/api/checkup/CheckupPromptBuilderDisclaimerTest.java`: assert that `CheckupPromptBuilder.build(request)` output contains phrases preventing certainty claims — specifically that the prompt includes text matching at least one of: "não afirme", "risco potencial", "validação recomendada", "requer confirmação" (per existing builder content and FR-022). This test must fail if the disclaimer is accidentally removed.
- [ ] T024 [P] Verify `MockAiProvider.buildCheckupMockReport()` output is accepted by `CheckupOutputValidator` — run `CheckupOutputValidatorTest` against the mock output string. Fix mock output if any field is missing or invalid.
- [ ] T025 Update `specs/006-real-ai-provider-integration/quickstart.md` if any env var name or default value changed during implementation (compare against final `application.yml`).
- [ ] T026 **[GATE — REQUIRED]** Run the existing Bloco 11 security regression tests: `CheckupLgpdEnforcementTest`, `CheckupAuditWithIdentityTest`, `CheckupRunControllerTest` (auth protection assertions), `RateLimitFilterTest` (if present), `JwtAuthFilterTest` (if present). Confirm zero failures. Document results in run report.
- [ ] T027 **[GATE — REQUIRED]** Manually follow `quickstart.md` end-to-end with a real `ANTHROPIC_API_KEY` (or a test key against a stubbed endpoint). The run report must state: (a) whether the quickstart was actually executed or only reviewed; (b) if executed, whether the real provider returned a valid 7-section report with `aiAssisted: true`; (c) if not executed, the documented reason why.
- [ ] T028 Produce the required run report: changed files, implemented functionality, preserved business rules, tests added/updated, validation commands (`./mvnw test`), results of gates T022/T026/T027, known limitations, roadmap/status updates, and suggested commit message.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS Phases 3–7
- **Phases 3–7 (User Stories)**: All depend on Phase 2 completion
  - US1 (Phase 3): Depends on T003, T004
  - US2 (Phase 4): Depends on T004, T011
  - US3 (Phase 5): Depends on T002 (timeout config)
  - US4 (Phase 6): Depends on T008, T009
  - US5 (Phase 7): No additional production dependencies beyond Phase 1
- **Phase 8 (Polish/Gates)**: Depends on all user story phases complete

### Within Each User Story

- Tests before implementation where the tested behavior doesn't yet exist
- Validator (T004) before service changes (T008)
- Service changes (T008) before parser hardening (T009)

### Parallel Opportunities

- T001 through T003 (Phase 1): T002 and T003 can run in parallel after T001
- T004 and T005 can run in parallel (different files)
- T006 and T007 can run in parallel
- T010 and T011 can run in parallel
- T012 and T013 can run in parallel
- T016 and T017 can run in parallel
- T021, T022, T023, T024 can all run in parallel; T026 and T027 are sequential gates after T021

---

## Parallel Example: Phase 2 (Foundational)

```bash
# T004 and T005 in parallel (different files):
Task: "Create CheckupOutputValidator.java"
Task: "Write CheckupOutputValidatorTest.java"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup (config corrections)
2. Complete Phase 2: Foundational (CheckupOutputValidator)
3. Complete Phase 3: US1 (real provider happy path)
4. Complete Phase 4: US2 (mock tests still green)
5. **STOP and VALIDATE**: `./mvnw test` passes; manual quickstart.md test succeeds
6. Deliver — real provider works, CI stays green

### Incremental Delivery

1. Setup + Foundational → validator ready
2. US1 + US2 → MVP: real provider works, tests green
3. US3 → timeout/HTTP error safety
4. US4 → output-validation rejection
5. US5 → missing-key fail-fast
6. Polish → run report + final validation

---

## Notes

- [P] tasks operate on different files with no dependencies — safe to parallelize
- [Story] label maps each task to its user story for traceability
- API contract extended with `aiAssisted: boolean` (additive, FR-013); no existing fields removed
- No new Maven dependencies — uses existing JDK HTTP client and Jackson
- Do not commit automatically; the human developer commits manually
- All AI provider calls in tests MUST go through `MockAiProvider` (constitution rule)
- Stop at Phase 3+4 checkpoint to validate MVP independently before continuing
