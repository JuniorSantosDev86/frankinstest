# Tasks: Workspace Artifacts Review & Editing

**Input**: Design documents from `specs/009-workspace-artifacts-review-editing/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/artifacts-api.md ✅, quickstart.md ✅

**Tests**: Included per FrankInTest constitution. Backend business rules → unit tests. Backend API, persistence, permission, and audit boundaries → integration tests. Frontend critical flows → component tests. No AI provider calls in this block.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Exact file paths are included in each description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the new module and library skeletons — all structure that must exist before any user story implementation begins.

- [X] T001 Create backend module directory `services/api/src/main/java/com/frankintest/api/workspace/`
- [X] T002 [P] Create frontend lib directory `apps/web/src/lib/artifacts/` with placeholder files `artifactsApi.ts` and `artifactTypes.ts`
- [X] T003 [P] Create frontend page directory `apps/web/src/app/workspace/artifacts/` with placeholder `page.tsx`
- [X] T004 [P] Create frontend components directory `apps/web/src/components/workspace/` (if it does not already exist from earlier blocos)
- [X] T005 [P] Create backend test directory `services/api/src/test/java/com/frankintest/api/workspace/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database index, domain models/DTOs, and expanded repository — these block all user story implementations.

⚠️ **CRITICAL**: No user story work can begin until this phase is complete.

- [X] T006 Add new index to `services/api/src/main/resources/db/schema.sql`: `CREATE INDEX IF NOT EXISTS idx_workspace_artifacts_org_status_type ON workspace_artifacts(organization_id, status, artifact_type);`
- [X] T007 Create `services/api/src/main/java/com/frankintest/api/workspace/ArtifactReviewModels.java` with records: `ArtifactPatch(String title, String description, String status, String details)`, `ArtifactListFilters(String organizationId, String projectId, String sourceCheckupReportId, String artifactType, String status)`, `ArtifactListResponse(List<WorkspaceArtifactRow> artifacts, boolean limitReached)`
- [X] T008 Add `findById(String id, String organizationId)` method to `services/api/src/main/java/com/frankintest/api/conversion/WorkspaceArtifactRepository.java` — query: `SELECT * FROM workspace_artifacts WHERE id = :id AND organization_id = :organizationId`
- [X] T009 Add `findByOrganization(ArtifactListFilters filters)` method to `services/api/src/main/java/com/frankintest/api/conversion/WorkspaceArtifactRepository.java` — dynamic WHERE with optional filters, `ORDER BY created_at DESC LIMIT 200`; also executes a `COUNT(*)` query when result size == 200 to populate `limitReached`
- [X] T010 Add `updateEditableFields(String id, String organizationId, String title, String description, String status, String details)` method to `services/api/src/main/java/com/frankintest/api/conversion/WorkspaceArtifactRepository.java` — individual params (no `ArtifactPatch` dependency; avoids cross-package coupling), COALESCE-based UPDATE, returns boolean (true if row updated)
- [X] T011 [P] Create `apps/web/src/lib/artifacts/artifactTypes.ts` with TypeScript types mirroring the API contract: `WorkspaceArtifact`, `ArtifactListResponse`, `ArtifactPatch`, `ArtifactStatus` enum (`DRAFT | REVIEWED | ACCEPTED | ARCHIVED`), `ArtifactType` enum (`REQUIREMENT | RISK_ITEM | QA_ACTION`)

**Checkpoint**: Foundation ready — repository has all three new methods, DTOs exist, index is in schema, TypeScript types are defined.

---

## Phase 3: User Story 1 — Listar e filtrar artefatos do Workspace (Priority: P1) 🎯 MVP Entry Point

**Goal**: Backend list endpoint with org-scoped filtering and 200-item cap; frontend list page with filter UI and limitReached notice.

**Independent Test**: `GET /api/workspace/artifacts` with valid JWT + correct `X-Organization-Id` returns artifacts for the org. Filters for `artifactType`, `status`, `sourceCheckupReportId` each narrow the results correctly. Requests without JWT return 401; wrong org header returns 403. Frontend shows the list and filter controls with pt-BR copy.

### Tests for User Story 1 ⚠️

