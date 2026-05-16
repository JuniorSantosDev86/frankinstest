# Implementation Plan: AI Foundation Cleanup & Spec Alignment

**Branch**: `002-ai-foundation-cleanup` | **Date**: 2026-05-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-ai-foundation-cleanup/spec.md`

**Note**: Clarification was started but superseded by `/speckit-plan`. The compatibility rule is now promoted into `spec.md`: legacy endpoints still used by `apps/web` may remain only as compatibility wrappers that delegate to the canonical AI Test Design orchestration path; no duplicated business logic may remain active.

## Summary

Normalize the Bloco 09A/09B AI foundation before Check-up MVP by making the AI Test Design orchestration path the only canonical architecture. The implementation will audit current AI backend classes, preserve the `/api/ai/test-design/*` and safe run-status behavior used by `apps/web`, remove or adapt legacy `/api/ai/*` orchestration code, keep provider calls server-side, keep automated tests on the mock provider, and update docs/status so the product has one clear AI foundation.

## Technical Context

**Language/Version**: Frontend uses Next.js + TypeScript in `apps/web`; backend uses Java 21 with Spring Boot in `services/api`.

**Primary Dependencies**: Next.js, TypeScript, Spring Boot Web, Spring JDBC, Jackson, PostgreSQL driver, H2 for backend tests, Node test runner for frontend tests.

**Storage**: PostgreSQL is the source of truth. Existing AI cleanup must preserve `ai_runs`, `credit_transactions`, audit records, and structured test design artifact persistence.

**Testing**: Backend unit tests for orchestration, provider selection, parser validation, credit lifecycle, and AI run lifecycle. Backend integration tests for canonical AI endpoints, compatibility wrappers if retained, malformed/invalid request rejection, authentication behavior when supported or mocked/local documentation when not supported, organization/project access denial, entitlement non-applicability documentation, provider/output failures, run status, audit records, and no real provider usage. Frontend lint, tests, and build for the AI generation UI and client API calls.

**Target Platform**: Local development and CI-like validation on the monorepo; backend deployable as the MVP modular monolith; browser frontend consuming backend product APIs only.

**Project Type**: FrankInTest cleanup slice across `services/api`, `apps/web` only if API usage requires it, and `docs`/`specs` for status and architecture alignment.

**Performance Goals**: Cleanup must not make the existing mock AI generation UX slower in local validation; estimate responses should remain perceived as immediate and mock generation should complete within the existing frontend loading expectations.

**Constraints**: No new AI features, no Check-up MVP implementation, no billing purchase flow, no streaming, no expansion of production provider integration, no UI redesign, no microservices, no broad refactor outside AI foundation, no new auth or entitlement subsystem, no commits by the agent. Automated tests must not call a real AI provider. Provider secrets must remain server-side only.

**Scale/Scope**: Scope is limited to current Bloco 09A/09B AI Test Design flows: estimate, generate scenarios from business rules, generate test cases from scenarios, query safe AI run metadata, preserve credit/audit behavior, and document the canonical path.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Architecture boundary**: PASS. The plan keeps UX/API consumption in `apps/web`, trusted AI orchestration, persistence, permissions, credits, and audit in `services/api`, and does not alter local infra.
- **Modular monolith**: PASS. Backend work remains inside the Spring Boot modular monolith and consolidates internal module boundaries instead of adding services.
- **Responsibility boundary**: PASS. The canonical path keeps permissions, input validation, credits, provider selection, persistence, AI run lifecycle, audit, and security decisions backend-owned. Real authentication and full entitlement enforcement are preserved/documented at current MVP maturity rather than introduced in this cleanup block.
- **AI governance**: PASS. The cleanup preserves structured QA draft outputs, server-side AI run tracking, credit estimate/capture/release behavior, and mock provider usage in tests.
- **Security/LGPD**: PASS. Secrets stay server-side; frontend provider calls are prohibited; protected AI operations continue to validate organization/project access and input schemas; authentication is preserved or documented as mocked/local; entitlement is documented as not applicable to 09C; invasive scans and URL Check-up are out of scope.
- **Product language**: PASS. No new UI copy is planned. Any touched user-facing copy must remain pt-BR.
- **Testing discipline**: PASS. The plan requires backend unit/integration coverage and frontend lint/test/build validation for the AI foundation.
- **Execution discipline**: PASS. Scope is a cleanup slice with docs/status updates and no unrelated refactor, microservices, billing, streaming, or new product features.

## Project Structure

### Documentation (this feature)

```text
specs/002-ai-foundation-cleanup/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ai-foundation-cleanup.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/web/
├── src/lib/ai-assistance/
│   ├── aiAssistanceClient.ts
│   └── types.ts
└── tests/
    └── ai-assistance.test.mjs

services/api/
├── src/main/java/com/frankintest/api/
│   ├── ai/
│   │   ├── AiTestDesignController.java
│   │   ├── AiRunStatusController.java
│   │   ├── orchestration/
│   │   │   ├── AiTestDesignOrchestrationService.java
│   │   │   ├── AiTestDesignDtos.java
│   │   │   └── AiGeneratedArtifactParser.java
│   │   └── provider/
│   │       ├── AiProviderPort.java
│   │       ├── AiProviderSelector.java
│   │       ├── MockAiProvider.java
│   │       └── AnthropicAiProvider.java
│   ├── airuns/
│   ├── audit/
│   ├── credits/
│   ├── system/
│   └── testdesign/
└── src/test/java/com/frankintest/api/
    ├── ai/
    ├── ai/orchestration/
    ├── airuns/
    ├── audit/
    └── credits/

docs/
├── API_DESIGN.md
├── ARCHITECTURE.md
├── CURRENT_STATUS.md
└── ROADMAP.md
```

**Structure Decision**: Keep the newer AI Test Design package structure as canonical. Remove or adapt legacy root `ai` orchestration classes only where they duplicate canonical responsibilities. `apps/web` should continue using `/api/ai/test-design/*` and `/api/ai/runs/{id}`. Docs updates are required when implementation decisions change the public API surface or current status.

## Complexity Tracking

No constitution violations identified. No extra services, queues, billing integration, provider expansion, or broad UI changes are introduced.

## Phase 0: Research Summary

See [research.md](./research.md). Key decisions:

- Canonical backend path is `AiTestDesignController` -> `AiTestDesignOrchestrationService` -> `AiProviderSelector`/`AiProviderPort` -> parser -> repositories/services for AI runs, credits, audit, and test design persistence.
- Legacy root orchestration (`AiRunController`, `AiOrchestrationService`, root provider abstractions and DTOs) must not remain as an active second architecture. If any legacy endpoint is still required by tests or consumers, keep it only as a thin compatibility wrapper around the canonical service and document deprecation.
- Frontend remains on canonical product APIs and must not gain direct provider calls or provider secrets.
- Automated tests must force/mock provider behavior and validate that provider/output failures release credits and record safe run state.
- Protected-request behavior must be explicit: schema validation and organization/project checks remain backend-enforced; authentication remains preserved or documented as mocked/local; full entitlement enforcement is outside 09C and must not be silently implied.

## Phase 1: Design Summary

See [data-model.md](./data-model.md), [contracts/ai-foundation-cleanup.md](./contracts/ai-foundation-cleanup.md), and [quickstart.md](./quickstart.md).

Post-design constitution re-check: PASS. The design consolidates backend AI orchestration, preserves structured QA outputs, keeps secrets server-side, keeps tests mock-only, and documents compatibility handling without adding new product scope.
