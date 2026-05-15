<!--
Sync Impact Report
Version change: template -> 1.0.0
Modified principles:
- Template principle 1 -> I. Arquitetura Oficial do Produto
- Template principle 2 -> II. Fronteiras de Responsabilidade
- Template principle 3 -> III. Governança de IA e Créditos
- Template principle 4 -> IV. Segurança, LGPD e Auditoria
- Template principle 5 -> V. Idioma do Produto e Experiência MVP
Added sections:
- Disciplina de Qualidade e Execução
- Escopo Técnico do MVP
Removed sections:
- Nenhuma seção real removida; placeholders do template foram substituídos.
Templates requiring updates:
- updated: .specify/templates/plan-template.md
- updated: .specify/templates/spec-template.md
- updated: .specify/templates/tasks-template.md
- reviewed: .specify/templates/commands/*.md (diretorio ausente)
- reviewed: README.md
- reviewed: AGENTS.md
Follow-up TODOs:
- Nenhum.
-->
# FrankInTest Constitution

## Core Principles

### I. Arquitetura Oficial do Produto
FrankInTest MUST use a separated frontend/backend architecture. The frontend MUST live in
`apps/web` and use Next.js, TypeScript, and Tailwind. The backend core MUST live in
`services/api` and use Java 21+ with Spring Boot. PostgreSQL MUST be the source of truth for
persistent product data, and `infra/` MUST own local infrastructure such as Docker Compose.
During the MVP, the backend MUST remain a modular monolith; microservices are out of scope
unless the constitution and architecture docs are amended first.

Rationale: FrankInTest handles QA artifacts, permissions, AI runs, credits, auditability, and
sensitive evidence. A clear backend boundary keeps trusted business behavior out of the UI.

### II. Fronteiras de Responsabilidade
The frontend MUST own UX, forms, rendering, navigation, and user interaction. The backend MUST
own business rules, persistence, permission decisions, AI run orchestration, credits,
entitlements, audit logs, integrations, and security decisions. The frontend MUST NOT call AI
providers directly, store secrets, or act as the final authority for permissions, credits, or
entitlements.

Rationale: Browser code is not a trusted execution boundary. Final decisions about access,
billing impact, sensitive data, and provider calls must be enforced server-side.

### III. Governança de IA e Créditos
AI MUST generate structured QA artifacts, not loose generic chat responses. Useful AI outputs
MUST be savable as artifacts such as requirements, business rules, test scenarios, test cases,
test cycles, bug reports, evidence summaries, risk items, release readiness reports, drift
findings, automation suggestions, or integration recommendations. AI runs MUST be tracked
server-side. Expensive AI operations MUST estimate credits before execution, and platform-side
AI failures MUST NOT unfairly consume user credits. Automated tests MUST use mocked AI
providers and MUST NOT call real AI providers.

Rationale: FrankInTest is a QA Lead SaaS, not a generic AI chat app. Traceable artifacts,
server-side run records, and explicit credit accounting protect product value and cost.

### IV. Segurança, LGPD e Auditoria
Secrets MUST exist only server-side. Protected backend requests MUST validate authentication,
organization access, project access, input schema, entitlement when applicable, and audit
requirements when applicable. Sensitive actions MUST be audited. Invasive scans MUST NOT be
implemented during the MVP. Check-up by URL MUST require explicit user authorization
confirmation before execution. Evidence and reports MUST be treated as potentially sensitive
data and handled according to the security and LGPD guidance in `docs/SECURITY_LGPD.md`.

Rationale: QA evidence, reports, URLs, bugs, integrations, and AI runs may expose customer
systems or personal data. Security and privacy must be part of the default workflow.

### V. Idioma do Produto e Experiência MVP
The MVP UI MUST be implemented first in Brazilian Portuguese (`pt-BR`). The product MAY remain
i18n-ready, but full English and Spanish translation hardening is postponed until after MVP
stabilization. New UI labels, screens, and user-facing copy MUST NOT introduce `en` or `es`
content during the MVP unless the constitution or product language policy is amended.

Rationale: A single product language reduces MVP surface area and keeps UX review focused
while preserving a path to future internationalization.

## Disciplina de Qualidade e Execução

Backend business rules MUST have unit tests. Backend API, persistence, permission, credit, and
audit boundaries MUST have integration tests when applicable. Frontend critical flows MUST have
component or E2E coverage when applicable. Tests for AI behavior MUST mock provider boundaries.
Each implementation block MUST include validation commands and an honest run report covering
changed files, implemented functionality, preserved business rules, tests, validation commands,
known limitations, roadmap/status updates, and a suggested commit message.

A feature is not complete when lint, build, or tests fail without a documented reason. Work MUST
prefer small, traceable changes. Broad unrelated refactors MUST NOT be performed. Architecture
changes MUST update relevant specs and docs in the same block. Agents MUST NOT commit
automatically; the human developer commits manually.

## Escopo Técnico do MVP

The MVP MUST prioritize QA Workspace, AI Check-up, structured QA artifacts, reports, evidence,
credits, auditability, and FrankInDrift. Product work MUST be delivered as vertical slices that
keep workflows deterministic before adding AI leverage. Destructive actions MUST require
confirmation or auditability. Billing provider integration, invasive security scanning,
browser/device farm infrastructure, autonomous AI agents without approval gates, enterprise
multi-tenancy complexity, and microservices are out of scope unless explicitly requested and
documented.

## Governance

This constitution supersedes conflicting local practices, generated plans, and task templates.
Feature specs, plans, tasks, implementation work, and reviews MUST pass the constitution checks
before being considered ready.

Amendments MUST be documented in `.specify/memory/constitution.md`, MUST update dependent
templates or runtime guidance when affected, and MUST include a Sync Impact Report. The
developer may propose amendments, but the human project owner approves scope and commits.

Versioning follows semantic versioning:
- MAJOR for backward-incompatible governance changes, principle removals, or principle
  redefinitions.
- MINOR for new principles, new governance sections, or materially expanded guidance.
- PATCH for clarifications, wording fixes, and non-semantic refinements.

Compliance review is required during planning, task generation, implementation review, and run
report creation. Any deliberate violation MUST be documented in the plan's Complexity Tracking
section with the simpler alternative considered and the reason it was rejected.

**Version**: 1.0.0 | **Ratified**: 2026-05-15 | **Last Amended**: 2026-05-15
