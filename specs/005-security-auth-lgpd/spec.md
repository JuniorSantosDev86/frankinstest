# Feature Specification: Security, Auth and LGPD Foundation

**Feature Branch**: `005-security-auth-lgpd-foundation`

**Created**: 2026-05-17

**Status**: Draft

## Clarifications

### Session 2026-05-17

- Q: What token mechanism should the backend use for authentication? → A: JWT with HS256 symmetric key. JWT secret must be server-side only — never exposed to `apps/web`. Demo/local token generation permitted only in development/test mode. Production-like environments must require the JWT secret from environment variables. Migration path to RS256 or external auth provider must not be structurally blocked.
- Q: What is the primary rate limiting scope for `/api/checkup/run` and `/api/ai/**`? → A: Per authenticated user (userId from JWT). Unauthenticated requests are rejected before rate limiting. Demo mode maps to a fixed demo userId and is naturally bounded. Per-IP limiting is deferred as a future secondary hardening layer.
- Q: How does the frontend acquire and send the JWT in local/dev mode? → A: Pre-signed dev JWT injected via a local-only environment variable (e.g. `NEXT_PUBLIC_DEV_TOKEN`). Frontend sends it as `Authorization: Bearer <token>`. This variable is only valid in development/test mode; production-like environments must not accept it as an auth source. Full login UI remains out of scope for this block.
- Q: How are audit events verified during testing? → A: Direct PostgreSQL table query in backend integration tests. After each sensitive action, tests assert the expected audit event row exists in the database. No `/api/audit/**` read endpoint is built in this block. An audit query interface remains future scope.
- Q: How is organization context resolved for users belonging to multiple organizations? → A: Callers must send a required `X-Organization-Id` request header. The backend validates the header value against the authenticated user's memberships (server-authoritative). Missing header returns `400`; header value not linked to the authenticated user returns `403`. No implicit first-org selection. No last-used org state in this block.
- Q: What does the backend return for an expired JWT, and is it distinguishable from a missing token? → A: Expired tokens return `401` with the same safe public body as a missing token: `{"error":"UNAUTHORIZED","message":"Autenticação necessária."}`. The backend MUST NOT expose expiry details in the error body. Internal distinction (expired vs. missing) is handled inside `JwtAuthFilter` for logging/audit purposes only.
- Q: Does `AiRunStatusController` (`/api/ai/runs/{aiRunId}`) need the same org-scoped protection as `AiTestDesignController`? → A: Yes. `AiRunStatusController` is under `/api/ai/**` and must receive `AuthenticatedPrincipal` and validate `X-Organization-Id`. It must not return AI run data belonging to a different organization. Missing/wrong org returns `400`/`403` respectively.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Protected Check-up Flow (Priority: P1)

A registered user logs in to FrankInTest and triggers a Check-up estimate or execution. The system identifies the user, validates their organization membership, and associates the Check-up run with that user and organization — no longer relying on hardcoded mock values.

**Why this priority**: This is the minimum required before real AI provider integration can be enabled. Without authenticated identity, every sensitive run is anonymous and unauditable.

**Independent Test**: Can be fully tested by starting the backend, authenticating with a demo/test token, calling `/api/checkup/estimate` and `/api/checkup/run`, and verifying that requests without a token receive `401` and requests with a valid token proceed.

**Acceptance Scenarios**:

1. **Given** an unauthenticated request to `/api/checkup/estimate`, **When** the request reaches the backend, **Then** the system returns `401 Unauthorized` with no partial data.
2. **Given** a valid authenticated user token, **When** the user calls `/api/checkup/estimate`, **Then** the backend resolves the user identity from the token and proceeds normally.
3. **Given** a valid token for organization A, **When** the user attempts to access a Check-up run belonging to organization B, **Then** the system returns `403 Forbidden`.
4. **Given** a valid authenticated request with a valid `X-Organization-Id` header, **When** the Check-up run is created, **Then** `userId` is resolved from the JWT and `organizationId` is validated from the header against server-side membership — neither is taken from the request body.

