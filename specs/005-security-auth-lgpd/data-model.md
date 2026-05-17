# Data Model: Security, Auth and LGPD Foundation

**Date**: 2026-05-17 | **Feature**: 005-security-auth-lgpd

## Entities

### AuthenticatedPrincipal (in-memory, not persisted)

Resolved by `JwtAuthFilter` from a valid JWT; placed in `SecurityContext`; injected into controllers via `@AuthenticationPrincipal`.

| Field | Type | Source | Notes |
|---|---|---|---|
| `userId` | String | JWT claim `sub` | Canonical user identifier |
| `organizationIds` | List\<String\> | JWT claim `orgs` | Organizations this user is a member of |
| `roles` | List\<String\> | JWT claim `roles` | MVP: always `["user"]`; admin role deferred |

**Invariants**:
- `userId` is never null or blank after successful token validation.
- `organizationIds` contains at least one entry for any valid non-demo user.
- Never populated from request body or query parameters.

---

### JWT Claims (HS256 signed)

Standard + custom claims embedded in each token.

| Claim | Key | Type | Notes |
|---|---|---|---|
| Subject | `sub` | String | userId |
| Issued at | `iat` | Long | Unix timestamp |
| Expiry | `exp` | Long | Always present. Dev tokens: configurable TTL (default 24h via `${jwt.demo-ttl-seconds}`). Production value TBD. Expired tokens return `401` with the same safe body as missing tokens — expiry details MUST NOT appear in the error response. |
| Organizations | `orgs` | Array\<String\> | List of organizationId values |
| Roles | `roles` | Array\<String\> | MVP: `["user"]` |

**Signing**: HMAC-SHA256 with a secret loaded from `JWT_SECRET` environment variable. Minimum 256-bit secret enforced at startup.

---

### DemoCredential (configuration, not persisted)

Active only when `demo-auth.enabled=true` (dev Spring profile).

| Field | Value |
|---|---|
| `userId` | `user_demo_qa_lead` |
| `organizationIds` | `["org_demo_personal"]` |
| `roles` | `["user"]` |

The `JwtService` generates and returns a signed token when `generateDemoToken()` is called. The `DemoAuthConfigurer` (not `JwtService`) is the sole component responsible for calling this method at startup and logging the result. No database row required.

---

### Existing: audit_log (PostgreSQL, already exists)

No schema change. The following columns are already present and will now carry real values instead of mock strings:

| Column | Type | Change in this block |
|---|---|---|
| `organization_id` | VARCHAR | Now populated from validated `X-Organization-Id` header (was `org_mock`) |
| `user_id` | VARCHAR | Now populated from JWT `sub` claim (was `user_mock`) |
| `event_type` | VARCHAR | New event types: `SECURITY_401`, `SECURITY_403`, `RATE_LIMIT_EXCEEDED`, `CHECKUP_AUTHORIZED` |
| `entity_type` | VARCHAR | Existing values unchanged |
| `entity_id` | VARCHAR | Existing values unchanged |
| `metadata` | TEXT | JSON; may include `{ "route": "..." }` for security events |
| `created_at` | TIMESTAMP | Unchanged |

---

### Organization Membership (static MVP mapping, future DB table)

`WorkspaceAccessService` will validate `organizationId` from `X-Organization-Id` against the authenticated principal's `organizationIds` list. For MVP demo mode, this mapping is:

| userId | organizationIds |
|---|---|
| `user_demo_qa_lead` | `["org_demo_personal"]` |

When a real `organization_members` table is added (future block), `WorkspaceAccessService` will query it. The method signature `requireOrgAccess(AuthenticatedPrincipal, String organizationId)` does not change.

---

## State Transitions

### Request lifecycle for protected endpoints

```
Incoming request
  → [No Authorization header] → 401 (JwtAuthFilter)
  → [Invalid/expired JWT] → 401 (JwtAuthFilter)
  → [Valid JWT] → SecurityContext populated with AuthenticatedPrincipal
      → [No X-Organization-Id header] → 400 (WorkspaceAccessService)
      → [organizationId not in principal.organizationIds] → 403 (WorkspaceAccessService)
      → [Rate limit exceeded] → 429 (RateLimitFilter) + audit event RATE_LIMIT_EXCEEDED
      → [Valid principal + org] → Controller proceeds
          → [AiRunStatusController: run belongs to different org] → 403
```

### Audit event types added in this block

| Event Type | Trigger | entityType | entityId |
|---|---|---|---|
| `SECURITY_401` | JWT missing or invalid on protected route | `ROUTE` | request path |
| `SECURITY_403` | Authenticated user denied access to org/resource | `ROUTE` | request path |
| `RATE_LIMIT_EXCEEDED` | Per-user bucket empty on sensitive route | `ROUTE` | request path |
| `CHECKUP_AUTHORIZED` | User submits Check-up with `userAuthorized=true` | `CHECKUP_RUN` | aiRunId |

Note: `CHECKUP_AUTHORIZED` was already being recorded by `CheckupService`; this block ensures it carries the real `userId` and `organizationId`.
