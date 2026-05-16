# Research: AI Foundation Cleanup & Spec Alignment

## Decision: Canonical AI orchestration path

Use the AI Test Design path as canonical:

`AiTestDesignController` -> `AiTestDesignOrchestrationService` -> `AiProviderSelector`/`AiProviderPort` -> `AiGeneratedArtifactParser` -> `AiRunRepository`, `CreditRepository`, `AuditService`, and `TestDesignRepository`.

**Rationale**: This path matches Bloco 09A/09B goals: structured QA artifacts, server-side credit lifecycle, AI run tracking, output validation, provider abstraction, project access checks, and audit events. It also matches the endpoints currently used by `apps/web`: `/api/ai/test-design/estimate`, `/api/ai/test-design/scenarios`, `/api/ai/test-design/test-cases`, and `/api/ai/runs/{aiRunId}`.

**Alternatives considered**:

- Keep root `AiOrchestrationService` as canonical: rejected because it duplicates provider selection and orchestration without the newer structured parser/repository boundaries.
- Keep both paths active: rejected because it violates the feature goal and product constitution by preserving competing AI architectures.

## Decision: Legacy endpoint handling

Legacy endpoints may remain only when needed as thin compatibility wrappers that delegate to the canonical service. They must not keep independent prompt construction, provider selection, credit accounting, AI run persistence, or output behavior.

**Rationale**: This protects any temporary consumers or legacy tests while preventing duplicated business logic. It also lets implementation remove wrappers entirely when search and tests prove no active consumer exists.

**Alternatives considered**:

- Remove all legacy endpoints immediately: safer architecturally, but can create avoidable compatibility risk if a local consumer or documentation path still relies on them.
- Leave legacy endpoints intact: rejected because this preserves the exact ambiguity 09C is meant to remove.

## Decision: Provider configuration in tests

Automated tests must force mock provider behavior and must not depend on real provider keys, network access, or provider availability.

**Rationale**: The constitution requires mocked AI providers in tests. This also keeps credit/audit/failure tests deterministic and avoids cost, privacy, and flakiness risks.

**Alternatives considered**:

- Allow optional provider integration tests: rejected for 09C because provider integration expansion is explicitly out of scope.
- Use frontend mocks only: rejected because backend orchestration, parser, credit, audit, and run lifecycle need direct backend coverage.

## Decision: Documentation scope

Update only docs/spec/status sections that describe current AI architecture, API surface, known limitations, and roadmap readiness for Check-up MVP.

**Rationale**: This block is cleanup/alignment, not new product scope. Documentation must reflect what changed and remove stale references to competing paths without rewriting unrelated product docs.

**Alternatives considered**:

- Broad documentation rewrite: rejected as unrelated scope.
- No documentation update: rejected because acceptance criteria require docs/status accuracy after 09C.

## Decision: Frontend API behavior

Keep `apps/web` on backend product APIs only. The frontend AI assistance client should continue to call canonical test-design endpoints and safe run-status endpoint.

**Rationale**: The current client already targets the canonical API surface. Changing UI behavior is unnecessary unless implementation discovers a stale endpoint or unsafe provider exposure.

**Alternatives considered**:

- Add new frontend AI routes: rejected because no new AI features or UI redesign are in scope.
- Call provider directly from frontend: rejected by constitution and security rules.
