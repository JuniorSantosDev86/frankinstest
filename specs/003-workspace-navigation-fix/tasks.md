# Tasks: Workspace Navigation Fix

**Input**: Design documents from `/specs/003-workspace-navigation-fix/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/workspace-navigation.md, quickstart.md

**Tests**: Required by feature spec. Frontend critical navigation behavior must be covered with existing Node test runner/source-level tests and at least one behavior-level frontend validation proving that selecting an enabled sidebar item changes the active/visible Workspace detail area, not only source strings or mappings. Validate with `npm run lint`, `npm test`, and `npm run build` from `apps/web`.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Context)

**Purpose**: Confirm current Workspace navigation shape and existing test surface before changing behavior.

- [x] T001 Inspect existing sidebar groups, overview CTA hashes, detail tabs, and active-tab state in `apps/web/src/app/components/WorkspaceDashboard.tsx`
- [x] T002 Inspect current Workspace detail rendering and `activeDetailTab` ownership in `apps/web/src/app/page.tsx`
- [x] T003 [P] Inspect existing source-level frontend navigation assertions in `apps/web/tests/product-skeleton.test.mjs`
- [x] T004 [P] Review enabled, disabled, and Configuracoes target requirements in `specs/003-workspace-navigation-fix/contracts/workspace-navigation.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the canonical navigation model required by all user stories.

**CRITICAL**: No user story work should begin until the canonical target mapping is defined.

- [x] T005 Define and export canonical Workspace navigation target types in `apps/web/src/app/components/WorkspaceDashboard.tsx`
- [x] T006 Define and export the canonical enabled/disabled Workspace navigation target registry in `apps/web/src/app/components/WorkspaceDashboard.tsx`
- [x] T007 Map each enabled hash to its active detail domain and optional inner section in `apps/web/src/app/components/WorkspaceDashboard.tsx`
- [x] T008 Decide Configuracoes in `apps/web/src/app/components/WorkspaceDashboard.tsx`: map it to a valid section if an existing settings section exists, otherwise mark it disabled/future/out-of-scope and prevent active hash updates
- [x] T009 Ensure disabled, future, or out-of-scope targets remain represented as disabled and excluded from enabled navigation assertions in `apps/web/src/app/components/WorkspaceDashboard.tsx`
- [x] T010 [P] Add source-level tests asserting every enabled sidebar hash has a canonical navigation target in `apps/web/tests/product-skeleton.test.mjs`
- [x] T011 [P] Add source-level tests asserting disabled, future, or out-of-scope targets do not participate in enabled navigation coverage in `apps/web/tests/product-skeleton.test.mjs`
- [x] T012 [P] Add source-level tests asserting Configuracoes follows the decided enabled-or-disabled contract in `apps/web/tests/product-skeleton.test.mjs`

**Checkpoint**: Canonical navigation registry exists and can be tested independently of visual behavior.

---

## Phase 3: User Story 1 - Navegar pelo Workspace pela sidebar (Priority: P1) MVP

**Goal**: Clicking any enabled Workspace sidebar item makes the matching Workspace section/domain visibly active instead of only changing the URL hash.

**Independent Test**: Click or simulate each enabled sidebar target and verify the matching domain/section becomes the active Workspace content area while disabled targets remain inactive.

### Tests for User Story 1

- [x] T013 [P] [US1] Add tests for enabled sidebar target to active domain mapping in `apps/web/tests/product-skeleton.test.mjs`
- [x] T014 [P] [US1] Add tests ensuring active sidebar state is not hard-coded only to Control Tower in `apps/web/tests/product-skeleton.test.mjs`
- [x] T015 [P] [US1] Add tests covering enabled target coverage for product, QA design, execution, quality, reports, and AI/credits domains in `apps/web/tests/product-skeleton.test.mjs`
- [x] T016 [P] [US1] Add a behavior-level frontend validation proving selecting an enabled sidebar item changes the active/visible Workspace detail area in `apps/web/tests/product-skeleton.test.mjs` or a focused adjacent test file under `apps/web/tests/`

### Implementation for User Story 1

- [x] T017 [US1] Update `SidebarNav` props to receive active hash and navigation handler in `apps/web/src/app/components/WorkspaceDashboard.tsx`
- [x] T018 [US1] Replace Control Tower-only active styling with canonical active target styling in `apps/web/src/app/components/WorkspaceDashboard.tsx`
- [x] T019 [US1] Prevent disabled, future, or out-of-scope sidebar targets from changing active state or URL/hash while preserving current disabled visuals in `apps/web/src/app/components/WorkspaceDashboard.tsx`
- [x] T020 [US1] Wire enabled sidebar selection to update active Workspace detail domain in `apps/web/src/app/page.tsx`
- [x] T021 [US1] Ensure selected enabled sidebar targets display the mapped main Workspace detail/domain area as the primary navigation effect in `apps/web/src/app/page.tsx`
- [x] T022 [US1] Preserve existing PT-BR labels and current visual design classes while updating navigation behavior in `apps/web/src/app/components/WorkspaceDashboard.tsx`

