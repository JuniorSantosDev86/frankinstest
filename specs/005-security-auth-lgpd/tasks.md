---
description: "Task list for Security, Auth and LGPD Foundation"
---

# Tasks: Security, Auth and LGPD Foundation

**Input**: Design documents from `specs/005-security-auth-lgpd/`

**Prerequisites**: plan.md ✓ · spec.md ✓ · research.md ✓ · data-model.md ✓ · contracts/auth-api.md ✓

**Tests**: Required by the FrankInTest constitution. Backend business rules → unit tests. Backend API/permission/audit boundaries → integration tests. Frontend critical flows → component tests when applicable. AI providers → mocked in all tests.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelizable (different files, no blocking dependencies on incomplete tasks)
- **[Story]**: User story label [US1]–[US5]

## Path Conventions

- **Frontend**: `apps/web/src/`, `apps/web/tests/`
- **Backend**: `services/api/src/main/java/com/frankintest/api/`, `services/api/src/test/java/com/frankintest/api/`
- **Infrastructure**: `infra/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add new dependencies and fix the known spec numbering issue before any implementation begins.

- [ ] T001 Add `spring-boot-starter-security`, `jjwt-api`, `jjwt-impl`, `jjwt-jackson` (0.12.x), and `bucket4j-core` to `services/api/pom.xml`; verify `mvn dependency:resolve` passes
- [ ] T002 [P] Add `JWT_SECRET`, `DEMO_AUTH_ENABLED`, and `CORS_ALLOWED_ORIGINS` entries to `services/api/src/main/resources/application.yml` (dev profile defaults) and `infra/docker-compose.yml` environment section

**Checkpoint**: Dependencies resolved; configuration keys present — no code written yet

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core security infrastructure that MUST be complete before any user story begins. All US phases depend on these tasks.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T003 Create `AuthenticatedPrincipal` value object (record) in `services/api/src/main/java/com/frankintest/api/system/security/AuthenticatedPrincipal.java` — fields: `userId` (String), `organizationIds` (List\<String\>), `roles` (List\<String\>)
- [ ] T004 [P] Create `JwtService` in `services/api/src/main/java/com/frankintest/api/system/security/JwtService.java` — methods: `generateToken(userId, organizationIds, roles, ttlSeconds)`, `parseToken(String raw)` returning `AuthenticatedPrincipal`, `generateDemoToken()` (dev only, TTL configurable via `${jwt.demo-ttl-seconds}`, default 86400); reads signing secret from `${jwt.secret}`; enforces minimum 256-bit key at startup; includes `exp` claim in all generated tokens; `generateDemoToken()` generates and returns the signed token only — it does NOT log anything (logging is the responsibility of `DemoAuthConfigurer`)
- [ ] T005 Create `JwtAuthFilter` (`OncePerRequestFilter`) in `services/api/src/main/java/com/frankintest/api/system/security/JwtAuthFilter.java` — extracts `Authorization: Bearer <token>`, calls `JwtService.parseToken()`, populates `SecurityContext` with `UsernamePasswordAuthenticationToken`; missing or invalid token: clears context and writes `401` JSON response `{"error":"UNAUTHORIZED","message":"Autenticação necessária."}`; records `SECURITY_401` audit event
- [ ] T006 Create `SecurityConfig` in `services/api/src/main/java/com/frankintest/api/system/security/SecurityConfig.java` — Spring Security filter chain: disable CSRF, disable session, disable form login, add `JwtAuthFilter` before `UsernamePasswordAuthenticationFilter`; protect `/api/checkup/**` and `/api/ai/**`; permit `/api/health`, `/actuator/health`
- [ ] T007 [P] Update `WorkspaceAccessService` in `services/api/src/main/java/com/frankintest/api/system/WorkspaceAccessService.java` — add method `requireOrgAccess(AuthenticatedPrincipal principal, String organizationId)`: (1) validates `organizationId` is non-blank (signal → `400`); (2) validates it is present in `principal.organizationIds()` (the list decoded from the JWT `orgs` claim) — throws `AccessDeniedException` → `403` if not found; the static demo mapping `user_demo_qa_lead → ["org_demo_personal"]` is used ONLY by `JwtService.generateDemoToken()` when building the token's `orgs` claim — it is NOT re-checked at validation time; keep existing `requireProjectAccess` signature intact
- [ ] T008 Update `CorsConfig` in `services/api/src/main/java/com/frankintest/api/system/CorsConfig.java` — inject `@Value("${cors.allowed-origins}")` as comma-separated list; replace hardcoded `http://localhost:3000` with the injected list; add `Authorization` and `X-Organization-Id` to `allowedHeaders`

**Checkpoint**: Security filter chain active; `AuthenticatedPrincipal` resolvable; `WorkspaceAccessService` validates org membership; CORS env-scoped — ready for user story implementation

---

## Phase 3: User Story 1 — Protected Check-up Flow (Priority: P1) 🎯 MVP

**Goal**: Remove `org_mock`/`user_mock` from `CheckupController`; resolve identity from JWT + `X-Organization-Id` header; existing Check-up flow works end-to-end with a valid token.

**Independent Test**: Start backend with `dev` profile, use the logged demo JWT and `X-Organization-Id: org_demo_personal`. Call `/api/checkup/estimate` and `/api/checkup/run` — both return expected responses. Call without token — both return `401`. Call with token but wrong org header — return `403`.

### Tests for User Story 1 ⚠️

- [ ] T009 [P] [US1] Write `CheckupAuthProtectionTest` integration test in `services/api/src/test/java/com/frankintest/api/system/security/CheckupAuthProtectionTest.java` — covers: (a) `POST /api/checkup/estimate` without token → `401`; (b) with valid token + correct org → `200` or `422` (existing validation); (c) with valid token + wrong org → `403`; (d) with valid token, no `X-Organization-Id` header → `400`; (e) with expired token → `401` (same body as missing token — confirm body does not contain expiry details); test uses `JwtService` to generate in-test tokens (including short-TTL tokens for expiry test) with a test secret
- [ ] T010 [P] [US1] Write `CheckupAuditWithIdentityTest` integration test in `services/api/src/test/java/com/frankintest/api/checkup/CheckupAuditWithIdentityTest.java` — after a successful authenticated `run`, assert `audit_log` row has real `user_id` and `organization_id` (not `user_mock`/`org_mock`); use JDBC template to query

### Implementation for User Story 1

- [ ] T011 [US1] Update `CheckupController` in `services/api/src/main/java/com/frankintest/api/checkup/CheckupController.java` — inject `WorkspaceAccessService`; add `@AuthenticationPrincipal AuthenticatedPrincipal principal` and `@RequestHeader("X-Organization-Id") String organizationId` to `run()` and `getRunStatus()` methods; call `workspaceAccessService.requireOrgAccess(principal, organizationId)`; replace `String organizationId = "org_mock"` and `String userId = "user_mock"` with principal-resolved values; add `@RequestHeader(value="X-Organization-Id", required=false)` with explicit null check returning `400` for `estimate()` if org context needed
- [ ] T012 [US1] Add `403` and `400` error handling to `CheckupController` — catch `WorkspaceAccessService.AccessDeniedException` → `403 {"error":"FORBIDDEN","message":"Acesso negado a este recurso."}`; catch missing-header case → `400 {"error":"VALIDATION_ERROR","message":"X-Organization-Id é obrigatório.","field":"X-Organization-Id"}`

**Checkpoint**: Check-up routes fully protected; `org_mock`/`user_mock` eliminated; audit log carries real identity; existing tests pass

---

## Phase 4: User Story 2 — Protected AI Test Design Routes (Priority: P1)

**Goal**: Apply the same auth enforcement to `/api/ai/**` routes; resolve principal from JWT; remove any hardcoded or client-trusted org/user values in `AiTestDesignController`.

**Independent Test**: Call any `/api/ai/test-design/**` endpoint without a token → `401`. With valid token + correct org → proceeds (or hits existing validation). With valid token + wrong org → `403`. Audit event carries real identity.

### Tests for User Story 2 ⚠️

- [ ] T013 [P] [US2] Write `AiAuthProtectionTest` integration test in `services/api/src/test/java/com/frankintest/api/system/security/AiAuthProtectionTest.java` — covers: (a) `POST /api/ai/test-design/estimate` without token → `401`; (b) with valid token + correct org → proceeds; (c) with valid token + wrong org → `403`; (d) `GET /api/ai/runs/{aiRunId}` without token → `401`; (e) `GET /api/ai/runs/{aiRunId}` with valid token but wrong `X-Organization-Id` → `403`; (f) `GET /api/ai/runs/{aiRunId}` with valid token and matching org → `200` or `404` (never another org's data); (g) AI test-design run route with valid auth → audit event recorded with real userId

### Implementation for User Story 2

- [ ] T014 [US2] Update `AiTestDesignController` in `services/api/src/main/java/com/frankintest/api/ai/AiTestDesignController.java` — add `@AuthenticationPrincipal AuthenticatedPrincipal principal` and `@RequestHeader("X-Organization-Id") String organizationId` parameters; call `workspaceAccessService.requireOrgAccess(principal, organizationId)`; stop accepting `organizationId` and `userId` from the request body as final authority; pass `principal.userId()` to downstream services
- [ ] T015 [US2] Add `403` and `400` error handling to `AiTestDesignController` — same error response shape as `CheckupController` (T012); ensure no sensitive context appears in error body
- [ ] T015b [US2] Update `AiRunStatusController` in `services/api/src/main/java/com/frankintest/api/ai/AiRunStatusController.java` — add `@AuthenticationPrincipal AuthenticatedPrincipal principal` and `@RequestHeader(value="X-Organization-Id", required=false) String organizationId` parameters to `getRunStatus()`; call `workspaceAccessService.requireOrgAccess(principal, organizationId)` before querying the run; if the resolved `AiRun` does not belong to the validated organization, return `403` (do not expose another org's run data); missing `X-Organization-Id` returns `400`; same error response shape as other protected controllers

**Checkpoint**: All `/api/ai/**` routes consistently protected; identity resolved from principal; AI routes covered by integration tests

---

## Phase 5: User Story 3 — Demo / Local Auth Mode (Priority: P2)

**Goal**: Demo JWT generated at startup in dev profile; token logged at INFO level; dev can use it via `NEXT_PUBLIC_DEV_TOKEN`; existing end-to-end Check-up flow works with demo token.

**Independent Test**: Start backend with `SPRING_PROFILES_ACTIVE=dev` and `DEMO_AUTH_ENABLED=true`. Locate the logged demo token. Set it as `NEXT_PUBLIC_DEV_TOKEN` in `apps/web/.env.local`. Run the Check-up flow in the browser — completes without `401`. Restart backend without dev profile — demo token produces `401`.

### Tests for User Story 3 ⚠️

- [ ] T016 [P] [US3] Write `DemoAuthModeTest` unit test in `services/api/src/test/java/com/frankintest/api/system/security/DemoAuthModeTest.java` — verify `JwtService.generateDemoToken()` produces a validatable token when demo mode is enabled; verify token is rejected by `JwtService.parseToken()` when signed with a different secret (simulating prod env)

### Implementation for User Story 3

- [ ] T017 [US3] Create `DemoAuthConfigurer` in `services/api/src/main/java/com/frankintest/api/system/security/DemoAuthConfigurer.java` — `@Component` active only when `demo-auth.enabled=true` (use `@ConditionalOnProperty`); calls `JwtService.generateDemoToken()` at startup via `@EventListener(ApplicationReadyEvent.class)`; this is the ONLY component responsible for logging the demo token — logs exactly once at INFO level: `"[DEMO] JWT token for local dev (dev mode only): <token>"`; also logs a WARN: `"[DEMO] This token is NOT valid in production."`. `JwtService` itself MUST NOT log the token.
- [ ] T018 [US3] Create `apps/web/src/lib/auth/getDevToken.ts` — exports `getDevToken(): string | null` reading `process.env.NEXT_PUBLIC_DEV_TOKEN ?? null`
- [ ] T019 [US3] Update `apps/web/src/lib/checkup/checkupApi.ts` — add `buildAuthHeaders()` helper that reads `getDevToken()` and `getMockSession().activeOrganization.id`; returns `{ 'Content-Type': 'application/json', ...(token ? { 'Authorization': \`Bearer \${token}\` } : {}), 'X-Organization-Id': orgId }`; apply to `estimateCheckup()`, `runCheckup()`, `getCheckupRun()` fetch calls

**Checkpoint**: Demo token flows end-to-end from backend startup log → `.env.local` → frontend header → backend validation; existing Check-up MVP functional

---

## Phase 6: User Story 4 — LGPD Authorization Confirmation (Priority: P2)

**Goal**: Enforce `userAuthorized` flag server-side with a backend test; verify audit event carries real identity; add LGPD retention comment to frontend for future compliance block.

**Independent Test**: `POST /api/checkup/estimate` with `userAuthorized: false` (or absent) + valid token → `422`. With `userAuthorized: true` + valid token → proceeds. After successful run, `audit_log` row `CHECKUP_AUTHORIZED` has real `user_id`.

### Tests for User Story 4 ⚠️

- [ ] T020 [P] [US4] Write `CheckupLgpdEnforcementTest` integration test in `services/api/src/test/java/com/frankintest/api/checkup/CheckupLgpdEnforcementTest.java` — covers: (a) estimate request with `userAuthorized: false` + valid token → `422 AUTHORIZATION_REQUIRED`; (b) estimate with `userAuthorized: true` + valid token → proceeds; (c) run with `userAuthorized: true` → `audit_log` row `CHECKUP_AUTHORIZED` contains real `userId` (not `user_mock`)

### Implementation for User Story 4

- [ ] T021 [US4] Verify `CheckupService` in `services/api/src/main/java/com/frankintest/api/checkup/CheckupService.java` passes `userId` and `organizationId` from the principal (already wired from T011) to the `AuditService.record()` call for `CHECKUP_AUTHORIZED` — if audit call still uses hardcoded mock strings, update them to use the method-level parameters
- [ ] T022 [US4] Update `apps/web/src/app/checkup/page.tsx` to include visible pt-BR LGPD/privacy copy near the authorization confirmation checkbox. The copy must be rendered in the UI (not only a code comment) and must convey: (1) the user must have authorization to analyze the submitted URL or context, and (2) unnecessary sensitive data should not be submitted. Suggested pt-BR copy: `"Confirmo que tenho autorização para analisar este produto/URL e que não estou submetendo dados sensíveis desnecessários."` — adjust wording to fit the existing UX pattern. Also add a `{/* LGPD: Retention period and data subject request handling defined in docs/SECURITY_LGPD.md — deferred to compliance block */}` comment for future maintainers.

**Checkpoint**: `userAuthorized` enforcement tested; `CHECKUP_AUTHORIZED` audit event carries real identity; LGPD note in place for future block

---

## Phase 7: User Story 5 — CORS and Secret Hygiene (Priority: P3)

**Goal**: CORS uses env-scoped origins (T008 already does this); verify no secrets appear in any response or frontend bundle; add integration test for non-dev origin rejection.

**Independent Test**: With `CORS_ALLOWED_ORIGINS=http://localhost:3000`, an `OPTIONS` preflight from `http://evil.example.com` returns no `Access-Control-Allow-Origin` header (or a rejection). Grep frontend bundle for known secret patterns — none found.

