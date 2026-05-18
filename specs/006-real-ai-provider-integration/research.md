# Research: Real AI Provider Integration (Bloco 12)

## Provider Abstraction — Current State

**Decision**: The `AiProviderPort` interface, `MockAiProvider`, `AnthropicAiProvider` stub, and `AiProviderSelector` already exist from prior blocos. No new abstraction layer is needed.

**Rationale**: The MVP abstraction is complete. This block hardens the real provider implementation, not the architecture.

**Alternatives considered**: Introducing the Anthropic Java SDK (published April 2025). Rejected for MVP because the existing `java.net.http.HttpClient` usage already handles the HTTP layer and avoids an additional transitive dependency. The SDK adds value for streaming and beta features; neither is in scope here.

---

## Timeout Implementation

**Decision**: Use `HttpRequest.timeout(Duration)` on the existing `java.net.http.HttpClient` request. The current stub hardcodes 60s; this block changes it to read from `${ai.anthropic.timeout-seconds:30}` via `@Value`.

**Rationale**: `HttpRequest.timeout` throws `HttpTimeoutException` (a subclass of `IOException`) when the deadline is exceeded. Catching it explicitly allows the service to distinguish a timeout from a generic HTTP error and emit the correct `PROVIDER_FAILURE` audit event. The `HttpClient.connectTimeout` already set at 30s covers TCP connect phase separately.

**Alternatives considered**: Spring's `@Async` + `Future.get(timeout)` wrapper. Rejected — unnecessary complexity when the JDK HTTP client supports per-request timeouts natively.

---

## Output Validation Strategy

**Decision**: Introduce a `CheckupOutputValidator` component that takes the raw `JsonNode` from the provider and validates:
1. All 7 top-level section keys are present and are non-null arrays.
2. Each item in each array has the required fields with non-null, non-blank string values.
3. Enum values (`severity`, `type`, `priority`) match the declared enums.
4. `suggestedTestCases[].steps` is a non-empty array.

**Rationale**: Separating validation from parsing (currently done silently in `CheckupReportParser`) makes the rule set independently testable and auditable. `CheckupReportParser` currently swallows parse errors and returns empty lists — this is incompatible with FR-007 and FR-008 which require rejection and credit release on invalid output.

**Alternatives considered**: Jackson `@JsonProperty(required=true)` annotation-based validation. Rejected — Jackson by default doesn't enforce required fields on deserialization, and enabling strict mode would require schema changes that affect the existing mock output path.

---

## Fail-Fast on Missing API Key

**Decision**: Validate `apiKey` at construction time in `AnthropicAiProvider` using `@PostConstruct`. If `ai.mock-enabled=false` (real provider selected) and `ANTHROPIC_API_KEY` is blank, throw a `BeanCreationException` on startup — or alternatively, fail at first call with a clear `ConfigurationException` (not a provider HTTP failure).

**Decision refined**: Fail at first call (not startup), returning `AiProviderResponse.failure` with a category that `CheckupService` maps to a `503`-equivalent configuration error. This avoids blocking startup when the real provider is configured but the key is intentionally absent in test environments using `ai.mock-enabled=true`.

**Rationale**: The `AiProviderSelector` routes to `MockAiProvider` when `ai.mock-enabled=true`, so `AnthropicAiProvider` is never invoked in tests. The fail-fast check at call time is sufficient for FR-003 without risking CI startup failures.

**Alternatives considered**: Spring `@ConditionalOnProperty` to not instantiate `AnthropicAiProvider` when mock is enabled. Rejected — over-engineering for MVP; the selector pattern already handles routing.

---

## Audit Event Taxonomy

**Decision**: Extend `CheckupService` with these audit event types (string constants — no enum change needed):

| Event | Trigger |
|---|---|
| `CHECK_UP_PROVIDER_CALL_STARTED` | Before `generate()` call |
| `CHECK_UP_PROVIDER_CALL_COMPLETED` | After successful provider HTTP response |
| `CHECK_UP_PROVIDER_CALL_FAILED` | After `PROVIDER_FAILURE` (timeout or HTTP error) |
| `CHECK_UP_OUTPUT_VALIDATION_FAILED` | After `OUTPUT_VALIDATION_FAILURE` |

The existing `CHECK_UP_FAILED` audit event is kept for backward compat and also emitted on both failure paths.

**Rationale**: FR-011 requires distinct audit events for provider call lifecycle. The existing single `CHECK_UP_FAILED` event doesn't distinguish failure categories for audit trail purposes.

---

## AiRun Failure Category — OUTPUT_VALIDATION_FAILURE

**Decision**: Add `output_validation` to the `AiRunModels.AiRunFailureCategory` enum (alongside existing `none`, `provider`, `credit`).

**Rationale**: FR-008 requires the AI run to be marked `FAILED` with category `OUTPUT_VALIDATION_FAILURE` on structured output rejection. The existing `provider` category maps to `PROVIDER_FAILURE` (timeout/HTTP). A distinct enum value enables clean querying and future analytics.

---

## Model Default Correction

**Decision**: Change `application.yml` default from `claude-sonnet-4-6` to `claude-haiku-4-5-20251001`. Change the `@Value` default in `AnthropicAiProvider` to match.

**Rationale**: The spec clarification session (2026-05-17) committed to Haiku as the default for cost-efficient MVP structured JSON generation. Sonnet remains accessible via `ANTHROPIC_MODEL=claude-sonnet-4-6` env var with no code changes.

---

## Max Tokens

**Decision**: Increase default `ANTHROPIC_MAX_TOKENS` from `1024` to `4096` in `application.yml`.

**Rationale**: Seven structured sections with multiple items each can easily exceed 1024 tokens. A truncated response would fail output validation. 4096 is within Haiku's output limits and avoids silent truncation in real provider mode.

---

## No New Maven Dependencies Required

**Decision**: The existing `java.net.http.HttpClient` (JDK 11+) and `jackson-databind` are sufficient for this block.

**Rationale**: Adding the Anthropic Java SDK would bring transitive dependencies and require a version decision. The JDK HTTP client already implements the required functionality. The SDK remains a future option if streaming or retry policies are needed.