- [X] T012 [P] [US1] Write `ArtifactReviewServiceTest` unit tests for list logic in `services/api/src/test/java/com/frankintest/api/workspace/ArtifactReviewServiceTest.java`: valid org + no filters → returns list; invalid `artifactType` param → throws 400 exception; invalid `status` param → throws 400 exception; empty result set → returns empty list; `limitReached` = true when COUNT > 200 (note: 401/403 belong in controller integration tests, not service unit tests)
- [X] T013 [P] [US1] Write `ArtifactReviewControllerIntegrationTest` integration tests for `GET /api/workspace/artifacts` in `services/api/src/test/java/com/frankintest/api/workspace/ArtifactReviewControllerIntegrationTest.java`: no JWT → 401; wrong org → 403; correct org → 200 with artifact list; filter by `artifactType` → filtered result; filter by `status` → filtered result; filter by `sourceCheckupReportId` → filtered result; empty result → 200 empty list

### Implementation for User Story 1

- [X] T014 [US1] Create `services/api/src/main/java/com/frankintest/api/workspace/ArtifactReviewService.java` with method `listArtifacts(String organizationId, ArtifactListFilters filters)`: validate optional `artifactType` and `status` params against enums → 400 if invalid; call `workspaceArtifactRepository.findByOrganization(filters)`; return `ArtifactListResponse` (depends on T007–T010)
- [X] T015 [US1] Create `services/api/src/main/java/com/frankintest/api/workspace/ArtifactReviewController.java` with `GET /api/workspace/artifacts` endpoint: extract `organizationId` from `X-Organization-Id` header; map query params to `ArtifactListFilters`; delegate to `ArtifactReviewService.listArtifacts`; return 200 with `ArtifactListResponse` (depends on T014)
- [X] T016 [P] [US1] Implement `apps/web/src/lib/artifacts/artifactsApi.ts` function `listArtifacts(filters: Partial<ArtifactListFilters>): Promise<ArtifactListResponse>` — fetch wrapper for `GET /api/workspace/artifacts` with query params and required headers (depends on T011)
- [X] T017 [US1] Create `apps/web/src/components/workspace/WorkspaceArtifactList.tsx` — list component with filter controls (dropdowns for `artifactType`, `status`; text input for `sourceCheckupReportId`), artifact rows showing type/title/status/sourceSection/aiAssisted badge, and pt-BR notice "Exibindo os 200 itens mais recentes" when `limitReached` is true (depends on T016)
- [X] T018 [US1] Create `apps/web/src/app/workspace/artifacts/page.tsx` — page component that calls `listArtifacts`, passes result to `WorkspaceArtifactList`, handles loading and error states with pt-BR copy (depends on T017)

**Checkpoint**: `GET /api/workspace/artifacts` is fully functional with auth, org validation, filtering, and 200-cap. Frontend page renders the list with filters. All US1 tests pass.

---

## Phase 4: User Story 2 — Abrir e revisar detalhes de um artefato (Priority: P1)

**Goal**: Backend read-by-ID endpoint; frontend detail panel showing all fields with traceability fields clearly read-only.

**Independent Test**: `GET /api/workspace/artifacts/{id}` with valid JWT + correct org returns the artifact with all fields including traceability. Wrong org → 403. Unknown ID → 404. Frontend detail panel renders all fields with traceability fields non-editable.

### Tests for User Story 2 ⚠️

- [X] T019 [P] [US2] Write `ArtifactReviewServiceTest` unit tests for `getArtifact` in `services/api/src/test/java/com/frankintest/api/workspace/ArtifactReviewServiceTest.java`: valid id + correct org → returns artifact; id not found → throws 404; id exists in another org (findById returns empty because query includes organizationId) → throws 404, not 403 (avoids org enumeration; 403 is only for invalid X-Organization-Id header, enforced by the security filter, not the service)
- [X] T020 [P] [US2] Write `ArtifactReviewControllerIntegrationTest` integration tests for `GET /api/workspace/artifacts/{id}` in `services/api/src/test/java/com/frankintest/api/workspace/ArtifactReviewControllerIntegrationTest.java`: no JWT → 401; missing/invalid X-Organization-Id header → 403; unknown id → 404; valid id from another org (correct JWT but different X-Organization-Id) → 404 (not 403, avoids org enumeration); valid id + correct org → 200 with all fields including traceability