### Tests for User Story 5 ⚠️

- [ ] T023 [P] [US5] Write `CorsConfigTest` integration test in `services/api/src/test/java/com/frankintest/api/system/CorsConfigTest.java` — covers: (a) preflight from `http://localhost:3000` → CORS headers present; (b) preflight from `http://evil.example.com` → no `Access-Control-Allow-Origin` returned

### Implementation for User Story 5

- [ ] T024 [P] [US5] Write CORS allowed-headers assertion in `CorsConfigTest` (same file as T023 or a separate `@Test` method): send an `OPTIONS` preflight to `/api/checkup/estimate` from `http://localhost:3000` and assert the `Access-Control-Allow-Headers` response header contains both `Authorization` and `X-Organization-Id`; this is distinct from T008 (which implements the config) and from T023 (which tests origin rejection)
- [ ] T025 [US5] Add a secret hygiene check to the run report: grep `apps/web/src/` for `JWT_SECRET`, any known provider key patterns, and raw token strings — document findings in run report; if any found, remediate before this task is marked complete

**Checkpoint**: CORS env-scoped and tested; no secrets in frontend; hygiene check documented

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Rate limiting, final audit coverage, regression validation, run report.

- [ ] T026 [P] Create `RateLimitFilter` (`OncePerRequestFilter`) in `services/api/src/main/java/com/frankintest/api/system/ratelimit/RateLimitFilter.java` — applies only to `/api/checkup/run` and `/api/ai/**`; reads `userId` from `SecurityContext`; uses `ConcurrentHashMap<String, Bucket>` with Bucket4j token bucket (20 tokens, refill 20/minute); if bucket empty: returns `429` JSON `{"error":"RATE_LIMIT_EXCEEDED","message":"Limite de requisições atingido. Tente novamente em breve."}` with `Retry-After: 60` header; records `RATE_LIMIT_EXCEEDED` audit event
- [ ] T027 [P] Register `RateLimitFilter` in `SecurityConfig` after `JwtAuthFilter` in `services/api/src/main/java/com/frankintest/api/system/security/SecurityConfig.java` — depends on T006 (`SecurityConfig` created) and T026 (`RateLimitFilter` created)
- [ ] T028 [P] Write `RateLimitFilterTest` integration test in `services/api/src/test/java/com/frankintest/api/system/ratelimit/RateLimitFilterTest.java` — submit 21 authenticated requests to `/api/checkup/run` with the same userId; verify 21st returns `429` with `Retry-After` header; verify `RATE_LIMIT_EXCEEDED` in `audit_log`
- [ ] T029 [P] Write `JwtAuthFilterTest` unit test in `services/api/src/test/java/com/frankintest/api/system/security/JwtAuthFilterTest.java` — covers: (a) missing `Authorization` header → `401`; (b) malformed token → `401`; (c) expired token → `401`; (d) valid token → `SecurityContext` populated with correct `userId`
- [ ] T030 Run full backend test suite: `mvn test -pl services/api` — all existing tests must pass; document any failure
- [ ] T031 [P] Run frontend lint and build: `cd apps/web && npm run lint && npm run build` — must pass with zero errors
- [ ] T032 Verify all new UI-facing strings in `apps/web/src/` are pt-BR; no en/es strings introduced
- [ ] T033 Verify no real AI provider is called in any new test — confirm only `MockAiProvider` is used
- [ ] T035 Manual QA — Demo token E2E regression (SC-003): (1) Start backend with `SPRING_PROFILES_ACTIVE=dev` and `DEMO_AUTH_ENABLED=true`; (2) capture the `[DEMO] JWT token for local dev` from the startup log; (3) set `NEXT_PUBLIC_DEV_TOKEN=<token>` in `apps/web/.env.local`; (4) start the frontend; (5) navigate to the Check-up page and complete an estimate — confirm the response is not `401`; (6) complete a Check-up run — confirm accepted response; (7) restart backend without dev profile and repeat step 5 — confirm `401` is returned. Document pass/fail in run report.
- [ ] T034 Produce run report: changed files, implemented functionality, preserved business rules, tests added, validation commands, known limitations, roadmap/status updates, and suggested commit message

