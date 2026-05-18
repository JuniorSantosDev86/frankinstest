# Feature Specification: Real AI Provider Integration (Bloco 12)

**Feature Branch**: `006-real-ai-provider-integration`

**Created**: 2026-05-17

**Status**: Draft

**Input**: Integrate a real Anthropic AI provider into the FrankInTest backend so the Check-up MVP generates a real structured AI-assisted QA report when explicitly configured, while preserving mock provider behavior for automated tests.

---

## Clarifications

### Session 2026-05-17

- Q: What is the minimum required field set for items within each report section? → A: Section-specific required fields — the report is a structured QA artifact, not a generic list. Shapes defined below.
- Q: When output validation fails after a successful provider HTTP call, what is the correct credit disposition? → A: Credits fully released. Output-validation failure is treated identically to a provider HTTP failure — reserved credits are released, AI run status becomes FAILED with failure category OUTPUT_VALIDATION_FAILURE, no report is persisted, audit event is emitted, and the user receives a safe pt-BR error message.
- Q: What is the committed default timeout for provider HTTP calls? → A: 30 seconds default, overridable via environment variable. Timeout is treated as PROVIDER_FAILURE — credits released, AI run FAILED, safe pt-BR error returned. Timeout behavior tested with mock/stubbed provider in automated tests.
- Q: Which Anthropic model should be used as the default for Check-up runs? → A: `claude-haiku-4-5-20251001`, configurable via environment variable. Missing config defaults to Haiku. Tests use MockAiProvider exclusively. Provider boundary must allow switching to Sonnet via env var without code changes.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Developer Enables Real Provider Locally (Priority: P1)

A developer running FrankInTest locally wants to validate that the Check-up feature generates a real AI-assisted QA report. They set an environment variable with their Anthropic API key, restart the backend, and trigger a Check-up run through the existing UI. The backend calls Anthropic, validates the structured JSON output, and returns a DRAFT report with all required sections populated by real AI content.

**Why this priority**: This is the core deliverable of Bloco 12. Without it, the product still uses mock data in production-equivalent environments.

**Independent Test**: Can be fully tested by configuring `ANTHROPIC_API_KEY` in a local `.env` file, running the backend, and executing a Check-up run via the API (curl or UI). Delivers real AI-generated report content.

**Acceptance Scenarios**:

1. **Given** the backend is configured with a valid `ANTHROPIC_API_KEY` and the real provider is enabled, **When** a user submits a Check-up request with valid JWT auth and `X-Organization-Id`, **Then** the backend calls Anthropic, receives a structured JSON response, validates all required sections, persists the report, and returns a DRAFT AI-assisted report to the frontend.
2. **Given** the backend is configured with the real provider, **When** the AI run completes successfully, **Then** an audit event is recorded for provider call started and provider call completed, and the AI run status is set to `COMPLETED`.
3. **Given** the backend is configured with the real provider, **When** the report is returned, **Then** it contains all seven required sections: `qualityRisks`, `missingOrUnclearRequirements`, `suggestedTestScenarios`, `suggestedTestCases`, `uxProductRisks`, `releaseReadinessNotes`, `recommendedNextActions`, and it is clearly marked as DRAFT and AI-assisted.

---

### User Story 2 — Automated Tests Continue Passing Without Real Provider Key (Priority: P1)

A developer runs the full automated test suite without any Anthropic API key configured. All backend tests pass using the deterministic MockAiProvider. No test makes a real HTTP call to Anthropic. The CI pipeline remains green without requiring secrets.

**Why this priority**: Equal in priority to P1 because breaking automated tests or CI would block all future development.

**Independent Test**: Can be fully tested by running `./mvnw test` with no `ANTHROPIC_API_KEY` set. All tests must pass.

**Acceptance Scenarios**:

