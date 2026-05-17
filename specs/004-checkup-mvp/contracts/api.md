# API Contracts: FrankInTest Check-up MVP

**Date**: 2026-05-16
**Base path**: `/api/checkup`

---

## POST /api/checkup/estimate

Calcula a estimativa de créditos para um Check-up sem executar a análise.

### Request Body

```json
{
  "targetType": "URL",
  "targetValue": "https://example.com",
  "userAuthorizationConfirmed": true,
  "context": "Landing page de produto SaaS de gestão de tarefas",
  "goal": "Identificar riscos de conversão e acessibilidade",
  "depth": "STANDARD",
  "outputMode": "REPORT_WITH_SCENARIOS",
  "targetAudience": "PMEs brasileiras",
  "criticalFlows": "Formulário de cadastro, CTA principal",
  "knownRisks": "Formulário não valida e-mail no mobile",
  "technologies": "React, Vercel"
}
```

**Campos obrigatórios**: `targetType`, `targetValue`, `userAuthorizationConfirmed`, `context`, `goal`, `depth`, `outputMode`

### Response 200

```json
{
  "estimatedCredits": 30,
  "breakdown": {
    "base": 20,
    "outputMultiplier": 1.5,
    "total": 30
  },
  "currency": "credits"
}
```

### Response 400 — Input inválido

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Campo obrigatório ausente: context",
  "field": "context"
}
```

### Response 422 — Autorização não confirmada

```json
{
  "error": "AUTHORIZATION_REQUIRED",
  "message": "É necessário confirmar autorização para analisar o alvo informado."
}
```

---

## POST /api/checkup/run

Executa o Check-up. Reserva créditos, chama provider de IA, persiste o relatório como rascunho.

### Request Body

Mesmo schema de `POST /api/checkup/estimate`.

### Response 202 — Execução iniciada

```json
{
  "aiRunId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "reportId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "status": "running",
  "estimatedCredits": 30
}
```

### Response 400 — Input inválido

```json
{
  "error": "VALIDATION_ERROR",
  "message": "context deve ter no mínimo 20 caracteres",
  "field": "context"
}
```

### Response 402 — Saldo insuficiente

```json
{
  "error": "INSUFFICIENT_CREDITS",
  "message": "Saldo de créditos insuficiente para executar este Check-up.",
  "required": 30,
  "available": 15
}
```

### Response 422 — Autorização não confirmada

```json
{
  "error": "AUTHORIZATION_REQUIRED",
  "message": "É necessário confirmar autorização para analisar o alvo informado."
}
```

---

## GET /api/checkup/runs/{aiRunId}

Consulta o status e o resultado de um Check-up em execução ou concluído.

### Response 200 — COMPLETED

```json
{
  "aiRunId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "completed",
  "creditsConsumed": 30,
  "report": {
    "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "status": "DRAFT",
    "targetType": "URL",
    "targetValue": "https://example.com",
    "depth": "STANDARD",
    "qualityRisks": [
      {
        "title": "Formulário sem validação de e-mail no mobile",
        "description": "O campo de e-mail aceita valores inválidos em dispositivos iOS. Risco de leads inválidos na base.",
        "severity": "HIGH"
      }
    ],
    "missingOrUnclearRequirements": [],
    "suggestedTestScenarios": [
      {
        "title": "CTA visível acima da dobra em mobile",
        "description": "Verificar se o botão de ação principal está visível sem scroll em viewport de 375px.",
        "type": "POSITIVE"
      }
    ],
    "suggestedTestCases": [],
    "uxProductRisks": [],
    "releaseReadinessNotes": [],
    "recommendedNextActions": [
      {
        "action": "Adicionar validação de e-mail no formulário de cadastro para mobile",
        "rationale": "Risco identificado de alta severidade com impacto direto na qualidade dos leads.",
        "priority": "HIGH"
      }
    ],
    "createdAt": "2026-05-16T10:30:00Z",
    "updatedAt": "2026-05-16T10:30:45Z"
  }
}
```

### Response 200 — RUNNING

```json
{
  "aiRunId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "running",
  "creditsConsumed": 0,
  "report": null
}
```

### Response 200 — FAILED

```json
{
  "aiRunId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "failed",
  "creditsConsumed": 0,
  "errorMessage": "Não foi possível concluir a análise. Seus créditos foram preservados."
}
```

### Response 404 — Run não encontrado

```json
{
  "error": "NOT_FOUND",
  "message": "AI run não encontrado."
}
```

---

## Notas de Segurança

- Nenhuma API key de provider de IA deve aparecer em nenhuma resposta destes endpoints.
- O campo `rawAiOutput` do `CheckupReport` não é retornado nestes endpoints — é armazenado apenas internamente para auditoria.
- O backend não realiza requisições HTTP à URL informada em `targetValue` — o valor é tratado como texto descritivo.
- Todos os endpoints validam `organizationId` e `userId` via auth middleware antes de processar.
