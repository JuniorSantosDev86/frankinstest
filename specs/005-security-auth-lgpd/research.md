# Research: Security, Auth and LGPD Foundation

**Date**: 2026-05-17 | **Feature**: 005-security-auth-lgpd

## JWT Library for Spring Boot

**Decision**: `io.jsonwebtoken:jjwt-api` + `jjwt-impl` + `jjwt-jackson` (version 0.12.x)

**Rationale**: JJWT is the most widely adopted JWT library in the Spring Boot ecosystem. Version 0.12.x modernized the API (builder-based, fluent), supports HS256 out of the box, and requires no additional infrastructure. The split into `api`/`impl`/`jackson` modules keeps compile-time dependencies minimal.

**Alternatives considered**:
- `spring-security-oauth2-resource-server` with `spring-security-oauth2-jose`: Designed for OAuth2/OIDC with a remote JWKS endpoint. Overkill for a single-server MVP with a symmetric key; would impose unnecessary configuration complexity.
- `nimbus-jose-jwt`: Used internally by Spring Security OAuth2. Powerful but low-level; JJWT provides a simpler API for this use case.

---

## Spring Security Integration Pattern

**Decision**: `spring-boot-starter-security` with a custom `OncePerRequestFilter` (stateless, no session, no form login)

**Rationale**: Spring Security is the standard for Spring Boot auth. A stateless filter chain with a custom `OncePerRequestFilter` is idiomatic for REST APIs: no sessions, no CSRF (not needed for Bearer token APIs), and easy to test with `MockMvc` using `.with(SecurityMockMvcRequestPostProcessors.authentication(...))` or custom test JWT factories.

**Alternatives considered**:
- Manual servlet filter without Spring Security: Avoids the Spring Security dependency but loses the `SecurityContext` propagation, `@AuthenticationPrincipal` injection, and `MockMvc` integration. More code to maintain.
- Spring Security with method-level `@PreAuthorize`: Useful for fine-grained RBAC but adds complexity for MVP. URL-pattern matching at the filter chain level is sufficient here.

---

## Rate Limiting Library

**Decision**: Bucket4j in-memory (`com.bucket4j:bucket4j-core`)

**Rationale**: Bucket4j implements the token bucket algorithm with a clean API, zero infrastructure dependencies (in-memory for MVP), and a well-documented Redis migration path for future scaling. It integrates naturally with Spring Boot as a plain dependency — no auto-configuration required.

**Alternatives considered**:
- Guava `RateLimiter`: Simpler but per-JVM, not per-user (no keyed buckets). Would require a `ConcurrentHashMap<String, RateLimiter>` wrapper anyway.
- Spring Cloud Gateway rate limiting: Requires Redis and moves rate limiting to a gateway layer — not appropriate for a single monolith MVP.
- Resilience4j RateLimiter: Thread-semaphore based, not token bucket; less intuitive for request-burst use cases.

---

## CORS Environment Scoping

**Decision**: `@Value`-injected comma-separated `cors.allowed-origins` property, profile-specific in `application-dev.yml` / `application-prod.yml`

**Rationale**: The existing `CorsConfig` already uses Spring MVC `WebMvcConfigurer`. Adding `@Value("${cors.allowed-origins}")` and splitting across Spring profiles is the minimal-change approach — no new libraries, no new configuration classes.

**Alternatives considered**:
- Hardcode `localhost:3000` permanently: Already the current state. Fails the "restrictive in non-dev environments" requirement.
- Spring Cloud Config or env-specific YAML maps: Unnecessarily complex for a two-profile setup (dev + prod).

---

## Demo Token Strategy

**Decision**: Pre-signed JWT generated at startup when `demo-auth.enabled=true` (Spring `dev` profile), logged at INFO level, consumed by `NEXT_PUBLIC_DEV_TOKEN`

**Rationale**: Zero UI friction for developers. The backend startup log prints the token once; the developer pastes it into `.env.local`. The backend validates it through the same JWT HS256 path as production tokens — no special bypass. Demo mode is profile-guarded; the demo secret is different from any future production secret, so a leaked demo token is harmless in prod.

**Alternatives considered**:
- Static hardcoded token: Simpler but creates a risk if accidentally committed to source control. A generated-at-startup token rotates on each restart and is never stored.
- `/api/auth/demo-login` endpoint: More conventional but adds a new route and request, and requires the frontend to make a login call before any other call. The env-var approach is zero-friction.
- HTTP Basic auth with a demo user: Spring Security form login defaults; conflicts with the stateless Bearer token design.

---

## Organization Membership Validation

**Decision**: Static demo mapping in `WorkspaceAccessService` for MVP; interface shaped for future DB query

**Rationale**: There is no `organization_members` table yet. A static map `{ "user_demo_qa_lead" → ["org_demo_personal"] }` loaded from configuration (or hardcoded in the demo service) avoids a new migration while keeping the `WorkspaceAccessService.requireOrgAccess(principal, organizationId)` signature stable. When a real membership table is added, only the service implementation changes — controllers and filter are untouched.

**Alternatives considered**:
- Create `organization_members` table now: More complete but out of scope for this block. Adding schema without a full user registration flow creates orphaned infrastructure.
- Trust `organizationIds` claim in JWT directly (no server-side validation): Violates the "backend is the final authority" constitution principle. JWT claims can be fabricated if the signing secret is ever compromised.

---

## X-Organization-Id Header

**Decision**: Required HTTP request header on all protected routes; validated server-side against principal's allowed organizations

**Rationale**: Explicit org context declaration is cleaner than implicit first-org selection for an API. It makes requests self-describing, avoids ambiguity for multi-org users, and is easy to add to HTTP clients. The frontend reads the active org from `getMockSession()` and sends it as a header — trivial to replace with a real session when a login flow is added.

**Alternatives considered**:
- Encode active org in JWT: Would require re-issuing tokens on org switch, which is complex without a session management system.
- Org ID as path prefix (e.g., `/api/orgs/{orgId}/checkup/**`): Clean REST design but requires routing changes across all existing controllers — too large a scope for this block.
