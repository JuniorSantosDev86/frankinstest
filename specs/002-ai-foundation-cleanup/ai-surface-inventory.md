# AI Surface Inventory: Bloco 09C

**Date**: 2026-05-15

## Active Frontend Usage

`apps/web/src/lib/ai-assistance/aiAssistanceClient.ts` consumes only FrankInTest backend product APIs:

- `POST /api/ai/test-design/estimate`
- `POST /api/ai/test-design/scenarios`
- `POST /api/ai/test-design/test-cases`
- `GET /api/ai/runs/{aiRunId}`

The frontend uses `NEXT_PUBLIC_API_URL` only as the backend base URL and does not include AI provider endpoints or keys.

## Backend AI Production Surface Before 09C Cleanup

Canonical AI Test Design path:

- `services/api/src/main/java/com/frankintest/api/ai/AiTestDesignController.java`
- `services/api/src/main/java/com/frankintest/api/ai/AiRunStatusController.java`
- `services/api/src/main/java/com/frankintest/api/ai/orchestration/AiTestDesignOrchestrationService.java`
- `services/api/src/main/java/com/frankintest/api/ai/orchestration/AiTestDesignDtos.java`
- `services/api/src/main/java/com/frankintest/api/ai/orchestration/AiGeneratedArtifactParser.java`
- `services/api/src/main/java/com/frankintest/api/ai/provider/AiProviderPort.java`
- `services/api/src/main/java/com/frankintest/api/ai/provider/AiProviderSelector.java`
- `services/api/src/main/java/com/frankintest/api/ai/provider/MockAiProvider.java`
- `services/api/src/main/java/com/frankintest/api/ai/provider/AnthropicAiProvider.java`

Legacy duplicate AI path found before cleanup:

- `services/api/src/main/java/com/frankintest/api/ai/AiRunController.java`
- `services/api/src/main/java/com/frankintest/api/ai/AiOrchestrationService.java`
- `services/api/src/main/java/com/frankintest/api/ai/AiProviderFactory.java`
- `services/api/src/main/java/com/frankintest/api/ai/AiProvider.java`
- `services/api/src/main/java/com/frankintest/api/ai/AiResponse.java`
- `services/api/src/main/java/com/frankintest/api/ai/MockAiProvider.java`
- `services/api/src/main/java/com/frankintest/api/ai/AnthropicAiProvider.java`
- `services/api/src/main/java/com/frankintest/api/ai/AiEstimateRequest.java`
- `services/api/src/main/java/com/frankintest/api/ai/AiEstimateResponse.java`
- `services/api/src/main/java/com/frankintest/api/ai/AiGenerateScenariosRequest.java`
- `services/api/src/main/java/com/frankintest/api/ai/AiGenerateTestCasesRequest.java`
- `services/api/src/main/java/com/frankintest/api/ai/AiRunResponse.java`

The legacy path exposed `/api/ai/estimate`, `/api/ai/scenarios/generate`, and `/api/ai/test-cases/generate` with separate provider selection and prompt handling. `apps/web` does not consume those endpoints.

## Backend AI Tests Before 09C Cleanup

Canonical coverage:

- `services/api/src/test/java/com/frankintest/api/ai/AiTestDesignControllerTest.java`
- `services/api/src/test/java/com/frankintest/api/ai/AiRunFailureIntegrationTest.java`
- `services/api/src/test/java/com/frankintest/api/ai/orchestration/AiTestDesignOrchestrationServiceTest.java`
- `services/api/src/test/java/com/frankintest/api/ai/orchestration/AiGeneratedArtifactParserTest.java`

Legacy-dependent tests:

- `services/api/src/test/java/com/frankintest/api/ai/AiRunControllerTest.java`
- `services/api/src/test/java/com/frankintest/api/ai/AiOrchestrationServiceTest.java`
- `services/api/src/test/java/com/frankintest/api/ai/MockAiProviderTest.java`

Legacy-dependent tests must be removed or migrated because they assert behavior from the duplicate root orchestration path.

## Canonical Architecture Decision

The canonical AI path for Bloco 09C is:

`AiTestDesignController` -> `AiTestDesignOrchestrationService` -> `AiProviderSelector`/`AiProviderPort` -> `AiGeneratedArtifactParser` -> AI run, credit, audit, and test design persistence services.

`AiRunStatusController` remains the safe metadata endpoint for `GET /api/ai/runs/{aiRunId}`.

## Forbidden Legacy Responsibilities

Any retained legacy endpoint may exist only as a deprecated compatibility wrapper. It must not own:

- AI provider selection
- credit reservation, capture, release, or adjustment
- AI run lifecycle
- audit event creation
- independent prompt construction for active generation
- output parsing or artifact persistence
- organization/project access checks that diverge from canonical behavior

Because no current frontend consumer calls the legacy root endpoints, the preferred implementation decision is removal rather than wrapper retention.

## Docs And Historical References

`docs/API_DESIGN.md` already lists canonical AI Test Design endpoints, but it also lists future AI endpoints that need clearer planned/future labeling.

`specs/001-ai-test-design/tasks.md` contains historical task status and stale failing-test notes from the previous Spec Kit block. It should be explicitly classified as historical SDD output or updated only if treated as living status.

## Unrelated Dirty Worktree

Do not revert unrelated local changes:

- `apps/web/next-env.d.ts`

## Final 09C Decisions

Implemented decisions:

- Removed the legacy root controller, orchestration service, provider factory, root provider interface/DTOs, root provider implementations, and legacy request/response DTOs because no active frontend consumer used them.
- Removed obsolete legacy tests that asserted the duplicate root AI path.
- Preserved `AiTestDesignController` as the canonical controller for estimate, scenario generation, and test-case generation.
- Preserved `AiRunStatusController` for safe AI run metadata.
- Preserved `AiTestDesignOrchestrationService` as the owner of access validation handoff, credit reserve/capture/release, AI run lifecycle, audit events, provider calls through the provider port, output parsing, and draft artifact persistence.
- Preserved `AiProviderSelector` and `AiProviderPort` as the only active provider-selection boundary.
- Migrated mock provider coverage to `services/api/src/test/java/com/frankintest/api/ai/provider/MockAiProviderTest.java`.
- Added canonical request validation coverage for unsupported generation types and malformed JSON.
- Added deterministic mock-provider failure and invalid-output paths so automated tests cover credit release without any real provider call.
- Documented `specs/001-ai-test-design/tasks.md` as historical SDD output rather than current status.

Validation decisions:

- Backend validation passed with `./mvnw test`.
- Frontend validation passed with `npm run lint`, `npm test`, and `npm run build`.
- Frontend build required sandbox escalation because Turbopack attempted to bind a local port while processing CSS.
