# API Contract: Workspace Artifacts Review & Editing

**Branch**: `009-workspace-artifacts-review-editing` | **Date**: 2026-05-18

Todos os endpoints exigem:
- Header `Authorization: Bearer <JWT>`
- Header `X-Organization-Id: <orgId>`

---

## GET `/api/workspace/artifacts`

Lista os artefatos do Workspace da organização autenticada. Retorna no máximo 200 artefatos, ordenados por `createdAt` decrescente.

### Query Parameters (todos opcionais)

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `projectId` | String | Filtrar por projeto de destino |
| `sourceCheckupReportId` | String | Filtrar por relatório de Check-up de origem |
| `artifactType` | String | Filtrar por tipo: `REQUIREMENT`, `RISK_ITEM`, `QA_ACTION` |
| `status` | String | Filtrar por status: `DRAFT`, `REVIEWED`, `ACCEPTED`, `ARCHIVED` |

**Validações**:
- `artifactType` quando presente deve ser um valor válido → 400
- `status` quando presente deve ser um valor válido → 400
- `organizationId` vem exclusivamente do header `X-Organization-Id` (nunca do query param)

### Response 200

```json
{
  "artifacts": [
    {
      "id": "wa_abc001",
      "organizationId": "org_xyz",
      "projectId": "proj_123",
      "artifactType": "REQUIREMENT",
      "title": "Requisito: Validação de e-mail no cadastro",
      "description": "O sistema deve validar formato de e-mail antes de salvar.",
      "status": "DRAFT",
      "aiAssisted": true,
      "sourceCheckupReportId": "rpt_abc123",
      "sourceSection": "missing_or_unclear_requirements",
      "sourceItemIndex": 0,
      "details": {
        "severity": "HIGH",
        "originalText": "Email validation is missing"
      },
      "createdBy": "usr_001",
      "createdAt": "2026-05-18T10:00:00Z",
      "updatedAt": "2026-05-18T10:00:00Z"
    }
  ],
  "limitReached": false
}
```

**Campo `limitReached`**: `true` quando existem mais de 200 artefatos para os filtros aplicados. O frontend deve exibir aviso em pt-BR quando `limitReached` for `true`.

### Responses de Erro

| HTTP | Condição |
|------|----------|
| 400 | `artifactType` ou `status` com valor inválido |
| 401 | JWT ausente ou inválido |
| 403 | `X-Organization-Id` ausente ou inválido |

---

## GET `/api/workspace/artifacts/{id}`

Retorna um único artefato por ID. Valida que o artefato pertence à organização do header.

### Path Parameters

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | String | ID do artefato (UUID) |

### Response 200

```json
{
  "id": "wa_abc001",
  "organizationId": "org_xyz",
  "projectId": "proj_123",
  "artifactType": "REQUIREMENT",
  "title": "Requisito: Validação de e-mail no cadastro",
  "description": "O sistema deve validar formato de e-mail antes de salvar.",
  "status": "DRAFT",
  "aiAssisted": true,
  "sourceCheckupReportId": "rpt_abc123",
  "sourceSection": "missing_or_unclear_requirements",
  "sourceItemIndex": 0,
  "details": {
    "severity": "HIGH",
    "originalText": "Email validation is missing"
  },
  "createdBy": "usr_001",
  "createdAt": "2026-05-18T10:00:00Z",
  "updatedAt": "2026-05-18T10:00:00Z"
}
```

### Responses de Erro

| HTTP | Condição |
|------|----------|
| 401 | JWT ausente ou inválido |
| 403 | Header `X-Organization-Id` ausente ou inválido |
| 404 | Artefato não encontrado **ou** artefato existe mas pertence a outra organização (não revela existência) |

**Nota de segurança**: O backend usa `findById(id, organizationId)` — artefatos de outras organizações retornam 404, não 403, para evitar enumeração de IDs.

---

## PATCH `/api/workspace/artifacts/{id}`

Atualiza os campos editáveis de um artefato. Campos omitidos no payload não são alterados. Campos imutáveis no payload causam rejeição com 400.

### Path Parameters

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | String | ID do artefato (UUID) |

### Request Body

