# Contract: GET /api/drift/reports/{reportId}

**Module**: drift | **Bloco**: 17

Retorna o resumo de drift de todos os artefatos derivados de um relatório de Check-up, com contagens por status e seções com itens elegíveis sem artefato criado.

---

## Request

```
GET /api/drift/reports/{reportId}
Authorization: Bearer {jwt}
X-Organization-Id: {organizationId}
```

### Path Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `reportId` | string | sim | ID do `CheckupReport` (`checkup_reports.id`). **Não é o `aiRunId`** — ver nota B2 abaixo. |

### Headers

| Header | Obrigatório | Descrição |
|---|---|---|
| `Authorization` | sim | JWT Bearer token |
| `X-Organization-Id` | sim | ID da organização do usuário autenticado |

---

## Responses

### 200 OK — Resumo calculado com sucesso

```json
{
  "reportId": "run_abc123",
  "totalAnalyzed": 5,
  "countByStatus": {
    "SEM_DRIFT": 2,
    "POSSIVEL_DRIFT": 2,
    "RASTREABILIDADE_INCOMPLETA": 1,
    "RELATORIO_INDISPONIVEL": 0
  },
  "missingSections": [
    {
      "sectionName": "quality_risks",
      "eligibleItemCount": 3,
      "existingArtifactCount": 1
    }
  ]
}
```

### 200 OK — Nenhum artefato derivado do relatório

```json
{
  "reportId": "run_xyz789",
  "totalAnalyzed": 0,
  "countByStatus": {
    "SEM_DRIFT": 0,
    "POSSIVEL_DRIFT": 0,
    "RASTREABILIDADE_INCOMPLETA": 0,
    "RELATORIO_INDISPONIVEL": 0
  },
  "missingSections": [
    {
      "sectionName": "missing_or_unclear_requirements",
      "eligibleItemCount": 4,
      "existingArtifactCount": 0
    },
    {
      "sectionName": "suggested_test_scenarios",
      "eligibleItemCount": 2,
      "existingArtifactCount": 0
    }
  ]
}
```

**Nota de UX**: Quando `totalAnalyzed == 0`, o frontend exibe estado vazio em pt-BR: "Nenhum artefato foi criado a partir deste relatório."

### 401 Unauthorized

```json
{ "error": "Unauthorized" }
```

### 403 Forbidden

Header `X-Organization-Id` ausente ou inválido.

```json
{ "error": "Forbidden" }
```

### 404 Not Found

Relatório não encontrado no escopo da organização autenticada — inclui o caso em que o relatório existe mas pertence a outra organização (não revela existência cross-org).

```json
{ "error": "Not found" }
```

### 500 Internal Server Error

Falha técnica inesperada no cálculo do resumo de drift.

```json
{ "error": "Internal server error" }
```

---

## Nota B2 — reportId vs aiRunId

`reportId` neste endpoint corresponde a `checkup_reports.id` (o ID do relatório de Check-up persistido), **não** ao `aiRunId` da rota frontend `checkup/[runId]`.

A página `apps/web/src/app/checkup/[runId]/page.tsx` carrega o relatório via `GET /api/checkup/runs/{aiRunId}`. A resposta desse endpoint inclui o `reportId` do `CheckupReport`. O frontend DEVE extrair esse `reportId` da resposta do relatório e usá-lo para chamar `GET /api/drift/reports/{reportId}`.

Se o `reportId` não estiver disponível na resposta do relatório, o frontend DEVE exibir o estado discreto "Resumo de drift indisponível" sem tentar chamar o endpoint de drift com `aiRunId` diretamente.

---

## Regras de Negócio

1. Protegido por JWT e `X-Organization-Id`. 403 para header ausente/inválido. 404 para relatório inexistente ou de outra organização (não revela existência cross-org).
2. Somente artefatos com `source_checkup_report_id = reportId` e `organization_id = X-Organization-Id` são incluídos no cálculo.
3. `missingSections` lista seções com pelo menos um item elegível sem artefato criado. Seções sem itens elegíveis não são listadas.
4. Seções elegíveis verificadas: `missing_or_unclear_requirements`, `quality_risks`, `ux_product_risks`, `release_readiness_notes`, `suggested_test_scenarios`, `suggested_test_cases`. A fonte canônica dessas seções é `ConversionService` (Bloco 13).
5. `existingArtifactCount` conta artefatos em workspace_artifacts + test_scenarios + test_cases (todas as tabelas de destino da conversão).
6. Sem paginação — volume é limitado pelo tamanho do relatório de Check-up.
7. Cálculo é read-only. Nenhum crédito de AI consumido.
