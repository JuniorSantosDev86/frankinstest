---

description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Include tests required by the FrankInTest constitution. Backend business rules
require unit tests. Backend API, persistence, permission, credit, and audit boundaries require
integration tests when applicable. Frontend critical flows require component or E2E tests when
applicable. AI provider calls MUST be mocked in tests.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `apps/web/src/`, `apps/web/tests/`
- **Backend**: `services/api/src/main/java/com/frankintest/api/`,
  `services/api/src/test/java/com/frankintest/api/`
- **Infrastructure**: `infra/`
- **Documentation**: `docs/`, `specs/[###-feature-name]/`
- Paths shown below are examples - adjust based on plan.md structure

<!--
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.

  The /speckit-tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (with their priorities P1, P2, P3...)
  - Feature requirements from plan.md
  - Entities from data-model.md
  - Endpoints from contracts/

  Tasks MUST be organized by user story so each story can be:
  - Implemented independently
  - Tested independently
  - Delivered as an MVP increment

  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create project structure per implementation plan
- [ ] T002 Initialize [language] project with [framework] dependencies
- [ ] T003 [P] Configure linting and formatting tools

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

Examples of foundational tasks (adjust based on your project):

- [ ] T004 Setup database schema and migrations framework
- [ ] T005 [P] Implement authentication/authorization framework
- [ ] T006 [P] Setup API routing and middleware structure
- [ ] T007 Create base models/entities that all stories depend on
- [ ] T008 Configure error handling and logging infrastructure
- [ ] T009 Setup environment configuration management
- [ ] T010 Define backend module boundary in services/api for business rules, permissions,
  credits, AI runs, audit logs, and integrations touched by this feature
- [ ] T011 Define structured QA artifact persistence and ownership rules when this feature
  creates requirements, tests, bugs, evidence, reports, drift findings, or AI suggestions

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 1 ⚠️

> **NOTE: Write required tests FIRST when changing business rules or protected behavior.
> AI provider boundaries MUST be mocked.**

- [ ] T012 [P] [US1] Backend unit test for [business rule] in services/api/src/test/java/com/frankintest/api/[module]/
- [ ] T013 [P] [US1] Backend integration/API test for [endpoint or permission boundary] in services/api/src/test/java/com/frankintest/api/[module]/
- [ ] T014 [P] [US1] Frontend component or E2E test for [critical flow] in apps/web/tests/

### Implementation for User Story 1

- [ ] T015 [P] [US1] Create/update backend domain model in services/api/src/main/java/com/frankintest/api/[module]/
- [ ] T016 [P] [US1] Create/update frontend UI in apps/web/src/[feature]/
- [ ] T017 [US1] Implement backend service rules in services/api/src/main/java/com/frankintest/api/[module]/ (depends on T015)
- [ ] T018 [US1] Implement REST endpoint/controller in services/api/src/main/java/com/frankintest/api/[module]/
- [ ] T019 [US1] Connect frontend to backend API through approved client boundary in apps/web/src/[feature]/
- [ ] T020 [US1] Add backend validation, permission checks, entitlement/credit checks, and audit logging as applicable
- [ ] T021 [US1] Ensure UI copy is pt-BR and no secrets/provider calls exist in frontend code

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 2 ⚠️

- [ ] T022 [P] [US2] Backend unit test for [business rule] in services/api/src/test/java/com/frankintest/api/[module]/
- [ ] T023 [P] [US2] Backend integration/API test for [endpoint or permission boundary] in services/api/src/test/java/com/frankintest/api/[module]/
- [ ] T024 [P] [US2] Frontend component or E2E test for [critical flow] in apps/web/tests/

### Implementation for User Story 2

- [ ] T025 [P] [US2] Create/update backend domain model in services/api/src/main/java/com/frankintest/api/[module]/
- [ ] T026 [US2] Implement backend service rules in services/api/src/main/java/com/frankintest/api/[module]/
- [ ] T027 [US2] Implement REST endpoint/controller in services/api/src/main/java/com/frankintest/api/[module]/
- [ ] T028 [US2] Implement frontend flow in apps/web/src/[feature]/
- [ ] T029 [US2] Integrate with User Story 1 components (if needed)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 3 ⚠️

- [ ] T030 [P] [US3] Backend unit test for [business rule] in services/api/src/test/java/com/frankintest/api/[module]/
- [ ] T031 [P] [US3] Backend integration/API test for [endpoint or permission boundary] in services/api/src/test/java/com/frankintest/api/[module]/
- [ ] T032 [P] [US3] Frontend component or E2E test for [critical flow] in apps/web/tests/

### Implementation for User Story 3

- [ ] T033 [P] [US3] Create/update backend domain model in services/api/src/main/java/com/frankintest/api/[module]/
- [ ] T034 [US3] Implement backend service rules in services/api/src/main/java/com/frankintest/api/[module]/
- [ ] T035 [US3] Implement REST endpoint/controller in services/api/src/main/java/com/frankintest/api/[module]/
- [ ] T036 [US3] Implement frontend flow in apps/web/src/[feature]/

**Checkpoint**: All user stories should now be independently functional

---

[Add more user story phases as needed, following the same pattern]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] TXXX [P] Documentation updates in docs/
- [ ] TXXX Code cleanup and refactoring
- [ ] TXXX Performance optimization across all stories
- [ ] TXXX [P] Additional backend unit/integration tests in services/api/src/test/java/com/frankintest/api/
- [ ] TXXX [P] Additional frontend component/E2E tests in apps/web/tests/
- [ ] TXXX Security hardening
- [ ] TXXX Verify AI outputs are structured QA artifacts and AI providers are mocked in tests
- [ ] TXXX Verify credit estimation, failure handling, and audit events for expensive AI operations
- [ ] TXXX Verify all new MVP UI copy is pt-BR
- [ ] TXXX Run quickstart.md validation
- [ ] TXXX Produce required run report with changed files, functionality, preserved business
  rules, tests, validation commands, limitations, roadmap/status updates, and suggested commit
  message

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable

### Within Each User Story

- Required tests MUST be written before implementation when changing business rules or
  protected behavior
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (if tests requested):
Task: "Contract test for [endpoint] in tests/contract/test_[name].py"
Task: "Integration test for [user journey] in tests/integration/test_[name].py"

# Launch all models for User Story 1 together:
Task: "Create [Entity1] model in src/models/[entity1].py"
Task: "Create [Entity2] model in src/models/[entity2].py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify required tests fail before implementing when practical
- Do not commit automatically; the human developer commits manually
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
