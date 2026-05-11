# AGENTS.md — FrankInTest Execution Rules

This file instructs AI coding agents such as Codex, Claude Code, and other local coding assistants working in this repository.

## Product identity

FrankInTest is a QA Lead SaaS with two main pillars:

1. **Check-up mode**: simplified AI-assisted testing for vibe coders, founders, landing pages, MVPs, SaaS prototypes, agencies, and non-QA users. This mode is paid by AI credits/demand.
2. **Workspace mode**: complete QA operational dashboard for QA professionals and teams, covering manual QA, web automation, mobile, API, integration, load/performance, security checklists, release readiness, bug reporting, evidence, and documentation drift.

## Non-negotiable product rule

Do not build a generic AI chat app. AI must be attached to structured QA artifacts.

Whenever AI generates something, it should be possible to save it as one of the following:

- Requirement
- Business rule
- Test scenario
- Test case
- Test cycle
- Bug report
- Evidence summary
- Risk item
- Release readiness report
- Drift finding
- Automation suggestion
- Integration recommendation

## Source of truth documents

Before coding, read:

- `docs/PRODUCT_VISION.md`
- `docs/PRODUCT_PILLARS.md`
- `docs/BUSINESS_RULES.md`
- `docs/ROADMAP.md`
- `docs/CURRENT_STATUS.md`
- `docs/ARCHITECTURE.md`
- `docs/QA_STRATEGY.md`
- `docs/AI_USAGE_POLICY.md`
- `docs/FRANKINTEST_CHECKUP_SPEC.md`
- `docs/QA_LEAD_WORKSPACE_SPEC.md`
- `docs/FRANKINDRIFT_SPEC.md`

## Engineering principles

- Prefer simple, explicit, maintainable architecture.
- Build by vertical slices, not huge abstract systems.
- Keep deterministic workflows central.
- Use AI only where it gives leverage.
- Keep credits, cost control, and billing boundaries explicit.
- Avoid token-heavy background jobs unless there is a clear user action and clear billing event.
- Keep data model ready for organizations, projects, modules, requirements, tests, bugs, evidence, reports, integrations, and AI runs.
- Do not implement destructive actions without confirmation or audit trail.

## Security principles

- Never run invasive security scans without explicit user authorization.
- Only perform safe, non-destructive checks in early versions.
- Respect rate limits and robots/policies where applicable.
- Keep secrets out of client code.
- Do not store API tokens in plaintext.
- Build audit logs for AI runs, integrations, report generation, and destructive actions.
- Follow LGPD principles from the start.

## QA requirements for every block

Every block must include:

- Unit tests for pure business logic.
- Integration tests for service boundaries when applicable.
- E2E tests for critical user flows when applicable.
- Manual QA checklist for visual, responsive, and UX review.
- Clear run report explaining what changed, what did not change, and how it was validated.

## Out of scope unless explicitly requested

- Large visual redesign.
- Full billing provider integration before entitlement foundation.
- Real invasive pentesting.
- Full browser farm/device farm infrastructure.
- Full AI agent autonomy without approval gates.
- Multi-tenant enterprise complexity before core MVP is stable.

## Required run report format

At the end of every block, report:

1. Files changed.
2. Features implemented.
3. Business rules preserved.
4. Tests added/updated.
5. Validation commands run.
6. Known limitations.
7. Roadmap/current status updates.
8. Suggested commit message.