**Checkpoint**: All phases complete; full test suite green; run report produced — ready for manual commit

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 completion — **blocks all user story phases**
- **Phase 3 (US1 — Check-up routes)**: Depends on Phase 2
- **Phase 4 (US2 — AI routes)**: Depends on Phase 2; independent of Phase 3
- **Phase 5 (US3 — Demo mode)**: Depends on Phase 2; benefits from Phase 3 being complete (uses the Check-up flow)
- **Phase 6 (US4 — LGPD)**: Depends on Phase 3 (needs real userId flowing through CheckupService)
- **Phase 7 (US5 — CORS/hygiene)**: Depends on Phase 2 (T008); mostly independent
- **Phase 8 (Polish)**: Depends on all story phases complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no story dependencies
- **US2 (P1)**: Can start after Phase 2 — parallel with US1
- **US3 (P2)**: Can start after Phase 2 — benefits from US1 complete for E2E demo test
- **US4 (P2)**: Depends on US1 (needs principal flowing through CheckupController)
- **US5 (P3)**: Depends only on Phase 2 (T008)

### Within Each User Story

1. Tests written before implementation (constitution requirement for protected behavior changes)
2. Value objects / filter infrastructure before controller updates
3. Controller updates before integration tests that call endpoints
4. Frontend changes after backend is ready (US3)