Todos os campos são opcionais. Envie apenas os campos que deseja alterar.

```json
{
  "title": "Requisito: Validação de e-mail e telefone no cadastro",
  "description": "O sistema deve validar formato de e-mail e telefone antes de salvar.",
  "status": "REVIEWED",
  "details": {
    "severity": "HIGH",
    "originalText": "Email validation is missing"
  }
}
```

**Campos editáveis**: `title`, `description`, `status`, `details`

**Campos proibidos no payload** (presença de qualquer um → 400 com lista dos campos inválidos em pt-BR):
`sourceCheckupReportId`, `sourceSection`, `sourceItemIndex`, `aiAssisted`, `createdBy`, `createdAt`, `organizationId`, `projectId`, `id`, `artifactType`

**Detecção de campos proibidos**: O backend lê o corpo da requisição como `Map<String,Object>` para verificar a presença de chaves proibidas **antes** de mapear para o DTO de atualização. Isso garante que campos proibidos nunca sejam ignorados silenciosamente pelo mapeamento automático do DTO.

**Validações de campo**:
- `title`: quando presente, não pode ser vazio ou nulo → 400
- `status`: quando presente, deve ser `DRAFT`, `REVIEWED`, `ACCEPTED` ou `ARCHIVED` → 400
- `details`: quando presente, deve satisfazer o esquema mínimo do `artifactType` do artefato → 400

### Response 200

Retorna o artefato completo com os campos atualizados:

```json
{
  "id": "wa_abc001",
  "organizationId": "org_xyz",
  "projectId": "proj_123",
  "artifactType": "REQUIREMENT",
  "title": "Requisito: Validação de e-mail e telefone no cadastro",
  "description": "O sistema deve validar formato de e-mail e telefone antes de salvar.",
  "status": "REVIEWED",
  "aiAssisted": true,
  "sourceCheckupReportId": "rpt_abc123",
  "sourceSection": "missing_or_unclear_requirements",
  "sourceItemIndex": 0,
  "details": {
    "severity": "HIGH",
    "originalText": "Email validation is missing"
  },
  "createdBy": "usr_001",
  "createdAt": "2026-05-18T10:00:00Z",
  "updatedAt": "2026-05-18T11:30:00Z"
}
```

### Responses de Erro

| HTTP | Condição |
|------|----------|
| 400 | Campos imutáveis no payload (lista os campos recebidos em pt-BR); `title` vazio; `status` inválido; `details` com schema inválido para o `artifactType`; payload vazio |
| 401 | JWT ausente ou inválido |
| 403 | Header `X-Organization-Id` ausente ou inválido |
| 404 | Artefato não encontrado **ou** artefato existe mas pertence a outra organização (não revela existência) |

---

## Evento de Auditoria gerado pelo PATCH

A cada PATCH bem-sucedido o backend registra na tabela `audit_log`:

**Exemplo — mudança de status (inclui previousStatus e newStatus):**
```json
{
  "action": "ARTIFACT_UPDATED",
  "entityId": "wa_abc001",
  "organizationId": "org_xyz",
  "userId": "usr_001",
  "timestamp": "2026-05-18T11:30:00Z",
  "details": {
    "changedFields": ["title", "status"],
    "previousStatus": "DRAFT",
    "newStatus": "REVIEWED"
  }
}
```

**Exemplo — edição de título apenas (sem mudança de status):**
```json
{
  "action": "ARTIFACT_UPDATED",
  "entityId": "wa_abc001",
  "organizationId": "org_xyz",
  "userId": "usr_001",
  "timestamp": "2026-05-18T11:30:00Z",
  "details": {
    "changedFields": ["title"]
  }
}
```

Regras:
- `previousStatus` e `newStatus` são incluídos **apenas** quando `status` foi um dos campos alterados.
- Quando apenas campos não-status são alterados (`title`, `description`, `details`), `previousStatus` e `newStatus` estão **ausentes** do payload de auditoria.
- `changedFields` lista apenas os campos que tiveram valor efetivamente diferente do anterior.
- Um PATCH que não altera nenhum valor ainda registra evento de auditoria com `changedFields = []`.