**Checkpoint**: User Story 1 is independently functional; enabled sidebar clicks visibly change Workspace content and active sidebar state.

---

## Phase 4: User Story 2 - Manter URL e estado ativo sincronizados (Priority: P2)

**Goal**: URL hash, active sidebar item, and displayed/focused Workspace section always represent the same selected enabled target.

**Independent Test**: Simulate hash-changing navigation across enabled targets and verify the canonical active state remains synchronized.

### Tests for User Story 2

- [x] T023 [P] [US2] Add tests for hash-to-active-domain synchronization for enabled targets in `apps/web/tests/product-skeleton.test.mjs`
- [x] T024 [P] [US2] Add tests for overview CTA hashes using the same canonical navigation contract in `apps/web/tests/product-skeleton.test.mjs`
- [x] T025 [P] [US2] Add tests for rapid enabled-target changes resolving to the last selected target in `apps/web/tests/product-skeleton.test.mjs`
- [x] T026 [P] [US2] Add tests asserting disabled/future/out-of-scope targets, including Configuracoes when disabled, do not update URL/hash as active targets in `apps/web/tests/product-skeleton.test.mjs`

### Implementation for User Story 2

- [x] T027 [US2] Add a hash normalization helper for Workspace navigation targets in `apps/web/src/app/components/WorkspaceDashboard.tsx`
- [x] T028 [US2] Add a resolver that derives active Workspace navigation state from a hash in `apps/web/src/app/components/WorkspaceDashboard.tsx`
- [x] T029 [US2] Use the resolver when enabled sidebar and overview navigation targets are selected in `apps/web/src/app/page.tsx`
- [x] T030 [US2] Update overview CTA links to use the canonical navigation handler without changing existing copy in `apps/web/src/app/components/WorkspaceDashboard.tsx`
- [x] T031 [US2] Keep detail-domain tab clicks synchronized with canonical hash and active sidebar state in `apps/web/src/app/page.tsx`

**Checkpoint**: User Stories 1 and 2 both work independently; hash, sidebar active state, and active Workspace content remain synchronized for enabled targets.

---

## Phase 5: User Story 3 - Abrir uma URL com hash diretamente (Priority: P3)

**Goal**: Opening or reloading a Workspace URL with a valid enabled hash activates the matching section; missing, invalid, disabled, or obsolete hashes recover to a valid default state.

**Independent Test**: Initialize the Workspace state from valid enabled, missing, invalid, disabled, and obsolete hash values and verify the expected active target.

### Tests for User Story 3

- [x] T032 [P] [US3] Add tests for valid enabled hash initialization resolving to expected active domains in `apps/web/tests/product-skeleton.test.mjs`
- [x] T033 [P] [US3] Add tests for missing hash fallback to the existing default Workspace state in `apps/web/tests/product-skeleton.test.mjs`
- [x] T034 [P] [US3] Add tests for invalid, disabled, or obsolete hash fallback without misleading active sidebar state in `apps/web/tests/product-skeleton.test.mjs`

### Implementation for User Story 3

- [x] T035 [US3] Initialize active Workspace navigation state from `window.location.hash` after client mount in `apps/web/src/app/page.tsx`
- [x] T036 [US3] Listen for browser hash changes and resolve them through the canonical navigation registry in `apps/web/src/app/page.tsx`
- [x] T037 [US3] Apply the existing default Workspace state when no valid enabled hash target exists in `apps/web/src/app/page.tsx`
- [x] T038 [US3] Ensure hash-based initialization does not reintroduce hydration mismatch or localStorage first-render instability in `apps/web/src/app/page.tsx`

**Checkpoint**: All user stories are independently functional and cover click navigation, synchronized state, and hash reload/direct-entry.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate scope boundaries, accessibility/focus mechanics, quality requirements, and run report readiness.

