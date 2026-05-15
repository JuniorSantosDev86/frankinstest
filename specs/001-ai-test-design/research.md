# Research: AI Test Design Assistance

## Decision: Backend-owned AI provider abstraction

**Rationale**: The constitution requires provider calls, secrets, cost decisions, and AI run tracking to live server-side. A provider interface lets the orchestration service use a deterministic mock provider in tests/local development and an Anthropic adapter when server-side configuration is present.

**Alternatives considered**:

- Frontend provider calls: rejected because it exposes secrets and moves trusted behavior to the browser.
- Direct Anthropic calls from controllers: rejected because it couples API boundaries to one vendor and makes tests brittle.
- Worker-based provider execution: deferred because this block is bounded to small synchronous generation.

## Decision: Mock provider is the automated-test default

**Rationale**: Tests must never call real AI providers. The mock provider should return structured, predictable scenario/test-case payloads and support forced failure modes for credit and run lifecycle tests.

**Alternatives considered**:

- Snapshotting real provider responses: rejected due to drift, cost, and external dependency.
- Frontend-only mock: rejected because backend orchestration and credit rules must be tested.

## Decision: Reserve credits before run, capture on success, release on platform/provider failure

**Rationale**: This resolves the skipped clarification in favor of the safest MVP behavior. It blocks insufficient-credit runs before provider work starts, keeps a clear ledger, and prevents unfair final consumption when the platform or provider fails.

**Alternatives considered**:

- Estimate only, consume after success: simpler but weaker for insufficient-credit enforcement.
- Debit first and refund on failure: auditable but creates unnecessary negative trust moments for MVP.
- Ledger-only without balance impact: useful during early schema work, but too weak for a credit foundation.

## Decision: Synchronous bounded generation for Bloco 09

**Rationale**: The requested flows generate from one business rule or one scenario. That can be synchronous in the MVP as long as the UI has loading/error states and the backend records run status. Queues and workers are reserved for large Check-up, drift, report, or crawling jobs.

**Alternatives considered**:

- Background jobs immediately: rejected as premature for a one-artifact generation slice.
- Streaming: explicitly out of scope.

## Decision: Structured output validation before persistence

**Rationale**: The product must not save loose chat. Provider output should be parsed into scenario/test-case DTOs with required fields, traceability links, `ai_assisted=true`, and `status=draft`. Invalid or empty output becomes a controlled run failure and releases reserved credits.

**Alternatives considered**:

- Save raw text and let users interpret it: rejected by product rule.
- Return raw text only to frontend: rejected because output must be traceable and auditable.

## Decision: Minimal permission foundation for MVP

**Rationale**: The backend must validate organization and project access. If production auth is still foundational, this block should use the existing demo/mock user boundary but keep service methods and tests shaped around explicit `organizationId`, `projectId`, and `userId`.

**Alternatives considered**:

- Full production auth rewrite: explicitly out of scope.
- Frontend-only permission checks: rejected by constitution.

## Decision: API exposes product actions, not provider details

**Rationale**: Endpoints should model user intent: estimate test design cost, generate scenarios, generate test cases, and inspect run status. Provider name, model, API key, and raw vendor payloads are internal.

**Alternatives considered**:

- Generic `/api/ai/prompt`: rejected because it encourages generic chat and weak artifact structure.
- Provider-specific endpoints: rejected because they leak infrastructure choices into product API.
