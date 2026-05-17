# Security, Auth & LGPD Requirements Quality Checklist

**Purpose**: Validate that security, authentication, LGPD, API contract, and rate limiting requirements in this feature are complete, clear, consistent, and measurable before implementation begins.
**Created**: 2026-05-17
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md) | [contracts/auth-api.md](../contracts/auth-api.md)
**Depth**: Standard (PR review gate)
**Focus**: Security/Auth · LGPD/Privacy · API Contract · Rate Limiting · CORS

---

## Requirement Completeness

- [ ] CHK001 — Are authentication requirements defined for **every** protected route pattern (not just `/api/checkup/**` and `/api/ai/**`)? Is it clear which routes are intentionally public? [Completeness, Spec §FR-001, Gap]
- [ ] CHK002 — Are the JWT claim fields (`sub`, `orgs`, `roles`, `iat`, `exp`) all specified with their types and constraints? Is the minimum secret length (256-bit) documented as a requirement? [Completeness, data-model.md §JWT Claims]
- [ ] CHK003 — Are requirements defined for what happens when the `JWT_SECRET` environment variable is absent or below the minimum entropy threshold at startup? [Completeness, Gap]
- [ ] CHK004 — Are requirements defined for token expiry handling — specifically, what the frontend must do when it receives a `401` on an expired token (redirect, re-auth prompt, silent retry)? [Completeness, Spec §Edge Cases]
- [ ] CHK005 — Are requirements defined for the demo JWT rotation behavior — specifically, does the token change on every restart, and does the spec document the implication for long-running dev sessions? [Completeness, Plan §Demo Mode]
- [ ] CHK006 — Are LGPD audit retention requirements documented anywhere (even as a stub or deferral note)? The spec mentions "initial documentation of retention intent" but no retention period or data minimization rule appears in the spec. [Completeness, Spec §Assumptions, Gap]
- [ ] CHK007 — Are requirements defined for what `SecurityAuditEvent` metadata must contain for each event type (`SECURITY_401`, `SECURITY_403`, `RATE_LIMIT_EXCEEDED`, `CHECKUP_AUTHORIZED`)? [Completeness, data-model.md §Audit Event Types]
- [ ] CHK008 — Are requirements specified for the `roles` claim contents in the JWT? The spec says MVP always uses `["user"]` but does not define what a future `admin` role would gate — is this deferral explicitly documented? [Completeness, Assumption]

---

## Requirement Clarity

- [ ] CHK009 — Is "demo mode disabled in non-development configurations" precisely defined? What constitutes a "non-development configuration" — a Spring profile name, an environment variable, a property flag, or all of the above? [Clarity, Spec §FR-006, Ambiguity]
- [ ] CHK010 — Is the `X-Organization-Id` header validation rule stated unambiguously? Specifically: does the backend validate against JWT `orgs` claim only, or against a DB membership lookup, or both? The plan documents a static MVP mapping — is this distinction reflected in the spec? [Clarity, Spec §FR-002, Plan §Org Membership]
- [ ] CHK011 — Is "rate limiting keyed by authenticated userId" defined with a specific algorithm (token bucket vs. fixed window) and configuration unit (requests per minute, per hour)? The plan mentions 20 req/min but the spec only says "basic rate limiting." [Clarity, Spec §FR-012, Plan §Rate Limiting]
- [ ] CHK012 — Is the `Retry-After` header in the 429 response defined as a requirement (not just shown in the contract)? Is the value (60 seconds) a fixed constant or configurable? [Clarity, contracts/auth-api.md §429, Ambiguity]
- [ ] CHK013 — Is "LGPD-aligned privacy confirmation copy" defined with specific content requirements? The spec requires pt-BR copy but does not specify what the copy must include (data usage purpose, retention, third-party disclosure). [Clarity, Spec §FR-013, Ambiguity]
- [ ] CHK014 — Is "no sensitive context may appear in error responses" defined with a list of what constitutes sensitive context? URLs, product descriptions, business information are named in the spec — is this list exhaustive or illustrative? [Clarity, Spec §QA Artifact Impact, Ambiguity]
- [ ] CHK015 — Is the `NEXT_PUBLIC_DEV_TOKEN` variable name specified as a requirement or only as an example? The spec uses "e.g." — is any name acceptable or is this the canonical name? [Clarity, Spec §Clarifications Q3, Ambiguity]