1. **Given** no `ANTHROPIC_API_KEY` is set and mock provider is active, **When** the automated test suite runs, **Then** all backend tests pass without any real provider calls being made.
2. **Given** the mock provider is active, **When** a Check-up test executes the AI generation step, **Then** the mock provider returns a deterministic structured report identical to its pre-Bloco-12 behavior.

---

### User Story 3 — Provider Timeout or Failure Preserves Credits (Priority: P2)

A user triggers a Check-up run but the Anthropic API times out or returns an error. The backend handles the failure gracefully: the AI run is marked as `FAILED`, a safe error message is returned to the user (without leaking provider internals), and the credits consumed for a failed run are preserved or released according to the credit policy.

**Why this priority**: Protects user trust and billing integrity when third-party provider is unavailable.

**Independent Test**: Can be tested by configuring a deliberately invalid or unreachable provider endpoint and triggering a Check-up run. Verify the AI run status, the error response, and the credit ledger.

**Acceptance Scenarios**:

1. **Given** the real provider is configured but times out, **When** a Check-up run is triggered, **Then** the backend returns a safe pt-BR error response, the AI run status is `FAILED` with category `PROVIDER_FAILURE`, a provider-call-failure audit event is recorded, and reserved credits are fully released.
2. **Given** the real provider returns an HTTP 5xx error, **When** a Check-up run is triggered, **Then** the same safe failure path is followed — no provider error details leak into the API response.

---

### User Story 4 — Invalid Provider Output Rejected Safely (Priority: P2)

The Anthropic API responds but returns JSON that is missing required sections or has malformed structure. The backend rejects the output before persisting it, marks the AI run as `FAILED` with an output-validation failure audit event, and does not store a partially-valid report. The user receives a safe error message.

**Why this priority**: Prevents corrupted or incomplete QA artifacts from being saved and reviewed as valid reports.

**Independent Test**: Can be tested by mocking the Anthropic HTTP response to return incomplete JSON (e.g., missing `qualityRisks` key) and verifying the backend rejects it and returns an appropriate error.

**Acceptance Scenarios**:

1. **Given** the provider returns a response missing one or more required report sections or items with missing required fields, **When** the backend validates the output, **Then** the output is rejected, reserved credits are fully released, the AI run is marked `FAILED` with category `OUTPUT_VALIDATION_FAILURE`, an output-validation-failure audit event is emitted, no report is persisted, and the user receives a safe pt-BR error message.
2. **Given** the provider returns non-JSON or malformed JSON, **When** the backend attempts to parse it, **Then** the same rejection and failure path is followed.

---

### User Story 5 — Missing API Key Fails Fast with Safe Configuration Error (Priority: P2)

A developer enables the real provider mode via environment variable (`AI_MOCK_ENABLED=false`) but forgets to set the `ANTHROPIC_API_KEY`. The backend fails at the first provider call with a clear configuration error, never attempting to make a real HTTP call with a missing key.

**Why this priority**: Prevents silent misconfiguration in staging or production-like environments.

**Independent Test**: Can be tested by setting the provider selector to `anthropic` while leaving `ANTHROPIC_API_KEY` empty, then triggering a Check-up run. Verify the error is a configuration error, not a provider HTTP failure.

**Acceptance Scenarios**:

1. **Given** `AI_MOCK_ENABLED=false` but `ANTHROPIC_API_KEY` is absent, **When** a Check-up run is initiated, **Then** the backend returns a configuration error (HTTP 500 or 503) at the first provider call, logs a safe configuration warning (without printing the key), and does not attempt to call Anthropic.

---

### Edge Cases

