# Contract: GET /api/drift/artifacts/{artifactId}

**Module**: drift | **Bloco**: 17

Retorna o status de drift calculado para um artefato individual derivado de Check-up.

---

## Request

```
GET /api/drift/artifacts/{artifactId}
Authorization: Bearer {jwt}
X-Organization-Id: {organizationId}
```

### Path Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `artifactId` | string (UUID) | sim | ID do artefato de Workspace |

### Headers

| Header | Obrigatório | Descrição |
|---|---|---|
| `Authorization` | sim | JWT Bearer token |
| `X-Organization-Id` | sim | ID da organização do usuário autenticado |

---

## Responses

### 200 OK — Drift calculado com sucesso

```json
{
  "artifactId": "550e8400-e29b-41d4-a716-446655440000",
  "driftStatus": "POSSIVEL_DRIFT",
  "signals": [
    {
      "code": "EDITED_AFTER_CREATION",
      "reasonPtBr": "Título ou descrição editados após criação"
    },
    {
      "code": "STATUS_CHANGED",
      "reasonPtBr": "Status alterado desde a criação"
    }
  ]
}
```

**Valores possíveis de `driftStatus`**: `SEM_DRIFT`, `POSSIVEL_DRIFT`, `RASTREABILIDADE_INCOMPLETA`, `RELATORIO_INDISPONIVEL`

**Valores possíveis de `code`**: `EDITED_AFTER_CREATION`, `STATUS_CHANGED`, `INCOMPLETE_TRACEABILITY`, `SOURCE_UNAVAILABLE`

**Nota**: Quando `driftStatus = SEM_DRIFT`, `signals` é uma lista vazia `[]`.

### 200 OK — Artefato sem rastreabilidade (RASTREABILIDADE_INCOMPLETA)

```json
{
  "artifactId": "550e8400-e29b-41d4-a716-446655440001",
  "driftStatus": "RASTREABILIDADE_INCOMPLETA",
  "signals": [
    {
      "code": "INCOMPLETE_TRACEABILITY",
      "reasonPtBr": "Campos de rastreabilidade ausentes"
    }
  ]
}
```

### 200 OK — Relatório de origem indisponível

```json
{
  "artifactId": "550e8400-e29b-41d4-a716-446655440002",
  "driftStatus": "RELATORIO_INDISPONIVEL",
  "signals": [
    {
      "code": "SOURCE_UNAVAILABLE",
      "reasonPtBr": "Relatório de origem indisponível"
    }
  ]
}
```

### 200 OK — Sem drift detectado

```json
{
  "artifactId": "550e8400-e29b-41d4-a716-446655440003",
  "driftStatus": "SEM_DRIFT",
  "signals": []
}
```

### 401 Unauthorized

Token JWT ausente ou inválido.

```json
{ "error": "Unauthorized" }
```

### 403 Forbidden

Header `X-Organization-Id` ausente ou inválido.

```json
{ "error": "Forbidden" }
```

### 404 Not Found

Artefato não encontrado no escopo da organização autenticada. Retorna 404 também quando o artefato existe mas pertence a outra organização (não revela existência cross-org). Retorna 404 quando o artefato existe mas não é derivado de Check-up (`sourceCheckupReportId` é null) — neste caso não há drift a exibir.

```json
{ "error": "Not found" }
```

### 500 Internal Server Error

Falha técnica inesperada no cálculo de drift (ex.: timeout de DB). O artefato continua exibido normalmente no frontend; o indicador de drift mostra "Não foi possível calcular drift agora".

```json
{ "error": "Internal server error" }
```

---

## Regras de Negócio

1. O endpoint é protegido por JWT e `X-Organization-Id` — mesmas regras dos endpoints de artefatos existentes.
2. O cálculo é read-only — nenhuma mutação de dados ocorre.
3. O status é calculado sob demanda; não é persistido.
4. Hierarquia de severidade: `RELATORIO_INDISPONIVEL` > `RASTREABILIDADE_INCOMPLETA` > `POSSIVEL_DRIFT` > `SEM_DRIFT`.
5. Quando múltiplos sinais estão ativos, todos são retornados em `signals` e o `driftStatus` reflete o mais severo.
6. Artefatos sem `sourceCheckupReportId` retornam 404 (fora do escopo de drift).
7. Não consome créditos de AI.