---

## Requirement Consistency

- [ ] CHK016 — Are the HTTP status codes for missing/invalid JWT consistent between the spec (`401`), the contract (`401`), and the plan ("`401` before reaching controllers")? Confirm no section uses `403` for a missing token scenario. [Consistency, Spec §FR-003, contracts/auth-api.md]
- [ ] CHK017 — Is the `400` response for missing `X-Organization-Id` consistent between the spec (Clarifications Q5: "Missing header returns `400`"), the FR (FR-002: "Missing header returns `400`"), and the contract (`400 Bad Request` response)? [Consistency, Spec §FR-002, contracts/auth-api.md §400]
- [ ] CHK018 — Does the `AuthenticatedPrincipal` definition in the spec match between the data model (`userId`, `organizationIds`, `roles`) and the plan's controller usage (`principal.userId()`, `principal.organizationIds()`)? Are field names canonical and stable? [Consistency, data-model.md §AuthenticatedPrincipal, Plan §Design Decisions]
- [ ] CHK019 — Is the demo user identity (`user_demo_qa_lead`, `org_demo_personal`) consistent between `mockSession.ts` (existing), the spec Assumptions, the data model, and the contract? A mismatch would break existing frontend behavior. [Consistency, Spec §DemoCredential, data-model.md]
- [ ] CHK020 — Are the audit event types (`SECURITY_401`, `SECURITY_403`, `RATE_LIMIT_EXCEEDED`, `CHECKUP_AUTHORIZED`) consistent between the spec, data model, and contract? Is there a canonical registry for event type strings? [Consistency, data-model.md §Audit Event Types, contracts/auth-api.md §Audit Events]

---

## Acceptance Criteria Quality

- [ ] CHK021 — Is SC-001 ("100% of requests without a valid token are rejected with `401`") measurable without ambiguity? Does it cover both missing-token and invalid-token cases, or only missing? [Measurability, Spec §SC-001]
- [ ] CHK022 — Is SC-002 ("100% of authenticated requests attempting cross-organization access are rejected with `403`") testable? Is "cross-organization access" defined precisely enough to write a test — does it include resource ownership checks or only header mismatch? [Measurability, Spec §SC-002]
- [ ] CHK023 — Is SC-004 ("Zero provider secrets or internal credentials appear in any frontend bundle or API response") defined with a concrete verification method? "Static analysis and response inspection" is mentioned — are specific patterns or tools required? [Measurability, Spec §SC-004]
- [ ] CHK024 — Is SC-008 ("Audit events are recorded in the database — verifiable by direct table assertions") specific enough? Does it name which event types must be asserted, or leave that to test authors? [Measurability, Spec §SC-008, Clarifications Q4]
- [ ] CHK025 — Is the rate limiting success criterion measurable? SC-001 through SC-008 do not include a criterion for rate limiting behavior (e.g., "requests beyond the limit receive 429 with correct `Retry-After`"). [Measurability, Gap]

---

## Scenario Coverage

- [ ] CHK026 — Are requirements defined for the scenario where a user sends a valid JWT but one that was issued by a different secret (e.g., a token from a previous dev environment)? Is this treated as `401` (invalid signature) or a different error? [Coverage, Spec §FR-003, Gap]
- [ ] CHK027 — Are requirements defined for the scenario where the `X-Organization-Id` header is present but empty string? Is empty string treated the same as missing (400) or as an invalid value (different error)? [Coverage, Edge Case, Gap]
- [ ] CHK028 — Are requirements defined for concurrent rate limit edge cases — specifically, does the per-user bucket reset correctly after the refill window, and is this covered in the requirements or left to implementation? [Coverage, Spec §FR-012, Gap]
- [ ] CHK029 — Is the alternate flow covered where the frontend sends `NEXT_PUBLIC_DEV_TOKEN` but the backend is running in non-dev mode? The contract says it is rejected — but is the rejection defined as a `401` (invalid token) or a different signal? [Coverage, Spec §FR-006, contracts/auth-api.md]
- [ ] CHK030 — Are requirements defined for the `getCheckupRun` route (`GET /api/checkup/runs/{aiRunId}`) ownership check — specifically, must the `aiRunId` belong to the authenticated user's organization, or is any authenticated user from any org allowed? [Coverage, contracts/auth-api.md §Protected Routes]
- [ ] CHK031 — Are recovery requirements defined for a partial `JwtAuthFilter` failure (e.g., JWT library throws an unexpected exception)? Is the fallback a `401` or a `500`? [Coverage, Exception Flow, Gap]

