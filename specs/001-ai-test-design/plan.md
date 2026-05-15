# Implementation Plan: AI Test Design Assistance

**Branch**: `001-ai-test-design` | **Date**: 2026-05-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-ai-test-design/spec.md`

**Note**: Clarification was started but skipped by moving directly to planning. The credit lifecycle decision is resolved in this plan as reserve-before-run, capture-on-success, release-on-platform/provider-failure to reduce downstream ambiguity.

## Summary

Deliver the first trusted AI-assisted QA workflow in the Workspace: estimate credits, generate draft AI-assisted test scenarios from business rules, generate draft AI-assisted test cases from scenarios, and track each AI run and credit movement server-side. The implementation uses the existing monorepo split: `apps/web` renders the pt-BR UX and calls product APIs only; `services/api` owns provider abstraction, orchestration, persistence, permission stubs/foundation, credit lifecycle, audit events, and structured output validation.

## Technical Context

**Language/Version**: Frontend uses Next.js + TypeScript in `apps/web`; backend uses Java 21+ target with Spring Boot in `services/api`. Current `pom.xml` declares Java 25 and should be corrected or aligned to the official Java 21+ project rule during implementation.

**Primary Dependencies**: Next.js, TypeScript, Tailwind, Spring Boot Web, Spring JDBC, PostgreSQL driver, Jackson, H2 for backend tests, existing Node test setup in `apps/web/tests`.

**Storage**: PostgreSQL is the source of truth. Existing `services/api/src/main/resources/db/schema.sql` already defines `ai_runs` and `credit_transactions`; this feature extends them and adds structured artifact persistence/foundation as needed.

**Testing**: Backend unit tests for credit calculation/lifecycle, provider selection, output validation, and AI run state transitions. Backend integration tests for estimate/generate endpoints, persistence, permission/project validation foundation, and failure behavior. Frontend tests for estimate-first UX, loading/success/error states, pt-BR labels, and no provider-direct calls.

**Target Platform**: Local development via Docker Compose/PostgreSQL and browser frontend. Backend deployable as the MVP modular monolith.

**Project Type**: FrankInTest vertical slice touching `services/api`, `apps/web`, `infra` only if env/docs require it, and documentation.

**Performance Goals**: For mock/local generation, estimate response should be perceived as immediate and generation should complete within 2 seconds. With a real provider enabled, users should see a loading state immediately and the UI should tolerate provider latency while preserving run traceability.

**Constraints**: No provider secrets in frontend. No direct frontend AI provider calls. No streaming. No billing purchase flow. No Check-up flow. No autonomous crawling or invasive scanning. New UI copy in pt-BR only. Automated tests must use the mock provider.

**Scale/Scope**: MVP scope supports small single-artifact inputs: one business rule to a bounded set of scenarios and one scenario to a bounded set of test cases. Batch generation, long-running queues, multi-document context, and workers are deferred.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Architecture boundary**: PASS. UI remains in `apps/web`; trusted AI orchestration, credits, persistence, audit, and security decisions live in `services/api`; PostgreSQL remains the persistent source of truth.
- **Modular monolith**: PASS. Backend work stays inside the Spring Boot modular monolith with internal packages for `airuns`, `credits`, `testdesign`, `audit`, and AI provider adapters.
- **Responsibility boundary**: PASS. Frontend only displays estimate/generation state and calls backend product APIs.
- **AI governance**: PASS. AI outputs become draft test scenarios/test cases; runs are tracked server-side; credits are estimated first; platform/provider failures release reserved credits; tests use mock provider.
- **Security/LGPD**: PASS. Secrets are server-side only, protected requests validate organization/project access foundation, sensitive actions are audit logged, no URL Check-up or invasive scan is in scope.
- **Product language**: PASS. All new UI copy is pt-BR only.
- **Testing discipline**: PASS. Backend unit/integration tests and frontend tests are planned for the critical flow.
- **Execution discipline**: PASS. Scope is a vertical slice and avoids unrelated redesign, microservices, billing purchase, workers, and Check-up.

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-test-design/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ai-test-design.openapi.yaml
└── tasks.md
```

### Source Code (repository root)

```text
apps/web/
├── src/app/components/
│   ├── AiGenerationModal.tsx
│   ├── TestScenarioSection.tsx
│   └── TestCaseSection.tsx
├── src/lib/ai-assistance/
│   ├── aiAssistanceClient.ts
│   └── types.ts
└── tests/
    └── ai-assistance.test.mjs

services/api/
├── src/main/java/com/frankintest/api/
│   ├── airuns/
│   ├── credits/
│   ├── testdesign/
│   ├── audit/
│   ├── ai/
│   │   ├── provider/
│   │   └── orchestration/
│   └── system/
├── src/main/resources/
│   ├── application.yml
│   └── db/schema.sql
└── src/test/java/com/frankintest/api/
    ├── airuns/
    ├── credits/
    ├── testdesign/
    └── ai/

docs/
├── API_DESIGN.md
├── DATA_MODEL.md
├── CURRENT_STATUS.md
└── ROADMAP.md
```

**Structure Decision**: Implement as a full vertical slice across existing `apps/web` and `services/api`. Backend packages remain explicit by domain inside the monolith; frontend keeps AI assistance as a product API client plus Workspace UI state. Documentation updates are limited to API/env/status changes needed by this block.

## Complexity Tracking

No constitution violations identified. No additional services, queues, workers, broad redesign, or billing provider integration are introduced.

## Phase 0: Research Summary

See [research.md](./research.md). Key decisions:

- Use a backend-owned AI provider abstraction with a deterministic mock provider as default for tests and local development.
- Use reserve-before-run, capture-on-success, release-on-platform/provider-failure for credit lifecycle.
- Keep synchronous MVP generation bounded to one source artifact per request.
- Validate provider output into structured draft QA artifacts before saving or returning success.

## Phase 1: Design Summary

See [data-model.md](./data-model.md), [contracts/ai-test-design.openapi.yaml](./contracts/ai-test-design.openapi.yaml), and [quickstart.md](./quickstart.md).

Post-design constitution re-check: PASS. The design keeps secrets server-side, AI orchestration and credit accounting in the backend, UI copy in pt-BR, and output as structured QA artifacts rather than loose chat.