- What happens when the Anthropic response contains all required top-level sections but individual items within sections have missing or null required fields (per the section-specific shapes defined in FR-007)? The validator must reject item-level malformation, not just section presence.
- What happens if the provider call exceeds the configured timeout threshold? The backend must interrupt the HTTP call and follow the safe failure path without hanging the request thread.
- What happens if two concurrent Check-up runs trigger simultaneous provider calls? Each run is independent; there is no shared mutable state between them.
- What happens if the user has insufficient credits before a real-provider run? The existing credit gate from Bloco 10 must still apply before the provider call is attempted.
- What happens if the frontend receives a provider failure error? The UI should display a user-facing Portuguese error message without exposing provider internals.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The backend MUST provide a configurable AI provider selector controlled by the `AI_MOCK_ENABLED` environment variable. `AI_MOCK_ENABLED=true` activates the mock provider (default). `AI_MOCK_ENABLED=false` allows the real Anthropic provider to be used when `ANTHROPIC_API_KEY` is also configured. No `AI_PROVIDER` variable is introduced in this block.
- **FR-002**: The real Anthropic provider MUST only be activated when `AI_MOCK_ENABLED=false` is explicitly set — never by default. The default behavior (`AI_MOCK_ENABLED=true` or absent) MUST use the mock provider.
- **FR-003**: When `AI_MOCK_ENABLED=false` and `ANTHROPIC_API_KEY` is absent, the backend MUST fail at the first provider call with a safe configuration error — not at application startup. No HTTP call to Anthropic may be attempted before the key is verified.
- **FR-004**: All provider HTTP calls MUST be made exclusively from `services/api` — never from `apps/web`.
- **FR-005**: The backend MUST construct the Anthropic request payload entirely server-side, using only context submitted by the user in the Check-up form.
- **FR-006**: The Anthropic provider implementation MUST prompt the model to return a structured JSON response containing exactly these seven sections: `qualityRisks`, `missingOrUnclearRequirements`, `suggestedTestScenarios`, `suggestedTestCases`, `uxProductRisks`, `releaseReadinessNotes`, `recommendedNextActions`.
- **FR-007**: The backend MUST validate the provider's JSON output before persisting it — verifying presence of all required sections and the following section-specific required item shapes:
  - `qualityRisks[]`: each item requires `title` (string), `description` (string), `severity` (LOW | MEDIUM | HIGH | CRITICAL)
  - `missingOrUnclearRequirements[]`: each item requires `title` (string), `description` (string), `severity` (LOW | MEDIUM | HIGH | CRITICAL)
  - `suggestedTestScenarios[]`: each item requires `title` (string), `description` (string), `type` (POSITIVE | NEGATIVE | EDGE_CASE)
  - `suggestedTestCases[]`: each item requires `title` (string), `preconditions` (string), `steps` (non-empty string array), `expectedResult` (string)
  - `uxProductRisks[]`: each item requires `title` (string), `description` (string), `severity` (LOW | MEDIUM | HIGH | CRITICAL)
  - `releaseReadinessNotes[]`: each item requires `title` (string), `description` (string), `severity` (LOW | MEDIUM | HIGH | CRITICAL)
  - `recommendedNextActions[]`: each item requires `action` (string), `rationale` (string), `priority` (LOW | MEDIUM | HIGH)