### Parallel Opportunities

- T003 and T004 (Phase 2): `AuthenticatedPrincipal` and `JwtService` touch different files — parallel
- T005, T007, T008 (Phase 2): Different files — parallel after T003/T004 complete
- T009 and T010 (US1 tests): Different test files — parallel
- T013 (US2 test): Parallel with US1 tests once Phase 2 is done
- T016 (US3 test): Parallel with US1/US2 tests
- T020 (US4 test): Parallel with other tests once US1 implementation (T011) is done
- T023 (US5 test): Parallel with other tests
- T026, T027, T028, T029, T030, T031 (Phase 8): All touch different files — parallel

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Launch in parallel once Phase 1 is complete:
Task T003: Create AuthenticatedPrincipal.java
Task T004: Create JwtService.java
# Once T003 complete:
Task T005: Create JwtAuthFilter.java
Task T006: Create SecurityConfig.java
Task T007: Update WorkspaceAccessService.java
Task T008: Update CorsConfig.java
```

## Parallel Example: User Story 1

```bash
# Launch in parallel once Phase 2 is complete:
Task T009: Write CheckupAuthProtectionTest.java
Task T010: Write CheckupAuditWithIdentityTest.java
# Once tests are written, implement:
Task T011: Update CheckupController.java
Task T012: Add error handling to CheckupController.java
```

---

## Implementation Strategy

### MVP First (US1 + US2 only — both P1)

1. Complete Phase 1: Setup (T001–T002)
2. Complete Phase 2: Foundational (T003–T008) — **critical gate**
3. Complete Phase 3: US1 — Protected Check-up (T009–T012)
4. Complete Phase 4: US2 — Protected AI Routes (T013–T015)
5. **STOP and VALIDATE**: All `/api/checkup/**` and `/api/ai/**` routes protected; `401`/`403` verified; `org_mock`/`user_mock` eliminated
6. Demo/ship this increment if needed

### Full Delivery

1. Setup + Foundational → US1 → US2 → US3 (demo mode) → US4 (LGPD) → US5 (CORS) → Polish
2. Each story independently testable before moving to next

---

## Notes

- [P] tasks = different files, no unresolved upstream dependencies
- [Story] label maps task to user story for traceability
- **Do not commit automatically** — human developer commits manually after reviewing run report (T034)
- All new backend behavior changes require tests written first (T009, T010, T013, T016, T020, T023)
- `NEXT_PUBLIC_DEV_TOKEN` must never be committed to `.env` files tracked in git — add `.env.local` to `.gitignore` if not already present
- Stop at any checkpoint to validate independently before proceeding
