# Contract: AI Foundation Cleanup & Spec Alignment

This block preserves the existing AI Test Design API surface and removes or adapts legacy duplicates. It does not introduce new product endpoints.

## Protected Request Boundary

All canonical AI Test Design endpoints and any retained legacy compatibility wrappers must preserve the same protected-request boundary:

- Authentication validation must be preserved when available. If real authentication is not implemented in the current MVP backend, the endpoint behavior must explicitly remain documented as mocked/local rather than silently treated as production auth.
- Organization and project access must be enforced server-side.
- Input schema validation must reject malformed or invalid requests before AI orchestration work begins.
- Entitlement enforcement is not added in 09C. Entitlement is documented as not applicable to this cleanup block until a dedicated entitlement system exists; current organization/project and credit gates remain the active controls.
- Audit behavior for estimate, start, failure, credit movement, draft creation, and completion must remain covered where applicable.

## Canonical Product API

### `POST /api/ai/test-design/estimate`

**Purpose**: Estimate credits for AI-assisted test design generation before execution.

**Request shape**:

- `organizationId`
- `projectId`
- `userId` when available
- `generationType`: `scenarios_from_business_rule` or `test_cases_from_scenario`
- `sourceArtifactId`
- `context` optional

**Response shape**:

- `estimatedCredits`
- `pricingNote`
- `expiresAt`

**Required behavior**:

- Validates organization/project access server-side.
- Rejects malformed or invalid request bodies.
- Records an auditable estimate event.
- Does not call a real provider.

### `POST /api/ai/test-design/scenarios`

**Purpose**: Generate structured draft test scenarios from a business rule.

**Request shape**:

- `organizationId`
- `projectId`
- `userId` when available
- `businessRuleId`
- `confirmedEstimatedCredits`
- `context` optional

**Response shape**:

- `aiRunId`
- `status`
- `outputArtifactType`: `test_scenario`
- `artifacts`
- `consumedCredits`
- `creditNote`

**Required behavior**:

- Uses canonical orchestration only.
- Validates protected-request requirements before provider work.
- Reserves credits before provider work.
- Uses provider through server-side provider port.
- Parses and validates structured output.
- Persists generated artifacts as AI-assisted drafts.
- Captures credits on success.
- Releases credits on provider or output-validation failure.

### `POST /api/ai/test-design/test-cases`

**Purpose**: Generate structured draft test cases from a test scenario.

**Request shape**:

- `organizationId`
- `projectId`
- `userId` when available
- `scenarioId`
- `confirmedEstimatedCredits`
- `context` optional

**Response shape**:

- `aiRunId`
- `status`
- `outputArtifactType`: `test_case`
- `artifacts`
- `consumedCredits`
- `creditNote`

**Required behavior**:

- Same lifecycle requirements as scenario generation.
- Validates protected-request requirements before provider work.
- Output artifacts remain draft and AI-assisted.

### `GET /api/ai/runs/{aiRunId}`

**Purpose**: Return safe run metadata for frontend status/recovery.

**Response shape**:

- `aiRunId`
- `status`
- `estimatedCredits`
- `consumedCredits`
- `failureCategory` when applicable
- `outputArtifactType` when applicable
- `outputArtifactIds` when applicable

**Required behavior**:

- Does not expose provider prompts, secrets, raw provider payloads, or sensitive internals.
- Returns only metadata safe for the authenticated product context.

## Legacy Compatibility Contract

Legacy root AI endpoints, if retained during implementation, must satisfy all of the following:

- Delegate to the canonical AI Test Design orchestration service.
- Preserve only request/response compatibility needed by existing consumers.
- Not select providers directly.
- Not write `ai_runs` or `credit_transactions` directly.
- Not build independent prompts for active generation.
- Not bypass authentication/local-auth documentation, organization/project access, input schema validation, credit gates, or audit behavior provided by the canonical path.
- Be documented as deprecated compatibility surface.

If no active consumer exists, legacy endpoints should be removed and tests/docs migrated to the canonical API.

## Frontend Contract

`apps/web` must call only FrankInTest product APIs. It must not import provider SDKs, call external AI provider URLs, expose provider keys, or calculate final credit consumption.

## Test Contract

Automated tests must use deterministic mock provider behavior and must fail if a real provider is required for normal validation.
