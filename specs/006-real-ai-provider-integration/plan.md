# Implementation Plan: Real AI Provider Integration (Bloco 12)

**Branch**: `006-real-ai-provider-integration` | **Date**: 2026-05-17 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/006-real-ai-provider-integration/spec.md`

## Summary

Complete the real Anthropic provider integration for Check-up MVP. The abstraction (`AiProviderPort`, `AiProviderSelector`, `AnthropicAiProvider` stub, `MockAiProvider`) already exists from prior blocos. This block hardens the `AnthropicAiProvider` to enforce: configurable timeout (default 30s via env), correct default model (`claude-haiku-4-5-20251001`), fail-fast on missing API key, structured output validation (seven sections + item-level field checks per FR-007), safe failure paths with credit release and audit events, and a local quickstart guide. Automated tests remain mock-only.

## Technical Context

**Language/Version**: Java 21+ Spring Boot (`services/api`). No frontend changes required (API contract unchanged per FR-019).

**Primary Dependencies**: Spring Boot, Jackson (`ObjectMapper` already present), `java.net.http.HttpClient` (already used in `AnthropicAiProvider`). No new Maven dependencies needed — standard JDK HTTP client suffices.

**Storage**: PostgreSQL via existing `CheckupRepository`, `AiRunRepository`, `AuditService`.

**Testing**: Backend unit tests (`CheckupReportParser`, output validator) + integration tests (timeout behavior, output-validation failure path, missing-key fast fail) using `MockAiProvider` exclusively. No real Anthropic calls in tests.

**Target Platform**: Linux server (Docker Compose local / CI).

**Project Type**: `services/api` only (vertical slice inside modular monolith).

**Performance Goals**: Provider call must complete or timeout within configured threshold (default 30s). No concurrency constraints (runs are independent per assumption).

**Constraints**: `ANTHROPIC_API_KEY` never logged or returned. All error messages to caller in `pt-BR`. Tests must pass with no API key set. Provider selector: `AI_MOCK_ENABLED=true` → mock (default); `AI_MOCK_ENABLED=false` → real Anthropic path. No `AI_PROVIDER` variable introduced in this block.

**Scale/Scope**: MVP scope — one provider at a time (mock or anthropic), no fallback, no streaming.

## Constitution Check

- **Architecture boundary**: ✅ All AI calls stay in `services/api`. `apps/web` unchanged.
- **Modular monolith**: ✅ No microservices introduced; all work within existing Spring Boot app.
- **Responsibility boundary**: ✅ Credit release, audit events, AI run status — all enforced server-side in `CheckupService`.
- **AI governance**: ✅ Structured QA artifacts; `AiRun` tracked; credits estimated before call; credits released on all failures; mock-only in tests.
- **Security/LGPD**: ✅ API key never logged/returned; JWT + org validation remain in force; audit events cover full provider call lifecycle.
- **Product language**: ✅ All new error messages in `pt-BR`; no new UI copy.
- **Testing discipline**: ✅ Unit tests for validator logic; integration tests for failure paths; mock-only boundary enforced.
- **Execution discipline**: ✅ No unrelated refactors; scope is narrow and traceable.

## Project Structure

### Documentation (this feature)

```text
specs/006-real-ai-provider-integration/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output (FR-020)
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
services/api/
├── src/main/java/com/frankintest/api/
│   ├── ai/provider/
│   │   ├── AiProviderPort.java              # unchanged
│   │   ├── AiProviderSelector.java          # unchanged
│   │   ├── MockAiProvider.java              # MODIFIED if needed: ensure deterministic output passes CheckupOutputValidator
│   │   └── AnthropicAiProvider.java         # MODIFIED: timeout, model default, fail-fast, structured validator
│   ├── checkup/
│   │   ├── CheckupModels.java               # unchanged (API contract preserved)
│   │   ├── CheckupPromptBuilder.java        # unchanged
│   │   ├── CheckupReportParser.java         # MODIFIED: validate before returning; throw on invalid output
│   │   ├── CheckupService.java              # MODIFIED: new audit events, output-validation failure path
│   │   └── CheckupOutputValidator.java      # NEW: validates 7 sections + item-level fields per FR-007
│   └── airuns/
│       └── AiRunModels.java                 # MODIFIED: add OUTPUT_VALIDATION_FAILURE failure category
├── src/main/resources/
│   └── application.yml                      # MODIFIED: model default → haiku, timeout config
└── src/test/java/com/frankintest/api/
    ├── checkup/
    │   ├── CheckupOutputValidatorTest.java   # NEW: unit tests for all validation rules
    │   └── CheckupOutputValidationFailureTest.java  # NEW: integration — invalid output → credit release + audit
    └── ai/provider/
        └── AnthropicAiProviderConfigTest.java  # NEW: fail-fast on missing key, timeout config
```

**Structure Decision**: All changes stay within `services/api`. The key addition is `CheckupOutputValidator` (extracted from `CheckupReportParser` so it's independently testable). `CheckupService` gains a new failure branch for output-validation failures, emitting distinct audit events and releasing credits with `OUTPUT_VALIDATION_FAILURE` category.

## Complexity Tracking

No constitution violations.