- **FR-008**: If output validation fails, the backend MUST: reject the output; release all reserved credits; mark the AI run as `FAILED` with failure category `OUTPUT_VALIDATION_FAILURE`; emit an output-validation-failure audit event; return a safe pt-BR error message to the caller explaining that the AI response could not be converted into a valid report; and not persist any partial report.
- **FR-009**: The backend MUST enforce a configurable timeout on provider HTTP calls — default 30 seconds, overridable via environment variable, no code change required. If the timeout is exceeded, the backend MUST: release reserved credits; mark the AI run as `FAILED` with category `PROVIDER_FAILURE`; emit a provider-call-failure audit event; and return a safe pt-BR error message. Timeout behavior MUST be covered by automated tests using a mock or stubbed provider — no real provider call is permitted in tests.
- **FR-010**: On provider timeout or HTTP error, the backend MUST: release all reserved credits; mark the AI run as `FAILED` with failure category `PROVIDER_FAILURE`; and emit a provider-call-failure audit event. On output-validation failure (provider HTTP success but invalid output), the same credit release rule applies with failure category `OUTPUT_VALIDATION_FAILURE` (see FR-008).
- **FR-011**: Audit events MUST be emitted for: provider call started, provider call completed, provider call failed, and output validation failed.
- **FR-012**: The AI run entity MUST accurately reflect `COMPLETED` or `FAILED` status upon provider call conclusion.
- **FR-013**: The generated report MUST remain marked as DRAFT and AI-assisted regardless of which provider produced it. The `CheckupReportView` returned by `GET /api/checkup/run/{aiRunId}/status` MUST include an `aiAssisted: true` boolean field for all Check-up reports. This field is not derivable from `status: DRAFT` alone.
- **FR-014**: Automated tests MUST use the `MockAiProvider` exclusively — no test may depend on or call the real Anthropic provider.
- **FR-015**: The `MockAiProvider` MUST remain deterministic and produce the same structured output across all test runs.
- **FR-016**: All user-facing error messages and UI copy introduced in this block MUST be in Brazilian Portuguese (`pt-BR`).
- **FR-017**: Provider API keys and secrets MUST never appear in logs, API responses, or frontend code.
- **FR-018**: The existing JWT authentication, `X-Organization-Id` validation, rate limiting, and LGPD authorization confirmation MUST remain in force for all Check-up and AI routes.
- **FR-019**: The backend MUST preserve all existing fields in the Check-up report API contract. The only additive change permitted in this block is the `aiAssisted: boolean` field on `CheckupReportView` (required by FR-013). No existing fields may be removed or renamed.
- **FR-020**: Configuration documentation and a manual QA quickstart MUST be provided explaining how to test the real provider locally without committing secrets.
- **FR-021**: System MUST preserve FrankInTest responsibility boundaries: UX in `apps/web`; business rules, persistence, permissions, credits, AI orchestration, audit logs, and security decisions in `services/api`.
- **FR-022**: The report MUST NOT claim or imply it guarantees the absence of bugs — it is an AI-assisted analysis. The `CheckupPromptBuilder` MUST include an explicit instruction to the model not to assert certainty about bug absence (e.g., "fully tested", "all bugs found", "no bugs exist"). This instruction MUST be verifiable via automated unit test of the prompt content.
- **FR-023**: The Anthropic model identifier MUST be configurable via environment variable, defaulting to `claude-haiku-4-5-20251001` when absent. The provider boundary MUST allow switching to any Claude model (e.g., `claude-sonnet-4-6`) via environment variable without code changes.

### Key Entities

- **AiProvider** (interface/abstraction): Represents a pluggable AI backend. Implementations include `MockAiProvider` and `AnthropicAiProvider`. Selected via configuration.
- **AiProviderConfig**: Holds provider selection, API key reference, model identifier (default `claude-haiku-4-5-20251001`, overridable via environment variable), timeout threshold (default 30 seconds, overridable), and max token budget. Read from environment/backend config only — no code change required to switch model or timeout.
- **CheckupAiRequest**: The server-side payload sent to the provider, built from user-submitted Check-up context. Never constructed client-side.
- **CheckupAiResponse (raw)**: The raw structured JSON returned by the provider before validation.
- **CheckupReportSections**: The validated, persisted report structure with seven required sections, each containing typed items with section-specific required fields (see FR-007 for canonical shapes).
- **AiRun**: Existing entity tracking AI run lifecycle. Extended to reflect real-provider outcomes, timeout, and output-validation failure.
- **AuditEvent**: Extended with new event types for provider call lifecycle and output validation.

### QA Artifact Impact