### Implementation for User Story 2

- [X] T021 [US2] Add `getArtifact(String id, String organizationId)` method to `services/api/src/main/java/com/frankintest/api/workspace/ArtifactReviewService.java`: call `workspaceArtifactRepository.findById(id, organizationId)` (query includes `AND organization_id = :organizationId`); if empty → throw 404 (covers both not-found and cross-org cases — never throws 403 for artifact org-mismatch); return artifact (depends on T014)
- [X] T022 [US2] Add `GET /api/workspace/artifacts/{id}` endpoint to `services/api/src/main/java/com/frankintest/api/workspace/ArtifactReviewController.java`: extract org from header; delegate to `ArtifactReviewService.getArtifact`; return 200 with full artifact response (depends on T015, T021)
- [X] T023 [P] [US2] Implement `apps/web/src/lib/artifacts/artifactsApi.ts` function `getArtifact(id: string): Promise<WorkspaceArtifact>` — fetch wrapper for `GET /api/workspace/artifacts/{id}` (depends on T016)
- [X] T024 [US2] Create `apps/web/src/components/workspace/WorkspaceArtifactDetailPanel.tsx` — panel component displaying all artifact fields; traceability fields (`sourceCheckupReportId`, `sourceSection`, `sourceItemIndex`, `aiAssisted`, `createdBy`, `createdAt`) rendered as read-only labels (no input elements); pt-BR labels throughout (depends on T023)
- [X] T025 [US2] Integrate `WorkspaceArtifactDetailPanel` into `apps/web/src/app/workspace/artifacts/page.tsx` — clicking an artifact in the list opens the detail panel; panel shows selected artifact data (depends on T018, T024)

**Checkpoint**: `GET /api/workspace/artifacts/{id}` works with 403/404 guards. Frontend panel displays full artifact with read-only traceability fields. All US2 tests pass.

---

## Phase 5: User Story 3 — Editar título, descrição e status de um artefato (Priority: P1)

**Goal**: Backend PATCH endpoint with immutability enforcement, status validation, details schema validation, and audit event; frontend edit form in the detail panel.

**Independent Test**: `PATCH /api/workspace/artifacts/{id}` with valid `title`/`description`/`status` updates the artifact and returns 200 with updated fields. PATCH containing any immutable field → 400 with pt-BR message. Invalid `status` → 400. Invalid `details` schema → 400. Wrong org → 403. Audit event `ARTIFACT_UPDATED` is recorded. Frontend edit form saves changes and refreshes the panel.

### Tests for User Story 3 ⚠️

- [X] T026 [P] [US3] Write `ArtifactReviewServiceTest` unit tests for `updateArtifact` in `services/api/src/test/java/com/frankintest/api/workspace/ArtifactReviewServiceTest.java`: valid patch → updates and returns artifact; patch with `sourceCheckupReportId` → throws 400; patch with `aiAssisted` → throws 400; patch with `createdBy` → throws 400; patch with `createdAt` → throws 400; empty `title` → throws 400; invalid `status` value → throws 400; **title-only edit → audit event with changedFields=["title"] and previousStatus/newStatus absent** (C1); valid status change DRAFT→REVIEWED → audit event with changedFields containing "status" AND previousStatus="DRAFT" AND newStatus="REVIEWED" (note: 401/403 belong in controller integration tests, not service unit tests); details with invalid schema for REQUIREMENT → throws 400; details with invalid schema for RISK_ITEM → throws 400; details with invalid schema for QA_ACTION → throws 400; details omitted → existing details unchanged
- [X] T027 [P] [US3] Write `ArtifactReviewControllerIntegrationTest` integration tests for `PATCH /api/workspace/artifacts/{id}` in `services/api/src/test/java/com/frankintest/api/workspace/ArtifactReviewControllerIntegrationTest.java`: no JWT → 401; missing/invalid X-Organization-Id → 403; unknown id → 404; artifact from another org (correct JWT, different X-Organization-Id) → 404 (not 403); valid patch → 200 with updated artifact; immutable field in body → 400 with pt-BR message listing fields; invalid status → 400; invalid details → 400; successful patch → audit_log entry exists with correct changedFields; title-only patch → audit_log entry has no previousStatus/newStatus fields