---

### User Story 2 — Protected AI Test Design Routes (Priority: P1)

A workspace user accesses the AI Test Design assistance endpoints and the AI run status endpoint. The backend validates their token and organization access before allowing any AI-related operation. This includes both `AiTestDesignController` (`/api/ai/test-design/**`) and `AiRunStatusController` (`/api/ai/runs/{aiRunId}`).

**Why this priority**: AI routes represent the highest-cost and highest-sensitivity operations. They must be consistently protected alongside Check-up routes before real provider keys are introduced. A user must not be able to read another organization's AI run status.

**Independent Test**: Can be tested independently by calling `/api/ai/test-design/**` and `/api/ai/runs/{aiRunId}` without a token (expect `401`) and with a valid token from the correct organization (expect success or not-found, but never another org's data).

**Acceptance Scenarios**:

1. **Given** an unauthenticated request to any `/api/ai/**` route (including `/api/ai/runs/{aiRunId}`), **When** it reaches the backend, **Then** the system returns `401`.
2. **Given** an authenticated user from organization A, **When** they call an AI route that belongs to organization B's project, **Then** the system returns `403`.
3. **Given** a valid authenticated request, **When** an AI route executes, **Then** an audit event is recorded with the authenticated user identity.
4. **Given** a valid authenticated request for `GET /api/ai/runs/{aiRunId}`, **When** the `aiRunId` belongs to a different organization than the one in `X-Organization-Id`, **Then** the system returns `403` and does not expose the other organization's run data.

---

### User Story 3 — Demo / Local Auth Mode (Priority: P2)

A developer running FrankInTest locally or in a demo environment can authenticate using a controlled, pre-configured demo token or basic credential, allowing the Check-up MVP to function end-to-end without requiring a production identity provider.

**Why this priority**: Preserves MVP usability for development and demos while the production auth strategy matures.

**Independent Test**: Can be tested by starting the backend with demo mode enabled, setting `NEXT_PUBLIC_DEV_TOKEN` on the frontend, and verifying that all Check-up and AI routes work end-to-end. Also verify the token is rejected when the backend runs without demo mode enabled.

**Acceptance Scenarios**:

1. **Given** the backend is running with demo/local auth configured, **When** a request uses the demo token, **Then** the backend accepts it and maps it to a fixed demo user and organization.
2. **Given** the demo token is used in production-like configuration, **When** the request arrives, **Then** demo auth is rejected (demo mode is disabled).
3. **Given** the demo token is presented, **When** the request proceeds, **Then** all audit events still record the demo user identity.

---

### User Story 4 — LGPD Authorization Confirmation (Priority: P2)

Before a user submits product context, a URL, or business information for a Check-up analysis, they are shown a clear privacy notice and must confirm their authorization to analyze the content. This step is preserved and enhanced with explicit LGPD-aligned copy.

**Why this priority**: Required before real AI is enabled. Prevents unauthorized processing of third-party content and establishes the first LGPD compliance touchpoint.

**Independent Test**: Can be tested by initiating a Check-up on the frontend and verifying the authorization confirmation step exists, contains LGPD-aligned copy in pt-BR, and that the backend refuses to proceed without the confirmation flag.

**Acceptance Scenarios**:

1. **Given** a user initiates a Check-up analysis, **When** they reach the submission step, **Then** a clear privacy/authorization confirmation is presented in pt-BR before the request is sent.
2. **Given** the user submits a Check-up estimate request without the authorization confirmation flag, **When** the backend receives it, **Then** it returns a validation error and does not proceed.
3. **Given** the user confirms authorization and submits, **When** the backend processes the request, **Then** an audit event records that the user explicitly authorized the analysis of this context.

---

### User Story 5 — CORS and Secret Hygiene (Priority: P3)

The backend enforces CORS restrictions that are permissive for local development but restrictive for production-like environments. No provider API keys or secrets appear in any frontend code or response payload.

**Why this priority**: Foundational hygiene required before exposing the system to external users, but does not block internal demo usage.

**Independent Test**: Can be tested by checking that cross-origin requests from unauthorized origins are rejected in non-dev configuration, and by auditing frontend bundles and API responses for the presence of secret values.

**Acceptance Scenarios**:

1. **Given** a cross-origin request from an unauthorized origin in a non-development environment, **When** it reaches the backend, **Then** CORS headers reject it.
2. **Given** a development environment configuration, **When** cross-origin requests arrive from localhost, **Then** they are accepted.
3. **Given** any API response from the backend, **When** inspected, **Then** no provider API keys, secret tokens, or internal credentials appear.

---

### Edge Cases

- What happens when a token has expired mid-session? The user receives a `401` response with the same safe public error body as a missing token (`{"error":"UNAUTHORIZED","message":"Autenticação necessária."}`). The backend MUST NOT leak expiry details in the error body. The frontend should redirect to re-authentication when it receives `401`.
- What happens when a user belongs to multiple organizations and no organization context is provided? The backend returns `400` because the required `X-Organization-Id` header is missing. No implicit selection occurs.
- What happens when the demo token is used in a request that modifies production data? Demo mode must be isolated — demo user data must not interfer with any real organization data.
- What happens if the authorization confirmation flag is absent due to a client bug? The backend must enforce its presence as a required field and return a validation error.
- What happens when rate limits are hit on a sensitive endpoint? The system returns an appropriate throttle response; the event is logged for abuse monitoring.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST require a valid authentication token for all `/api/checkup/**` and `/api/ai/**` routes.
- **FR-002**: System MUST resolve `userId` from the authenticated JWT and `organizationId` from the required `X-Organization-Id` request header. The backend MUST validate that the declared organization is linked to the authenticated user. Missing header returns `400`; unrecognized or unauthorized organization returns `403`. The frontend may send the value but is never the final authority.
- **FR-003**: System MUST return `401 Unauthorized` for requests to protected routes without a valid token.
- **FR-004**: System MUST return `403 Forbidden` when an authenticated user attempts to access resources outside their organization or project.
- **FR-005**: System MUST support a controlled demo/local authentication mode that allows end-to-end testing without a production identity provider.
- **FR-006**: Demo mode MUST be explicitly disabled in non-development configurations.
- **FR-007**: System MUST require an explicit authorization confirmation flag on Check-up estimate and run requests, and reject requests where it is absent.
- **FR-008**: System MUST record an audit event whenever a user authorizes and submits a Check-up analysis, including the user identity and timestamp.
- **FR-009**: System MUST record audit events for unauthorized access attempts (401 and 403 responses) on sensitive routes.
- **FR-010**: System MUST configure CORS to only allow requests from explicitly permitted origins; local development origins must be explicitly listed and not inferred.
- **FR-011**: Provider API keys, secret credentials, and sensitive tokens MUST NOT appear in any API response payload or frontend code.
- **FR-012**: System MUST apply basic rate limiting keyed by authenticated `userId` (from JWT) to `/api/checkup/run` and `/api/ai/**`. Unauthenticated requests must be rejected by the auth filter before reaching the rate limiter. Per-IP limiting is out of scope for this block.
- **FR-013**: Frontend MUST display visible pt-BR LGPD/privacy copy near the Check-up authorization checkbox, stating that the user must have authorization to analyze the submitted URL or context and should avoid submitting unnecessary sensitive data. The copy must be present and legible in the rendered UI, not only in code comments.
- **FR-014**: Existing Check-up MVP flows MUST remain functional under demo/local auth mode without regression. This includes completing a Check-up estimate and run using the demo JWT without receiving a `401`.
- **FR-015**: Backend automated tests MUST cover: unauthenticated access (401), authenticated access to correct organization (200/accepted), and authenticated access to wrong organization (403). This MUST include coverage for both `AiTestDesignController` and `AiRunStatusController`.
- **FR-016**: New MVP UI copy MUST be in Brazilian Portuguese (`pt-BR`).
- **FR-017**: System MUST preserve FrankInTest responsibility boundaries: UX in `apps/web`; business rules, persistence, permissions, credits, AI orchestration, audit logs, integrations, and security decisions in `services/api`.

### Key Entities

- **AuthenticatedPrincipal**: Represents the resolved identity for a request. Contains `userId` (from JWT HS256 claims) and `organizationId` (validated from the `X-Organization-Id` request header against server-side membership rules). Roles are derived server-side. Never populated from untrusted request body or query parameters. JWT signing secret is server-side only.
- **DemoCredential**: A pre-configured, environment-scoped credential mapping to a fixed demo user and organization. Only active when demo mode is explicitly enabled.
- **CheckupAuthorizationEvent**: An audit record capturing user identity, timestamp, target URL/context, and the explicit authorization confirmation for a Check-up analysis.
- **SecurityAuditEvent**: A general audit record for unauthorized access attempts, token validation failures, and rate limit violations.
- **CorsConfiguration**: Environment-scoped configuration defining permitted origins, methods, and headers for cross-origin requests.

### QA Artifact Impact

- **Artifacts created/updated**: Audit events (security, authorization, check-up run confirmation). No new QA workflow artifacts are the primary output of this block.
- **AI run tracking**: Not applicable — this block does not introduce real AI provider calls.
- **Credit impact**: No credit impact — this block establishes guards before credits are consumed.
- **Audit events**: Unauthorized access attempts, authorization confirmation on Check-up submission, demo mode usage, rate limit violations.
- **Sensitive data handling**: Check-up context (URLs, product descriptions, business information) must be treated as potentially sensitive. Access must be scoped to the owning organization. No sensitive context may appear in error responses.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of requests to `/api/checkup/**` and `/api/ai/**` without a valid token are rejected with `401` — verifiable by automated tests.
- **SC-002**: 100% of authenticated requests attempting cross-organization resource access are rejected with `403` — verifiable by automated tests.
- **SC-003**: The existing Check-up MVP end-to-end flow completes successfully using demo/local auth mode — verifiable by running the existing test suite with demo config.
- **SC-004**: Zero provider secrets or internal credentials appear in any frontend bundle or API response — verifiable by static analysis and response inspection.
- **SC-005**: The LGPD authorization confirmation step is present and in pt-BR in all Check-up submission flows — verifiable by manual QA checklist.
- **SC-006**: All existing backend tests pass without modification — verifiable by running the full test suite.
- **SC-007**: All existing frontend lint, tests, and build checks pass if frontend is modified — verifiable by CI pipeline.
- **SC-008**: Audit events for authorization confirmation and unauthorized access attempts are recorded in the database — verifiable by direct table assertions in backend integration tests after sensitive actions. No external audit query interface is required for this block.

## Assumptions

- No production identity provider (e.g., Keycloak, Auth0, Cognito) is being integrated in this block. The auth foundation uses JWT with HS256 symmetric key signing. The JWT secret is server-side only, injected via environment variable. Architecture must not structurally block future migration to RS256 or an external auth provider.
- Social login (Google, GitHub) is out of scope for this block.
- Enterprise RBAC (roles beyond basic user/admin within an organization) is out of scope.
- SSO is out of scope.
- Billing and payment integration are out of scope.
- The demo/local auth mode will map to a single fixed demo user and organization for simplicity.
- Rate limiting in this block will be basic (fixed window or token bucket keyed by authenticated userId) rather than a sophisticated quota system. Per-IP limiting is a future hardening layer.
- LGPD compliance in this block covers: authorization confirmation, audit logging, and initial documentation of retention intent. Full data subject request handling (export, deletion) is deferred to a dedicated compliance block.
- The frontend will not implement a full login page or session management UI in this block. In local/dev mode, the JWT is acquired via a pre-signed dev token set in a local-only environment variable (`NEXT_PUBLIC_DEV_TOKEN`) and sent as `Authorization: Bearer <token>`. This env var is never set in production-like environments. A minimal login form is out of scope for this block.
- Real AI providers will not be called in this block or its automated tests.
- Existing tests must not be broken; new tests are additive.
