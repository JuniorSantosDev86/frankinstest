# Implementation Plan: Security, Auth and LGPD Foundation

**Branch**: `005-security-auth-lgpd-foundation` | **Date**: 2026-05-17 | **Spec**: [spec.md](./spec.md)

## Summary

Introduce a JWT HS256 authentication foundation to the Spring Boot backend, replace all `org_mock`/`user_mock` hardcodes with a real `AuthenticatedPrincipal` resolved from incoming tokens, protect `/api/checkup/**` and `/api/ai/**` routes with a Spring Security filter chain, add per-user rate limiting on sensitive endpoints, harden CORS to be environment-scoped, enforce the `X-Organization-Id` header for org context resolution, add LGPD-aligned authorization confirmation enforcement at the backend layer, update audit events to carry real identity, and update the frontend to send `Authorization: Bearer <token>` from a dev env var — all without calling real AI providers, adding billing, or building a login UI.

## Technical Context

**Language/Version**: Java 21 + Spring Boot (services/api), Next.js 14 + TypeScript (apps/web)

**Primary Dependencies**:
- Backend: `spring-boot-starter-web`, `spring-boot-starter-jdbc`, `spring-boot-starter-security` (to add), `jjwt` (to add for JWT parsing/signing), `spring-boot-starter-test`, H2 (test), PostgreSQL (runtime)
- Frontend: Next.js, TypeScript, Tailwind — no new packages expected

**Storage**: PostgreSQL (runtime). `audit_log` table already exists. No new tables required; `organization_members` lookup will be resolved via the existing mock membership in Phase 0 and replaced by a real DB lookup if the table exists, otherwise a static demo mapping.

**Testing**: Backend — Spring Boot integration tests (`@SpringBootTest` + `MockMvc`) for auth filter, 401/403 cases, and audit event assertions via JDBC query. Frontend — existing lint/build/test pipeline; minimal changes to `checkupApi.ts` mean no new E2E tests are required in this block.

**Target Platform**: Linux server (single-node MVP monolith)

**Performance Goals**: No new throughput targets. Rate limit: ≤ 20 requests/minute per authenticated userId on `/api/checkup/run` and `/api/ai/**` (configurable, not hardcoded).

**Constraints**: No real AI provider calls in tests. JWT secret via environment variable only — never hardcoded. Demo mode disabled in non-development Spring profiles. `NEXT_PUBLIC_DEV_TOKEN` valid only in local dev.

**Scale/Scope**: Single monolith, MVP user base. Rate limiter implemented in-memory (Guava or Bucket4j) — sufficient for MVP, replaceable with Redis later.

## Constitution Check

| Principle | Status | Notes |
|---|---|---|
| Architecture boundary | PASS | Security filter, JWT parsing, rate limiting live in `services/api`. Frontend only adds the `Authorization` header. |
| Modular monolith | PASS | All new backend code is new packages inside the Spring Boot monolith (`system/security`, `system/ratelimit`). No new services. |
| Responsibility boundary | PASS | Auth decisions, org membership validation, audit recording, rate limiting — all in `services/api`. Frontend never decides permissions. |
| AI governance | PASS | No AI provider calls in this block. Mock provider continues to be used in all existing tests. |
| Security/LGPD | PASS | This block *is* the security/LGPD foundation. Secrets server-side only. Auth confirmation enforced server-side. Audit events carry real identity after this block. |
| Product language | PASS | No new UI copy introduced. If any error messages surface to frontend they are already in pt-BR. |
| Testing discipline | PASS | New integration tests cover 401, 403, valid-auth, org-mismatch, audit assertion, rate limit. Existing tests must not break. |
| Execution discipline | PASS | Scope is vertical and bounded. No unrelated refactors. |

No violations. Complexity Tracking section not needed.

## Project Structure

### Documentation (this feature)

```text
specs/005-security-auth-lgpd/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── contracts/           ← Phase 1 output
│   └── auth-api.md
└── tasks.md             ← /speckit-tasks output (not created here)
```

