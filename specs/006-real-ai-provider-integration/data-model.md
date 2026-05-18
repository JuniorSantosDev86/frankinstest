# Data Model: Real AI Provider Integration (Bloco 12)

## Entities Changed or Extended

### AiRunFailureCategory (enum extension)

**File**: `services/api/src/main/java/com/frankintest/api/airuns/AiRunModels.java`

Current values: `none`, `provider`, `credit`

**Add**: `output_validation`

Used when the provider HTTP call succeeds but the structured JSON output fails validation per FR-007. Stored in the `ai_runs.failure_category` column (existing `VARCHAR`).

---

### CheckupOutputValidator (new component)

**File**: `services/api/src/main/java/com/frankintest/api/checkup/CheckupOutputValidator.java`

Spring `@Component`. Stateless. Validates raw `JsonNode` returned by the provider.

**Validation rules**:

| Section | Required top-level key | Item required fields |
|---|---|---|
| qualityRisks | ✅ non-null array | `title` (str), `description` (str), `severity` (LOW\|MEDIUM\|HIGH\|CRITICAL) |
| missingOrUnclearRequirements | ✅ non-null array | `title` (str), `description` (str), `severity` (LOW\|MEDIUM\|HIGH\|CRITICAL) |
| suggestedTestScenarios | ✅ non-null array | `title` (str), `description` (str), `type` (POSITIVE\|NEGATIVE\|EDGE_CASE) |
| suggestedTestCases | ✅ non-null array | `title` (str), `preconditions` (str), `steps` (non-empty array), `expectedResult` (str) |
| uxProductRisks | ✅ non-null array | `title` (str), `description` (str), `severity` (LOW\|MEDIUM\|HIGH\|CRITICAL) |
| releaseReadinessNotes | ✅ non-null array | `title` (str), `description` (str), `severity` (LOW\|MEDIUM\|HIGH\|CRITICAL) |
| recommendedNextActions | ✅ non-null array | `action` (str), `rationale` (str), `priority` (LOW\|MEDIUM\|HIGH) |

**Validation result**: `ValidationResult` record with `boolean valid` and `String reason` (safe, no provider content echoed).

**Behavior on empty arrays**: A section may be an empty array `[]` — that is valid. Sections missing from the JSON entirely are invalid.

---

### AnthropicAiProvider (changes)

**File**: `services/api/src/main/java/com/frankintest/api/ai/provider/AnthropicAiProvider.java`

| Field | Before | After |
|---|---|---|
| `model` default | `claude-sonnet-4-6` | `claude-haiku-4-5-20251001` |
| `maxTokens` default | `1024` | `4096` |
| `timeout` | hardcoded 60s | `${ai.anthropic.timeout-seconds:30}` |
| Missing key behavior | returns `failure(...)` in `generate()` | same (fail at call time, not startup) |
| Timeout exception | caught generically | `HttpTimeoutException` caught explicitly → `PROVIDER_FAILURE` |

---

### CheckupService (audit events added)

**File**: `services/api/src/main/java/com/frankintest/api/checkup/CheckupService.java`

New audit event strings emitted at provider call boundaries:
- `CHECK_UP_PROVIDER_CALL_STARTED` — before `provider.generate()`
- `CHECK_UP_PROVIDER_CALL_COMPLETED` — after successful provider HTTP response
- `CHECK_UP_PROVIDER_CALL_FAILED` — on `PROVIDER_FAILURE` (timeout, HTTP error, missing key)
- `CHECK_UP_OUTPUT_VALIDATION_FAILED` — on `OUTPUT_VALIDATION_FAILURE`

New failure branch: after `response.success()` is true but `CheckupOutputValidator.validate()` fails → release credits, mark `AiRunStatus.failed` + `AiRunFailureCategory.output_validation`, emit `CHECK_UP_OUTPUT_VALIDATION_FAILED`, throw `CheckupExecutionException` with pt-BR message.

---

### application.yml (configuration changes)

| Key | Before | After |
|---|---|---|
| `ai.anthropic.model` default | `claude-sonnet-4-6` | `claude-haiku-4-5-20251001` |
| `ai.anthropic.max-tokens` default | `1024` | `4096` |
| `ai.anthropic.timeout-seconds` | absent | `${AI_PROVIDER_TIMEOUT_SECONDS:30}` |

---

## Database Schema Changes

**None.** The `output_validation` failure category is stored as a string in the existing `ai_runs.failure_category` VARCHAR column. No migration required.

---

## State Transitions

```
CheckupService.run() flow with real provider:

  [credits reserved] → CHECK_UP_PROVIDER_CALL_STARTED
       ↓
  provider.generate()
       ↓
  response.success() == false?
    → release credits
    → AiRunStatus.failed, category=provider
    → CHECK_UP_PROVIDER_CALL_FAILED + CHECK_UP_FAILED
    → throw CheckupExecutionException (pt-BR)

  response.success() == true
    → CHECK_UP_PROVIDER_CALL_COMPLETED
    → validator.validate(rawJson)
         ↓
    valid == false?
      → release credits
      → AiRunStatus.failed, category=output_validation
      → CHECK_UP_OUTPUT_VALIDATION_FAILED + CHECK_UP_FAILED
      → throw CheckupExecutionException (pt-BR)

    valid == true
      → parse → persist report → capture credits
      → AiRunStatus.completed
      → CHECK_UP_COMPLETED
```
