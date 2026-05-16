# Data Model: AI Foundation Cleanup & Spec Alignment

This block does not introduce new persistent entities. It clarifies ownership and lifecycle rules for existing AI foundation concepts.

## Canonical AI Orchestration Path

**Purpose**: Defines the single approved flow for AI-assisted test design operations.

**Owned responsibilities**:

- Validate organization and project access.
- Estimate credits before generation.
- Create and update AI run records.
- Reserve, capture, and release credits.
- Select provider through a backend-owned provider port.
- Parse and validate provider output.
- Persist generated QA drafts.
- Record audit events for estimate, start, failure, credit movement, draft creation, and completion.

**Validation rules**:

- Must be the only active business-logic path for AI test design generation.
- Must not expose provider keys or provider-specific details to `apps/web`.
- Must return structured product responses, not provider-native payloads.

## Legacy AI Path

**Purpose**: Represents pre-09A/09B AI controllers, services, provider factories, DTOs, and tests that duplicate or conflict with the canonical path.

**Allowed states**:

- `removed`: No active consumer exists and tests/docs are migrated.
- `compatibility_wrapper`: Endpoint still needed temporarily and delegates to canonical orchestration.
- `renamed_or_adapted`: Code remains only after responsibility is narrowed and no duplicate business logic remains.
- `documented_deprecated`: Temporary state when compatibility remains; deprecation must be visible in docs/run report.

**Forbidden behavior**:

- Independent provider selection.
- Independent prompt construction for active generation.
- Independent credit accounting.
- Independent AI run persistence.
- Returning loose chat or unvalidated provider output.

## AI Run

**Purpose**: Server-side trace of an AI operation.

**Required fields preserved by 09C**:

- Organization, project, and user context.
- Feature/generation type.
- Source artifact type and source artifact reference.
- Input summary.
- Estimated, reserved, and consumed credits as applicable.
- Status and failure category.
- Output artifact type and generated artifact IDs when successful.
- Created, started, completed, or failed timestamps.

**State transitions**:

- `estimated` -> `running` -> `completed`
- `estimated` -> `failed`
- `running` -> `failed`

Failures caused by provider or output validation must release reserved credits and remain inspectable through safe metadata.

## Credit Transaction

**Purpose**: Audit-friendly record of credit movement for AI work.

**Required behaviors preserved by 09C**:

- Estimate before user-confirmed generation.
- Reserve before provider work.
- Capture on successful completion.
- Release/refund when provider, platform, or output-validation failure prevents a valid artifact.
- No unfair final consumption on platform/provider failure.

## Structured QA Draft

**Purpose**: Generated QA artifact that remains a draft until human review.

**Supported artifact types in 09C**:

- Test scenario.
- Test case.

**Required fields preserved by 09C**:

- ID.
- Title.
- Structured description/details.
- Draft status.
- AI-assisted marker.
- AI run reference.
- Source artifact relationship.

## Provider Configuration

**Purpose**: Server-side selection between deterministic mock behavior and authorized real provider behavior.

**Validation rules**:

- Automated tests use mock provider only.
- Frontend receives no provider secret.
- Provider selection remains backend-owned.
- Real provider integration behavior is not expanded in this block.