### Implementation for User Story 3

- [X] T028 [US3] Create `IMMUTABLE_FIELDS` constant set in `services/api/src/main/java/com/frankintest/api/workspace/ArtifactReviewService.java`: `{"sourceCheckupReportId","sourceSection","sourceItemIndex","aiAssisted","createdBy","createdAt","organizationId","projectId","id","artifactType"}` — used to validate PATCH payload keys
- [X] T029 [US3] Implement `details` schema validator in `services/api/src/main/java/com/frankintest/api/workspace/ArtifactReviewService.java` — private method `validateDetails(String artifactType, String detailsJson)`: parse JSON, check required fields per type (REQUIREMENT: severity+originalText; RISK_ITEM: severity+riskCategory+originalText; QA_ACTION: priority+action+rationale+originalText); throw 400 with pt-BR message on failure (depends on T028)
- [X] T030 [US3] Add `updateArtifact(String id, String organizationId, String userId, Map<String,Object> rawPatch, ArtifactPatch patch)` method to `services/api/src/main/java/com/frankintest/api/workspace/ArtifactReviewService.java`: (1) check rawPatch.keySet() against IMMUTABLE_FIELDS → 400 with pt-BR list of offending keys (rawPatch detects keys that DTO mapping would silently drop); (2) fetch artifact via `getArtifact(id, organizationId)` → 404 if not found (includes cross-org case); (3) validate patch.title not blank if present → 400; (4) validate patch.status in enum if present → 400; (5) validate patch.details schema if present → 400; (6) compute changedFields by comparing patch values vs current artifact values (include only fields with different non-null values); (7) call `workspaceArtifactRepository.updateEditableFields(id, organizationId, patch.title, patch.description, patch.status, patch.details)` — individual params, no ArtifactPatch dependency in repo; (8) register `ARTIFACT_UPDATED` audit event: always include changedFields; include previousStatus+newStatus ONLY IF "status" is in changedFields; (9) return updated artifact via `getArtifact` (depends on T028, T029)
- [X] T031 [US3] Add `PATCH /api/workspace/artifacts/{id}` endpoint to `services/api/src/main/java/com/frankintest/api/workspace/ArtifactReviewController.java`: extract org from header; extract userId from JWT principal; read raw body as `String`; use Jackson `ObjectMapper` to parse twice — once to `Map<String,Object>` (for immutable key detection) and once to `ArtifactPatch` (for typed field access); pass both to `ArtifactReviewService.updateArtifact`; return 200 with updated artifact; do not use `@RequestBody ArtifactPatch` alone because Spring's DTO binding silently drops unknown/forbidden keys before the service can detect them (depends on T022, T030)
- [X] T032 [P] [US3] Implement `apps/web/src/lib/artifacts/artifactsApi.ts` function `updateArtifact(id: string, patch: ArtifactPatch): Promise<WorkspaceArtifact>` — fetch wrapper for `PATCH /api/workspace/artifacts/{id}`; payload must only contain editable fields (title, description, status, details); never sends traceability fields (depends on T023)
- [X] T033 [US3] Extend `apps/web/src/components/workspace/WorkspaceArtifactDetailPanel.tsx` — add edit mode: inputs for `title` (text), `description` (textarea), `status` (select with DRAFT/REVIEWED/ACCEPTED/ARCHIVED options); "Salvar" and "Cancelar" buttons; calls `updateArtifact`; refreshes panel with updated artifact on success; shows pt-BR error message on 400/403/404; traceability fields remain read-only in both view and edit mode (depends on T025, T032)

**Checkpoint**: `PATCH /api/workspace/artifacts/{id}` enforces all validation rules, immutability, and records audit events. Frontend edit form saves changes correctly. All US3 tests pass.

---

## Phase 6: User Story 4 — Acesso protegido por autenticação e organização (Priority: P1)

**Goal**: Verify that all three endpoints (list, read, PATCH) enforce JWT + `X-Organization-Id` consistently. No new endpoints — this is cross-cutting security validation across the module.