- **Artifacts created/updated**: AI-assisted Check-up report (DRAFT), containing structured items across seven QA sections: quality risks, missing/unclear requirements, suggested test scenarios, suggested test cases, UX/product risks, release readiness notes, recommended next actions.
- **AI run tracking**: Required. Every provider call (mock or real) must be tracked as an `AiRun` with start time, end time, status, provider name, and failure reason when applicable.
- **Credit impact**: Credits estimated before execution (existing gate from Bloco 10). Reserved credits are fully released on any failure — `PROVIDER_FAILURE` (timeout or HTTP error) or `OUTPUT_VALIDATION_FAILURE` (provider HTTP success but invalid structured output). Credits are only permanently consumed when the provider returns a valid, fully-validated report that is successfully persisted.
- **Audit events**: Provider call started, provider call completed (`COMPLETED`), provider call failed — `PROVIDER_FAILURE` (timeout or HTTP error), output validation failed — `OUTPUT_VALIDATION_FAILURE` (provider HTTP success but structured output rejected).
- **Sensitive data handling**: Provider API key never logged or returned. User-submitted Check-up context used only for the current run and not retained in logs beyond standard audit events.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A Check-up run with real provider configured completes and returns a fully structured DRAFT report with all seven required sections populated, within the configured provider timeout window.
- **SC-002**: The full automated backend test suite passes with zero failures and zero real provider calls when `ANTHROPIC_API_KEY` is not set.
- **SC-003**: Provider timeout or HTTP failure results in a safe pt-BR error response within 30 seconds (the default timeout), with no provider internals exposed to the caller and reserved credits fully released.
- **SC-004**: Provider output missing any required section is rejected 100% of the time — no malformed or partial report is persisted.
- **SC-005**: Missing API key in real-provider mode produces a configuration error before any HTTP call is attempted — zero "silent misconfiguration" failures in local and CI environments.
- **SC-006**: Zero occurrences of API keys or provider secrets appearing in application logs, API responses, or frontend bundle.
- **SC-007**: All Bloco 11 security controls (JWT, X-Organization-Id, rate limiting, LGPD confirmation) remain enforced — verified by existing security tests continuing to pass.
- **SC-008**: Local developer can configure and run a real Check-up with a real provider key in under 10 minutes following the provided quickstart documentation.

---

## Assumptions

- The backend already has a working `MockAiProvider` and an `AiProvider` interface or equivalent abstraction from Blocos 09–10. This block completes or replaces the stub `AnthropicAiProvider` rather than building the abstraction from scratch.
- No new Maven dependency is required for the provider HTTP call; the implementation will use the JDK HTTP client already available in Java 21 unless implementation discovers a concrete need. No Anthropic SDK dependency is added to `apps/web`.
- Provider selection is controlled by `AI_MOCK_ENABLED` (`true` = mock, `false` = real Anthropic path). No `AI_PROVIDER` variable is introduced in this block. Switching providers requires a backend restart, not a runtime API call.
- The credit policy for failed AI runs: reserved credits are always fully released on any failure — `PROVIDER_FAILURE` or `OUTPUT_VALIDATION_FAILURE`. Credits are only permanently consumed when the provider returns a valid, fully-validated report that is successfully persisted. This applies even when the provider HTTP call succeeded but the output failed structured validation.
- The provider HTTP call timeout defaults to 30 seconds and is overridable via environment variable without code changes. Missing configuration uses the 30-second default.
- The Anthropic model defaults to `claude-haiku-4-5-20251001` (cost-efficient for structured JSON at MVP scale) and is overridable via environment variable without code changes. If Haiku output quality is insufficient during manual QA, switching to `claude-sonnet-4-6` requires only an environment variable update.
- The frontend requires no schema changes because the API response contract for Check-up reports has not changed — only the content source changes from mock to real.
- Streaming is explicitly out of scope; the backend waits for the full provider response before processing.
- Multi-provider routing (e.g., fallback from Anthropic to OpenAI) is out of scope; only a simple two-mode selector (`mock` / `anthropic`) is implemented.
- No new UI screens are introduced; any frontend change is limited to improved error display for provider failures, and only if necessary.
- The Check-up URL/context analysis remains based solely on user-submitted form content — no web crawling, page fetching, or autonomous URL exploration.