---

## Non-Functional Requirements

- [ ] CHK032 — Is there a latency requirement for the JWT validation step? Token validation adds overhead to every protected request — is a ceiling defined (e.g., "JWT validation must add no more than Xms to p95 response time")? [NFR, Gap]
- [ ] CHK033 — Is there a memory requirement for the in-process Bucket4j rate limiter? An unbounded per-userId bucket map could grow without limit if userIds are not pruned — is cleanup/eviction specified as a requirement? [NFR, Plan §Rate Limiting, Gap]
- [ ] CHK034 — Are observability requirements defined for security events? Is there a requirement that `401`, `403`, and `429` responses are logged at a specific log level, with specific fields, for operational monitoring? [NFR, Gap]
- [ ] CHK035 — Is there a requirement that the JWT signing secret meets a minimum strength standard (key length, entropy source)? The plan mentions "minimum 256-bit enforced at startup" but this does not appear explicitly in the spec. [NFR, Spec §Assumptions, Gap]

---

## Dependencies & Assumptions

- [ ] CHK036 — Is the assumption that no `organization_members` table exists documented as a deliberate MVP deferral with a clear trigger condition for when it will be added? [Assumption, Plan §Org Membership]
- [ ] CHK037 — Is the dependency on `spring-boot-starter-security` + `jjwt` documented as new dependencies with any known compatibility constraints relative to the existing Spring Boot version in `pom.xml`? [Dependency, research.md]
- [ ] CHK038 — Is the assumption that the existing `audit_log` table schema is sufficient (no new columns needed) validated? Does the `metadata` column have a type or size constraint that could affect JSON payloads for security events? [Assumption, data-model.md §audit_log]
- [ ] CHK039 — Is the assumption that Bucket4j in-memory is acceptable for MVP explicitly documented with the trigger condition for migrating to Redis (e.g., "when multi-node deployment is needed")? [Assumption, research.md §Rate Limiter]
- [ ] CHK040 — Is the dependency on `NEXT_PUBLIC_DEV_TOKEN` being manually set in `.env.local` documented as a developer onboarding step? Is there a risk that developers skip this and hit `401` errors with no clear guidance? [Dependency, Gap]

---

## Ambiguities & Conflicts

- [ ] CHK041 — FR-006 appears **twice** in the spec (once as "Demo mode MUST be explicitly disabled" and once as "System MUST preserve FrankInTest responsibility boundaries"). Is this a numbering collision that needs resolution before task generation? [Conflict, Spec §Functional Requirements]
- [ ] CHK042 — The spec states `organizationId` is "resolved from the authenticated principal" (FR-002) but the clarification (Q5) and plan say it comes from the `X-Organization-Id` header (validated against principal). Are these two phrasings consistent, or does the spec need to be updated to remove the ambiguity? [Ambiguity, Spec §FR-002, Clarifications]
- [ ] CHK043 — The spec says "no sensitive context may appear in error responses" but does not define whether this applies to `400` validation errors (which might echo the field name) or only to `4xx` errors on AI/checkup routes. [Ambiguity, Spec §QA Artifact Impact]
- [ ] CHK044 — Is the scope of `CHECKUP_AUTHORIZED` audit event precisely defined? The spec says it is recorded "when a user confirms authorization and submits" — does this apply to the estimate call, the run call, or both? [Ambiguity, Spec §FR-008, data-model.md]