**Independent Test**: All three endpoints return 401 without JWT and 403 with wrong `X-Organization-Id`. These are already partially tested in US1–US3; this phase adds the cross-cutting integration test that exercises all three in a single test class run.

### Tests for User Story 4 ⚠️

- [X] T034 [P] [US4] Add security boundary integration tests to `services/api/src/test/java/com/frankintest/api/workspace/ArtifactReviewControllerIntegrationTest.java` — parametrized or grouped tests covering all three endpoints (GET list, GET by id, PATCH) for: missing JWT → 401; expired JWT → 401; missing `X-Organization-Id` header → 403; valid JWT + invalid/unknown X-Organization-Id → 403; GET /{id} with valid JWT but artifact belongs to different org → 404 (not 403, avoids org enumeration); PATCH with valid JWT but artifact belongs to different org → 404 without modifying the artifact (verify artifact unchanged via subsequent GET with correct org)

### Implementation for User Story 4

- [X] T035 [US4] Verify that `ArtifactReviewController` routes are protected by the existing `JwtAuthFilter` (or equivalent `SecurityFilterChain` path matcher used in Bloco 11) by confirming `/api/workspace/artifacts/**` is included in the protected path pattern — check `services/api/src/main/java/com/frankintest/api/security/SecurityConfig.java` (or equivalent); confirm `X-Organization-Id` is extracted and validated in `ArtifactReviewController` consistently with `ConversionController` (Bloco 13); if the path is not covered, add `/api/workspace/artifacts/**` to the protected paths list
- [X] T036 [US4] Verify that rate limiting configuration from Bloco 11 covers `/api/workspace/artifacts/**` — check the rate limiter filter or config class in `services/api/src/main/java/com/frankintest/api/security/` (e.g., `RateLimitingFilter.java` or equivalent): if the path is covered by a wildcard pattern (e.g., `/api/**`), no change is needed; if the config uses explicit path lists, add `/api/workspace/artifacts/**` to the list; add an integration test or manual curl test confirming that excessive requests to `GET /api/workspace/artifacts` from the same client are rate-limited after the configured threshold

**Checkpoint**: All three endpoints are confirmed to reject unauthenticated and cross-org requests. No auth regression from Blocos 10–13.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, pt-BR copy audit, regression checks, and run report.

- [X] T037 [P] Run full backend test suite `cd services/api && ./mvnw test` and confirm all tests pass including Bloco 10–13 regression tests
- [X] T038 [P] Run frontend lint and build `cd apps/web && npm run lint && npm run build` and confirm no errors
- [X] T039 [P] Run frontend tests `cd apps/web && npm test` if test runner is configured
- [X] T040 Audit all new pt-BR UI copy in `WorkspaceArtifactList.tsx`, `WorkspaceArtifactDetailPanel.tsx`, and `page.tsx` — confirm: no English labels, status values displayed in pt-BR labels (not raw enum values), `limitReached` notice text, error messages, button labels, field labels all in pt-BR
- [X] T040a [P] Add frontend component test for `WorkspaceArtifactList.tsx` in `apps/web/tests/` — mock `listArtifacts` to return `{ artifacts: [...], limitReached: true }` and assert the pt-BR notice "Exibindo os 200 itens mais recentes" (or equivalent) is rendered in the DOM (C3)
- [X] T040b Verify SC-009: status change requires ≤ 3 user interactions — document the exact UX flow in a manual QA note or add a component test asserting that the status select control and save button are visible in the detail panel without requiring additional navigation steps; the expected flow is: (1) open/select artifact from list, (2) choose new status from dropdown, (3) click "Salvar" — no modal, no confirmation dialog, no page reload required (C2)
- [X] T041 Confirm `artifactsApi.ts` never sends `organizationId`, `projectId`, `sourceCheckupReportId`, `sourceSection`, `sourceItemIndex`, `aiAssisted`, `createdBy`, or `createdAt` in PATCH payload — code review of `updateArtifact` fetch wrapper
- [X] T042 Verify new index `idx_workspace_artifacts_org_status_type` is present in `services/api/src/main/resources/db/schema.sql` and confirm it is applied on schema initialization; also confirm `updated_at` column exists in `workspace_artifacts` via `SELECT column_name FROM information_schema.columns WHERE table_name = 'workspace_artifacts' AND column_name = 'updated_at'` — if missing, add `ALTER TABLE workspace_artifacts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;` to schema.sql (U3)
- [X] T043 [P] Execute quickstart.md validation commands against running local environment (docker compose up, curl list, curl read, curl PATCH, curl 401/403 checks, audit_log verification)
- [X] T044 Confirm no AI provider call is introduced in this block — grep for `AnthropicProvider`, `AiRunService`, or any provider import in `workspace/` module and `artifacts/` lib
- [X] T045 Produce run report covering: changed files, implemented functionality, preserved business rules (Blocos 10–13 unmodified), tests added, validation commands executed, known limitations, roadmap/status updates, and suggested commit message

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US1 — List)**: Depends on Phase 2
- **Phase 4 (US2 — Read)**: Depends on Phase 2; integrates with Phase 3 frontend (panel opens from list)
- **Phase 5 (US3 — PATCH)**: Depends on Phase 4 (uses `getArtifact` internally; extends detail panel)
- **Phase 6 (US4 — Security)**: Depends on Phases 3–5 (cross-cutting over all three endpoints)
- **Phase 7 (Polish)**: Depends on all previous phases

