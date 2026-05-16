# Quickstart: AI Foundation Cleanup & Spec Alignment

## Goal

Validate that 09C leaves FrankInTest with one canonical AI foundation while preserving Bloco 09A/09B behavior.

## 1. Inspect active AI paths

```bash
rg -n "AiOrchestrationService|AiProviderFactory|AiRunController|AiTestDesignOrchestrationService|AiProviderSelector|/api/ai" services/api/src/main services/api/src/test apps/web/src apps/web/tests
```

Expected result:

- Canonical flow is centered on `AiTestDesignOrchestrationService`, `AiProviderSelector`, `AiProviderPort`, `AiTestDesignController`, and `AiRunStatusController`.
- Legacy root AI orchestration is removed or retained only as a compatibility wrapper with no duplicated business logic.
- Historical docs, inventories, and explicit deprecation notes are not counted as active AI generation flows.

## 2. Validate backend

```bash
cd services/api
./mvnw test
```

Expected result:

- Backend tests pass.
- AI tests use mock provider behavior.
- Credit reserve/capture/release behavior remains covered.
- AI run lifecycle and safe run metadata remain covered.
- Provider/output failures do not consume credits unfairly.
- Malformed or invalid requests are rejected before provider work.
- Organization/project access remains backend-enforced.
- Authentication behavior is either validated when supported or documented as mocked/local for the MVP.
- Entitlement enforcement is documented as not applicable to 09C while current organization/project and credit gates remain preserved.

## 3. Validate frontend

```bash
cd apps/web
npm run lint
npm test
npm run build
```

Expected result:

- Frontend lint, tests, and build pass.
- `aiAssistanceClient` calls only backend product APIs.
- No provider secret or direct provider call appears in client source, frontend tests, public assets, or client-facing configuration.

## 4. Verify provider safety

```bash
rg -n "ANTHROPIC|OPENAI|api-key|x-api-key|provider|generateContent|fetch\\(" apps/web/src apps/web/tests apps/web/public services/api/src/test
```

Expected result:

- Any provider key reference is server-side only.
- Frontend contains no direct provider endpoint call.
- Tests do not require real provider configuration.

If present, also review:

- `apps/web/.env*`
- `apps/web/next.config.ts`
- generated client-facing artifacts under `apps/web/public/`

## 5. Verify docs/status

Review:

- `docs/API_DESIGN.md`
- `docs/ARCHITECTURE.md`
- `docs/CURRENT_STATUS.md`
- `docs/ROADMAP.md`
- `specs/001-ai-test-design/tasks.md`
- 09C run report

Expected result:

- Docs describe the canonical AI foundation.
- Removed/adapted legacy paths are explained.
- `specs/001-ai-test-design/tasks.md` is either updated if treated as living documentation or clearly classified as historical SDD output.
- Known limitations and Check-up MVP readiness are current.

## Manual QA Checklist

- Estimate appears before generation in the Workspace AI UI.
- Generated scenarios and cases remain draft and AI-assisted.
- Error states remain in pt-BR.
- No new UI workflow, billing purchase, streaming, or Check-up behavior appears in 09C.
