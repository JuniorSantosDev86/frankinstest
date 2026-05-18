# API Contract: Check-up Conversion Endpoints

**Branch**: `007-checkup-to-workspace-artifacts` | **Date**: 2026-05-18

Todos os endpoints exigem:
- Header `Authorization: Bearer <JWT>`
- Header `X-Organization-Id: <orgId>`

---

## POST `/api/checkup/reports/{reportId}/conversion/preview`

Retorna a pré-visualização dos artefatos que seriam criados a partir dos itens selecionados. **Não persiste nada.**

### Path Parameters

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `reportId` | String | ID do relatório de Check-up |

### Request Body

```json
{
  "selectedItems": [
    {
      "sourceSection": "missing_or_unclear_requirements",
      "sourceItemIndex": 0
    },
    {
      "sourceSection": "suggested_test_scenarios",
      "sourceItemIndex": 1
    },
    {
      "sourceSection": "quality_risks",
      "sourceItemIndex": 0
    }
  ]
}
```

**Validações**:
- `selectedItems` não pode ser nulo ou vazio → 400
- Cada `sourceSection` deve ser um valor válido (ver tabela de seções no data-model.md) → 400
- `sourceItemIndex` deve ser >= 0 e < tamanho da lista correspondente → 400

### Response 200

```json
{
  "reportId": "rpt_abc123",
  "organizationId": "org_xyz",
  "projectId": "proj_123",
  "items": [
    {
      "sourceSection": "missing_or_unclear_requirements",
      "sourceItemIndex": 0,
      "artifactType": "REQUIREMENT",
      "targetTable": "workspace_artifacts",
      "title": "Requisito: Validação de e-mail no cadastro",
      "description": "O sistema deve validar formato de e-mail antes de salvar.",
      "alreadyConverted": false,
      "existingArtifactId": null,
      "existingArtifactTable": null
    },
    {
      "sourceSection": "suggested_test_scenarios",
      "sourceItemIndex": 1,
      "artifactType": "TEST_SCENARIO",
      "targetTable": "test_scenarios",
      "title": "Cenário: Login com credenciais inválidas",
      "description": "Verificar mensagem de erro ao tentar login com senha errada.",
      "alreadyConverted": true,
      "existingArtifactId": "ts_prev123",
      "existingArtifactTable": "test_scenarios"
    }
  ]
}
```

### Responses de Erro

| HTTP | Condição |
|------|----------|
| 400 | `selectedItems` vazio, seção inválida ou índice fora do range |
| 401 | JWT ausente ou inválido |
| 403 | `X-Organization-Id` não coincide com o relatório |
| 404 | `reportId` não encontrado |
| 422 | Relatório não está elegível para conversão (AI run não completou) |

---

## POST `/api/checkup/reports/{reportId}/conversion/confirm`

Persiste os artefatos de forma atômica. Executa dentro de uma única transação — sucesso total ou rollback total.

### Path Parameters

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `reportId` | String | ID do relatório de Check-up |

### Request Body

```json
{
  "items": [
    {
      "sourceSection": "missing_or_unclear_requirements",
      "sourceItemIndex": 0,
      "intent": "CREATE_NEW"
    },
    {
      "sourceSection": "suggested_test_scenarios",
      "sourceItemIndex": 1,
      "intent": "SKIP"
    },
    {
      "sourceSection": "quality_risks",
      "sourceItemIndex": 0,
      "intent": "CREATE_NEW"
    }
  ]
}
```

**Campos**:
- `intent`: `CREATE_NEW` (criar artefato) ou `SKIP` (pular — nenhum artefato criado para este item)
- Itens com `intent = SKIP` são ignorados silenciosamente
- Itens com `intent = CREATE_NEW` e `alreadyConverted = true` criam uma nova versão/cópia

**Validações**:
- `items` não pode ser nulo ou vazio → 400
- Todos os itens com `intent = SKIP` → 400 (nada a criar)
- `intent` deve ser `CREATE_NEW` ou `SKIP` → 400

### Response 200

```json
{
  "reportId": "rpt_abc123",
  "createdArtifacts": [
    {
      "artifactId": "wa_new001",
      "artifactType": "REQUIREMENT",
      "targetTable": "workspace_artifacts",
      "sourceSection": "missing_or_unclear_requirements",
      "sourceItemIndex": 0
    },
    {
      "artifactId": "wa_new002",
      "artifactType": "RISK_ITEM",
      "targetTable": "workspace_artifacts",
      "sourceSection": "quality_risks",
      "sourceItemIndex": 0
    }
  ],
  "skippedCount": 1
}
```

### Responses de Erro

| HTTP | Condição |
|------|----------|
| 400 | `items` vazio, todos com SKIP, `intent` inválido |
| 401 | JWT ausente ou inválido |
| 403 | `X-Organization-Id` não coincide com o relatório |
| 404 | `reportId` não encontrado |
| 422 | Relatório não elegível para conversão |
| 500 | Falha transacional — rollback executado, nenhum artefato criado |
