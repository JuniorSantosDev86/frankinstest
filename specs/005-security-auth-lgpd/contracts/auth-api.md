# API Contract: Auth and Security — Bloco 11

**Date**: 2026-05-17 | **Feature**: 005-security-auth-lgpd

## Authentication Contract

All protected endpoints require:

```
Authorization: Bearer <jwt-hs256-token>
X-Organization-Id: <organizationId>
```

Missing `Authorization` → `401 Unauthorized`
Invalid or expired JWT → `401 Unauthorized`
Missing `X-Organization-Id` → `400 Bad Request`
`X-Organization-Id` not linked to authenticated user → `403 Forbidden`

---

## Protected Routes

| Route pattern | Method(s) | Auth required | Notes |
|---|---|---|---|
| `/api/checkup/estimate` | POST | Yes | userAuthorized flag required in body |
| `/api/checkup/run` | POST | Yes | Rate limited per userId |
| `/api/checkup/runs/{aiRunId}` | GET | Yes | Must belong to caller's org |
| `/api/ai/test-design/**` | ALL | Yes | Rate limited per userId |
| `/api/ai/runs/{aiRunId}` | GET | Yes | Must belong to caller's org; org validated via X-Organization-Id |
| `/api/health` | GET | No | Public |

---

## 401 Response

Returned for: missing token, invalid token, expired token. All cases use the same safe public body — expiry details MUST NOT be leaked.

```json
{
  "error": "UNAUTHORIZED",
  "message": "Autenticação necessária."
}
```

## 403 Response

```json
{
  "error": "FORBIDDEN",
  "message": "Acesso negado a este recurso."
}
```

## 429 Response (Rate Limit)

```
HTTP 429 Too Many Requests
Retry-After: 60

{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Limite de requisições atingido. Tente novamente em breve."
}
```

## 400 — Missing X-Organization-Id

```json
{
  "error": "VALIDATION_ERROR",
  "message": "X-Organization-Id é obrigatório.",
  "field": "X-Organization-Id"
}
```

---

## Checkup Request (unchanged fields, new enforcement)

`POST /api/checkup/estimate` and `POST /api/checkup/run`

```json
{
  "goal": "string (required)",
  "context": "string (required)",
  "targetType": "WEB_APP | LANDING_PAGE | ...",
  "depth": "QUICK | STANDARD | DEEP",
  "outputMode": "CHECKLIST | REPORT",
  "userAuthorized": true
}
```

`userAuthorized: false` or absent → `422 Unprocessable Entity` (existing behavior, preserved)

`organizationId` and `userId` are **NOT** accepted in the request body. They are resolved server-side from the JWT and `X-Organization-Id` header.

---

## Dev / Demo Auth

In development mode (`SPRING_PROFILES_ACTIVE=dev`), the backend generates and logs a pre-signed JWT at startup:

```
[INFO] Demo JWT (dev only): eyJhbGciOiJIUzI1NiJ9...
```

Set in `apps/web/.env.local`:
```
NEXT_PUBLIC_DEV_TOKEN=eyJhbGciOiJIUzI1NiJ9...
NEXT_PUBLIC_API_URL=http://localhost:8080
```

The frontend sends this as `Authorization: Bearer <token>` on every protected request. This token is accepted only when the backend is running in `dev` profile with `demo-auth.enabled=true`.

---

## Audit Events (new in this block)

Security audit events are recorded in `audit_log` with real identity. No read API is exposed in this block; events are verified via direct DB query in integration tests.

| event_type | Trigger |
|---|---|
| `SECURITY_401` | JWT missing or invalid |
| `SECURITY_403` | Org access denied |
| `RATE_LIMIT_EXCEEDED` | Per-user rate limit hit |
| `CHECKUP_AUTHORIZED` | Successful checkup with userAuthorized=true (carries real userId) |
