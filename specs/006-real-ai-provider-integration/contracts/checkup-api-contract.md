# API Contract: Check-up (Bloco 12 — unchanged from Bloco 10)

The Check-up REST API contract is **extended** by this block to add the `aiAssisted` field (FR-013). All other fields are unchanged. The frontend may read `aiAssisted` to display an AI-generated indicator but no existing fields are removed or renamed.

---

## POST /api/checkup/run

**Auth**: JWT (`Authorization: Bearer <token>`) + `X-Organization-Id` header required.

**Request body**: unchanged.

**Success response** (200):
```json
{
  "aiRunId": "string",
  "reportId": "string",
  "status": "running",
  "estimatedCredits": 20
}
```

**Provider failure / output-validation failure response** (500):
```json
{
  "error": "Não foi possível concluir a análise. Seus créditos foram preservados.",
  "code": "CHECKUP_EXECUTION_FAILED"
}
```

No provider error details, no API key, no Anthropic response body appear in the error response.

**Missing API key configuration error** (500):
```json
{
  "error": "Não foi possível concluir a análise. Seus créditos foram preservados.",
  "code": "CHECKUP_EXECUTION_FAILED"
}
```

Note: The missing-key error uses the same safe user-facing message. The distinction is logged server-side at WARN level (without printing the key).

---

## GET /api/checkup/run/{aiRunId}/status

**Success (completed)**:
```json
{
  "aiRunId": "string",
  "status": "completed",
  "creditsConsumed": 20,
  "report": {
    "id": "string",
    "status": "DRAFT",
    "aiAssisted": true,
    "targetType": "string",
    "targetValue": "string",
    "depth": "string",
    "qualityRisks": [],
    "missingOrUnclearRequirements": [],
    "suggestedTestScenarios": [],
    "suggestedTestCases": [],
    "uxProductRisks": [],
    "releaseReadinessNotes": [],
    "recommendedNextActions": [],
    "createdAt": "string",
    "updatedAt": "string"
  },
  "errorMessage": null
}
```

**`aiAssisted` field**: Always `true` for Check-up reports. This field is required by FR-013 and must not be omitted. It is not derivable from `status: DRAFT` alone.

**Failed run**:
```json
{
  "aiRunId": "string",
  "status": "failed",
  "creditsConsumed": 0,
  "report": null,
  "errorMessage": "Não foi possível concluir a análise. Seus créditos foram preservados."
}
```

---

## Anthropic Provider Request (internal — not a public API)

Built server-side by `CheckupPromptBuilder` + `AnthropicAiProvider.buildRequestBody()`.

```json
{
  "model": "claude-haiku-4-5-20251001",
  "max_tokens": 4096,
  "messages": [
    { "role": "user", "content": "<prompt built by CheckupPromptBuilder>" }
  ]
}
```

Headers sent: `Content-Type: application/json`, `x-api-key: <ANTHROPIC_API_KEY>`, `anthropic-version: 2023-06-01`.

---

## Expected Provider JSON Output (validated by CheckupOutputValidator)

```json
{
  "qualityRisks": [
    { "title": "string", "description": "string", "severity": "LOW|MEDIUM|HIGH|CRITICAL" }
  ],
  "missingOrUnclearRequirements": [
    { "title": "string", "description": "string", "severity": "LOW|MEDIUM|HIGH|CRITICAL" }
  ],
  "suggestedTestScenarios": [
    { "title": "string", "description": "string", "type": "POSITIVE|NEGATIVE|EDGE_CASE" }
  ],
  "suggestedTestCases": [
    {
      "title": "string",
      "preconditions": "string",
      "steps": ["step 1", "step 2"],
      "expectedResult": "string"
    }
  ],
  "uxProductRisks": [
    { "title": "string", "description": "string", "severity": "LOW|MEDIUM|HIGH|CRITICAL" }
  ],
  "releaseReadinessNotes": [
    { "title": "string", "description": "string", "severity": "LOW|MEDIUM|HIGH|CRITICAL" }
  ],
  "recommendedNextActions": [
    { "action": "string", "rationale": "string", "priority": "LOW|MEDIUM|HIGH" }
  ]
}
```

All section keys must be present. Sections may be empty arrays. Item fields must be non-null and non-blank strings. `steps` must be a non-empty array.