### Source Code

```text
services/api/
├── pom.xml                                          ← add spring-security + jjwt deps
└── src/
    ├── main/java/com/frankintest/api/
    │   ├── system/
    │   │   ├── CorsConfig.java                      ← update: env-scoped allowed origins
    │   │   ├── WorkspaceAccessService.java          ← update: validate X-Organization-Id against membership
    │   │   ├── security/
    │   │   │   ├── JwtAuthFilter.java               ← new: extracts + validates JWT from Authorization header
    │   │   │   ├── JwtService.java                  ← new: sign/verify JWT HS256, demo token generation
    │   │   │   ├── SecurityConfig.java              ← new: Spring Security filter chain, protect /api/checkup/** and /api/ai/**
    │   │   │   ├── AuthenticatedPrincipal.java      ← new: value object (userId, organizationId, roles)
    │   │   │   └── DemoAuthConfigurer.java          ← new: demo mode token acceptance (dev profile only)
    │   │   └── ratelimit/
    │   │       └── RateLimitFilter.java             ← new: per-userId rate limiting on checkup/run + ai/**
    │   ├── checkup/
    │   │   └── CheckupController.java               ← update: remove org_mock/user_mock, resolve from principal + X-Organization-Id header
    │   └── ai/
    │       └── AiTestDesignController.java          ← update: remove org/user from request body trust; resolve from principal
    └── test/java/com/frankintest/api/
        ├── system/
        │   └── security/
        │       ├── JwtAuthFilterTest.java           ← new: 401 on missing/invalid token
        │       ├── CheckupAuthProtectionTest.java   ← new: 401/403 for checkup routes
        │       └── AiAuthProtectionTest.java        ← new: 401/403 for AI routes
        └── checkup/
            └── CheckupAuditWithIdentityTest.java    ← new: audit event carries real userId after auth

apps/web/
└── src/lib/
    ├── auth/
    │   └── getDevToken.ts                          ← new: reads NEXT_PUBLIC_DEV_TOKEN for dev mode
    └── checkup/
        └── checkupApi.ts                           ← update: attach Authorization: Bearer header
```

---

## Phase 0: Research

See [research.md](./research.md) for full findings. Key decisions:

| Topic | Decision | Rationale |
|---|---|---|
| JWT library | `io.jsonwebtoken:jjwt-api` + `jjwt-impl` + `jjwt-jackson` (0.12.x) | Industry standard for Spring Boot JWT; well-maintained, no extra infrastructure |
| Spring Security integration | `spring-boot-starter-security` with custom `OncePerRequestFilter` (no form login) | Stateless filter chain; no session; easy to test with MockMvc |
| Rate limiter | Bucket4j in-memory (no Redis) | Zero-infrastructure for MVP; API is Redis-compatible for future upgrade |
| CORS env-scoping | `@Value` injection of `allowed-origins` from `application.yml` profile | Existing CorsConfig already uses Spring MVC; just add profile-specific property |
| Demo mode token | Static pre-signed JWT generated at startup when `demo-auth.enabled=true` (dev profile) | No UI, no extra endpoint; dev sets `NEXT_PUBLIC_DEV_TOKEN` from startup log output |
| Org membership validation | Static demo mapping in `WorkspaceAccessService` for MVP; shape ready for DB query | No `organization_members` table yet; static map avoids a new migration while keeping the interface stable |
| `X-Organization-Id` header | Required on all protected routes; validated against user's allowed orgs in `WorkspaceAccessService` | Explicit, server-authoritative, no implicit first-org selection |

---

## Phase 1: Design & Contracts

See [data-model.md](./data-model.md) and [contracts/auth-api.md](./contracts/auth-api.md).

### Key Design Decisions

#### 1. Spring Security Filter Chain

```
Request
  → JwtAuthFilter (extracts Bearer token, validates signature, populates SecurityContext)
      → RateLimitFilter (reads userId from SecurityContext, applies per-user bucket)
          → Controller (reads AuthenticatedPrincipal, validates X-Organization-Id)
```

