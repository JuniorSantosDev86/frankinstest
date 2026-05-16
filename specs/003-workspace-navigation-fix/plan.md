# Implementation Plan: Workspace Navigation Fix

**Branch**: `003-workspace-navigation-fix` | **Date**: 2026-05-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-workspace-navigation-fix/spec.md`

**Note**: `/speckit-clarify` was started but superseded by `/speckit-plan` before an answer was provided. The plan resolves the only material ambiguity conservatively: sidebar navigation must make the selected Workspace section the active displayed detail/domain area. Focus/scroll may improve visibility and accessibility, but cannot be the only navigation effect.

## Summary

Fix the FrankInTest Workspace navigation so enabled sidebar and overview links drive a real active Workspace section instead of only changing the URL hash. The plan keeps all work in `apps/web`, preserves the current visual design and PT-BR copy, maps every enabled navigable hash to a deterministic Workspace section/domain, keeps URL hash, displayed/focused section, and active sidebar state synchronized, supports direct hash entry/reload, excludes disabled/future/out-of-scope items from navigation-target counts, and adds behavior-level frontend validation for these navigation guarantees.

## Technical Context

**Language/Version**: Frontend uses Next.js 16.2.6, React 19.2.4, and TypeScript in `apps/web`.

**Primary Dependencies**: Existing Next.js App Router application, React client components, Tailwind CSS classes, Node test runner, and existing static/source-level frontend tests.

**Storage**: No new persistence. Existing local/mock Workspace data and localStorage behavior remain unchanged.

**Testing**: `npm run lint`, `npm test`, and `npm run build` from `apps/web`. Add or update frontend tests in `apps/web/tests/product-skeleton.test.mjs` or a focused adjacent test file to cover navigation mapping, active-state behavior, hash synchronization, and hash reload/direct-entry expectations. Include at least one behavior-level validation proving that selecting an enabled sidebar item changes the active/visible Workspace detail area, not only static source strings.

**Target Platform**: Browser frontend in local development and CI-like validation for the FrankInTest MVP.

**Project Type**: Frontend-only FrankInTest vertical slice in `apps/web`; specs/docs only outside source.

**Performance Goals**: Sidebar section switching should complete in a single user action without perceptible delay and without making the existing first render/hydration behavior less stable.

**Constraints**: No backend changes, no AI feature changes, no Check-up MVP work, no broad UI redesign, no i18n expansion, no auth changes, no commits by the agent, no provider calls, no billing/credit changes, and no business-rule enforcement in frontend.

**Scale/Scope**: Current Workspace sidebar groups and links in `WorkspaceDashboard.tsx`, current detail domains in `WorkspaceDetailArea`, overview CTA links, and the content sections currently rendered from `apps/web/src/app/page.tsx`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Architecture boundary**: PASS. The feature is explicitly frontend UX/navigation work in `apps/web`; no backend, database, or infra changes are planned.
- **Modular monolith**: PASS. No backend work or microservices are introduced.
- **Responsibility boundary**: PASS. The frontend only controls rendering, navigation, active section state, focus, and hash handling. Permissions, credits, persistence, AI orchestration, integrations, audit logs, and security decisions remain backend-owned or unchanged.
- **AI governance**: PASS. No AI behavior is introduced or modified. Existing AI Test Design backend/provider boundaries remain untouched.
- **Security/LGPD**: PASS. No secrets, protected backend mutations, evidence upload/export, URL Check-up, invasive scan, or sensitive action is introduced.
- **Product language**: PASS. Existing PT-BR UI labels are preserved. Any changed user-facing copy must remain PT-BR.
- **Testing discipline**: PASS. The plan requires focused frontend tests plus lint, test, and build validation.
- **Execution discipline**: PASS. The scope is a narrow Workspace navigation bug fix with no unrelated refactor or architecture change.

## Project Structure

### Documentation (this feature)

```text
specs/003-workspace-navigation-fix/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── workspace-navigation.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/web/
├── src/app/
│   ├── page.tsx
│   └── components/
│       └── WorkspaceDashboard.tsx
└── tests/
    ├── product-skeleton.test.mjs
    └── [optional focused workspace navigation test]
```

**Structure Decision**: Keep the fix inside the existing Workspace dashboard and page composition. `WorkspaceDashboard.tsx` owns sidebar/overview navigation metadata and visual shell. `page.tsx` currently owns the selected Workspace detail tab and rendered section content. Tests stay under `apps/web/tests` using the current Node test runner approach.

## Complexity Tracking

No constitution violations identified. No extra app, backend endpoint, persistence layer, router rewrite, or UI redesign is required.

## Phase 0: Research Summary

See [research.md](./research.md). Key decisions:

- Use a single canonical Workspace navigation registry so each enabled sidebar/CTA hash resolves to one active Workspace domain and, where applicable, one inner content section.
- Require changing the displayed Workspace detail domain as the primary activation behavior, with focus/scroll used only as supporting feedback when a target is inside the active domain.
- Treat invalid or missing hashes as recoverable states that fall back to the existing default Workspace entry.
- Preserve disabled sidebar items as non-navigable until their product surface exists.
- Treat Configuracoes as an enabled mapped target only if a valid settings section exists in this block; otherwise keep it disabled/future/out-of-scope and prevent hash updates as an active target.
- Add tests around the navigation contract and at least one behavior-level validation rather than relying only on source-string checks or manual behavior.

## Phase 1: Design Summary

See [data-model.md](./data-model.md), [contracts/workspace-navigation.md](./contracts/workspace-navigation.md), and [quickstart.md](./quickstart.md).

Post-design constitution re-check: PASS. The design remains frontend-only, deterministic, PT-BR, testable, and does not alter backend ownership of business rules, persistence, permissions, AI, credits, audit, or security decisions.
