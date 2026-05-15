# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [Next.js/TypeScript in apps/web and/or Java 21+ Spring Boot in services/api, or NEEDS CLARIFICATION]

**Primary Dependencies**: [e.g., Next.js, Tailwind, Spring Boot, PostgreSQL, or NEEDS CLARIFICATION]

**Storage**: [PostgreSQL for persistent product data, or N/A with rationale]

**Testing**: [frontend component/E2E tests and/or backend unit/integration tests, or NEEDS CLARIFICATION]

**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]

**Project Type**: [FrankInTest vertical slice: apps/web, services/api, infra, docs, or NEEDS CLARIFICATION]

**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]

**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]

**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Architecture boundary**: Does the plan keep UI in `apps/web`, trusted business logic in
  `services/api`, PostgreSQL as source of truth, and local infra in `infra/`?
- **Modular monolith**: Does backend work remain inside the Spring Boot modular monolith for
  MVP, without introducing microservices?
- **Responsibility boundary**: Are permissions, credits, entitlements, persistence, AI
  orchestration, integrations, audit logs, and security decisions enforced by the backend?
- **AI governance**: If AI is involved, does it produce structured QA artifacts, track AI runs
  server-side, estimate credits before expensive work, avoid unfair credit consumption on
  platform failures, and use mocked providers in tests?
- **Security/LGPD**: Are secrets server-side only, protected backend requests validating
  organization/project access, sensitive actions audited, URL check-up explicitly authorized,
  and invasive scans excluded from MVP?
- **Product language**: Is all new MVP UI copy in `pt-BR` with no new `en`/`es` UI surface?
- **Testing discipline**: Are backend business rules covered by unit tests, backend API and
  persistence boundaries covered by integration tests when applicable, and frontend critical
  flows covered by component or E2E tests when applicable?
- **Execution discipline**: Is scope small and traceable, with no unrelated refactors or
  architecture changes lacking matching docs/spec updates?

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
apps/web/
├── src/
├── public/
└── tests/

services/api/
├── src/main/java/com/frankintest/api/
└── src/test/java/com/frankintest/api/

infra/
└── docker-compose.yml

docs/
└── [feature/product documentation updates when applicable]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