- `JwtAuthFilter` sets `UsernamePasswordAuthenticationToken` in `SecurityContext` on valid JWT.
- Missing or invalid token → 401 before reaching controllers.
- `SecurityConfig` disables form login, CSRF (stateless API), and sessions.
- Protected matchers: `/api/checkup/**`, `/api/ai/**`.
- Public matchers: `/api/health`, `/actuator/health`.

#### 2. AuthenticatedPrincipal

```java
// Resolved from JWT claims by JwtAuthFilter; injected into controllers via @AuthenticationPrincipal
record AuthenticatedPrincipal(String userId, List<String> organizationIds, List<String> roles) {}
```

Controllers extract `organizationId` from the `X-Organization-Id` header and validate it against `principal.organizationIds()` via `WorkspaceAccessService`.

#### 3. CheckupController — mock removal

Before:
```java
String organizationId = "org_mock";
String userId = "user_mock";
```

After:
```java
@PostMapping("/run")
public ResponseEntity<?> run(
    @RequestBody CheckupModels.CheckupRequest request,
    @AuthenticationPrincipal AuthenticatedPrincipal principal,
    @RequestHeader("X-Organization-Id") String organizationId
) {
    workspaceAccessService.requireOrgAccess(principal, organizationId); // 403 if not member
    checkupService.run(request, organizationId, principal.userId());
    ...
}
```

#### 4. Demo Mode

When `demo-auth.enabled=true` (Spring `dev` profile):
- `JwtService` generates a pre-signed JWT at startup with claims `{ userId: "user_demo_qa_lead", organizationIds: ["org_demo_personal"] }`.
- Token is logged at `INFO` level on startup.
- Dev sets this as `NEXT_PUBLIC_DEV_TOKEN` in `apps/web/.env.local`.
- Backend validates it like any other JWT (same HS256 path) — no special demo bypass in the filter.
- In non-dev profiles `demo-auth.enabled=false`; if the demo secret leaks into prod config the token is simply invalid (different signing secret).

#### 5. CORS hardening

```yaml
# application-dev.yml
cors:
  allowed-origins: http://localhost:3000

# application-prod.yml (future)
cors:
  allowed-origins: https://app.frankintest.com
```

`CorsConfig` reads `${cors.allowed-origins}` as a comma-separated list.

#### 6. Rate Limiting

`RateLimitFilter` uses Bucket4j in-process. On each request to `/api/checkup/run` or `/api/ai/**`:
- Reads `userId` from `SecurityContext`.
- Retrieves or creates a `Bucket` for that userId (20 tokens, refill 20/minute).
- If bucket empty → HTTP 429 with `Retry-After` header; `SecurityAuditEvent` recorded.

#### 7. Frontend change

`apps/web/src/lib/auth/getDevToken.ts`:
```typescript
export function getDevToken(): string | null {
  return process.env.NEXT_PUBLIC_DEV_TOKEN ?? null
}
```

`checkupApi.ts` — `buildAuthHeaders()` helper attached to every fetch call:
```typescript
function buildAuthHeaders(): Record<string, string> {
  const token = getDevToken()
  const orgId = getMockSession().activeOrganization.id
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    'X-Organization-Id': orgId,
  }
}
```

#### 8. Audit event identity

After this block, all audit events created by `CheckupController` and `AiTestDesignController` use `principal.userId()` and the validated `organizationId` — no more `org_mock`/`user_mock` strings in audit rows.

### LGPD Notes

- The `userAuthorized` flag already exists in `CheckupModels.CheckupRequest`. The backend already checks it. This block adds the backend test that verifies the 422 response when it's absent.
- No new LGPD copy is added to the frontend in this block (existing authorization checkbox is preserved). A `<!-- LGPD: ... -->` comment is added to the checkup page to document the retention note location for the next compliance block.
- No sensitive context (URL, product description) is included in error response bodies.