### Within Each User Story

- Tests MUST be written before or alongside the service implementation
- Repository methods (Phase 2) before service methods
- Service methods before controller endpoints
- Backend endpoint before frontend fetch wrapper
- Fetch wrapper before UI component

### Parallel Opportunities Per Phase

**Phase 1**: T001, T002, T003, T004, T005 — all independent, run in parallel

**Phase 2**: T006 (schema) → T007, T008, T009, T010 can run in parallel after T006; T011 independent of backend

**Phase 3**: T012 + T013 in parallel (tests); T016 independent of backend (types already defined); T015 after T014; T017 after T016; T018 after T017

**Phase 4**: T019 + T020 in parallel (tests); T023 parallel with backend work; T021 after T014; T022 after T021; T024 after T023; T025 after T018+T024

**Phase 5**: T026 + T027 in parallel (tests); T032 parallel with backend; T028 first; T029 after T028; T030 after T029; T031 after T030; T033 after T025+T032

**Phase 7**: T037, T038, T039, T042, T044 all independent — run in parallel

---

## Implementation Strategy

### MVP First (Phase 1 + 2 + 3 only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (list endpoint + frontend list page)
4. **STOP and VALIDATE**: `GET /api/workspace/artifacts` works, frontend shows artifact list
5. Proceed to Phase 4 when ready

### Incremental Delivery

1. Setup + Foundational → skeleton ready
2. Phase 3 (US1) → users can list artifacts ✅
3. Phase 4 (US2) → users can open and inspect an artifact ✅
4. Phase 5 (US3) → users can edit title/description/status ✅
5. Phase 6 (US4) → security cross-cutting validated ✅
6. Phase 7 → full validation + run report ✅

---

## Notes

- [P] tasks = different files, no dependencies on in-progress tasks in same phase
- `WorkspaceArtifactRepository` lives in `conversion/` package (Bloco 13) — new methods are added there, not in `workspace/`
- `WorkspaceArtifactRepository.updateEditableFields` takes individual String params (title, description, status, details), NOT `ArtifactPatch` — this prevents the `conversion/` package from depending on `workspace/` DTOs (I1)
- `ArtifactPatch`, `ArtifactListFilters`, `ArtifactListResponse` all live in `workspace/` package only
- `ArtifactReviewController` and `ArtifactReviewService` are new classes in `workspace/` package
- PATCH body must be read as raw `String` and parsed twice with Jackson: once to `Map<String,Object>` (for forbidden key detection), once to `ArtifactPatch` (for typed access) — Spring `@RequestBody` DTO binding alone silently drops unknown keys before validation (U2)
- Cross-org artifact access returns 404, not 403 — avoids revealing artifact existence in other organizations (I3)
- `details` validation uses the same per-`artifactType` schema defined in Bloco 13 `data-model.md`
- Do not commit automatically — the human developer commits manually
- Stop at Phase 3 checkpoint to validate the list story independently before proceeding