- [x] T039 [P] Ensure active Workspace sections have stable target identifiers for focus/scroll behavior in `apps/web/src/app/page.tsx`
- [x] T040 [P] Ensure active sidebar state remains keyboard/screen-reader friendly within existing UI patterns in `apps/web/src/app/components/WorkspaceDashboard.tsx`
- [x] T041 [P] Ensure section activation cannot leave target content visually hidden or covered by sticky layout elements in `apps/web/src/app/page.tsx`
- [x] T042 [P] Verify no backend files under `services/api/` were changed for this feature
- [x] T043 [P] Verify no new AI provider calls, frontend secrets, billing, auth, credit, or audit behavior were introduced in `apps/web/src/`
- [x] T044 [P] Verify new or changed user-facing copy remains PT-BR in `apps/web/src/app/components/WorkspaceDashboard.tsx` and `apps/web/src/app/page.tsx`
- [x] T045 Run `npm run lint` from `apps/web`
- [x] T046 Run `npm test` from `apps/web`
- [x] T047 Run `npm run build` from `apps/web`
- [x] T048 Execute the manual QA checklist from `specs/003-workspace-navigation-fix/quickstart.md`
- [x] T049 Update implementation notes or status docs only if actual implementation changes require documentation updates in `docs/CURRENT_STATUS.md` or `docs/ROADMAP.md`
- [x] T050 Produce the required run report with changed files, functionality, preserved business rules, tests, validation commands, limitations, roadmap/status updates, and suggested commit message

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; can start immediately.
- **Foundational (Phase 2)**: Depends on setup; blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on foundational registry; MVP scope.
- **User Story 2 (Phase 4)**: Depends on foundational registry and can reuse US1 active-state wiring.
- **User Story 3 (Phase 5)**: Depends on the canonical resolver from US2.
- **Polish (Phase 6)**: Depends on desired user stories being complete.

### User Story Dependencies

- **US1**: Required MVP. Delivers visible active-domain sidebar navigation for enabled targets.
- **US2**: Builds on the same registry and active state to keep URL/hash synchronized.
- **US3**: Builds on the resolver to support reload/direct-entry.

### Parallel Opportunities

- T003 and T004 can run in parallel during setup.
- T010, T011, and T012 can run in parallel after registry shape is known.
- US1 test tasks T013-T016 can run in parallel before implementation.
- US2 test tasks T023-T026 can run in parallel before implementation.
- US3 test tasks T032-T034 can run in parallel before implementation.
- Polish verification tasks T039-T044 can run in parallel before final commands.

---

## Parallel Example: User Story 1

```text
Task: "Add tests for enabled sidebar target to active domain mapping in apps/web/tests/product-skeleton.test.mjs"
Task: "Add tests ensuring active sidebar state is not hard-coded only to Control Tower in apps/web/tests/product-skeleton.test.mjs"
Task: "Add a behavior-level frontend validation proving selecting an enabled sidebar item changes the active/visible Workspace detail area in apps/web/tests/product-skeleton.test.mjs or a focused adjacent test file under apps/web/tests/"
```

---

## Parallel Example: User Story 2

```text
Task: "Add tests for hash-to-active-domain synchronization for enabled targets in apps/web/tests/product-skeleton.test.mjs"
Task: "Add tests for overview CTA hashes using the same canonical navigation contract in apps/web/tests/product-skeleton.test.mjs"
Task: "Add tests asserting disabled/future/out-of-scope targets, including Configuracoes when disabled, do not update URL/hash as active targets in apps/web/tests/product-skeleton.test.mjs"
```

---

## Parallel Example: User Story 3

```text
Task: "Add tests for valid enabled hash initialization resolving to expected active domains in apps/web/tests/product-skeleton.test.mjs"
Task: "Add tests for missing hash fallback to the existing default Workspace state in apps/web/tests/product-skeleton.test.mjs"
Task: "Add tests for invalid, disabled, or obsolete hash fallback without misleading active sidebar state in apps/web/tests/product-skeleton.test.mjs"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 setup.
2. Complete Phase 2 canonical navigation registry, including the Configuracoes decision.
3. Complete Phase 3 sidebar active-domain navigation.
4. Stop and validate US1 independently before adding reload/direct-entry behavior.

### Incremental Delivery

1. Registry and tests establish shared enabled-target navigation contract.
2. US1 fixes the user-visible non-navigable Workspace issue.
3. US2 synchronizes URL/hash with active state.
4. US3 completes reload/direct-entry behavior.
5. Polish validates accessibility/focus, scope, commands, and run report.

### Notes

- No tasks require backend changes.
- No tasks introduce AI, billing, auth, credits, audit, or i18n expansion.
- Disabled, future, or out-of-scope sidebar items are not counted as failing navigation targets.
- Keep changes tightly scoped to `WorkspaceDashboard.tsx`, `page.tsx`, and frontend tests unless implementation discovers an existing local helper is a better fit.
- Do not commit automatically; the human developer commits manually.
