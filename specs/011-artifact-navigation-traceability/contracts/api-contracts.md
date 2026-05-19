# API Contracts: Workspace Artifact Navigation & Traceability Polish

**Feature**: 011-artifact-navigation-traceability
**Date**: 2026-05-19

---

## Endpoints Existentes (Sem Alteração de Contrato)

Estes endpoints já existem e **não são modificados** neste bloco. A documentação abaixo serve como referência de uso.

---

### GET /api/workspace/artifacts

Lista artefatos da organização com suporte a filtros opcionais.

**Headers obrigatórios**:
```
Authorization: Bearer <jwt_token>
X-Organization-Id: <org_id>
```

**Query params opcionais**:
```
projectId            string    — filtra por projeto
sourceCheckupReportId string   — filtra por relatório de Check-up de origem ← USADO NESTE BLOCO
artifactType         string    — REQUIREMENT | RISK_ITEM | QA_ACTION
status               string    — DRAFT | REVIEWED | ACCEPTED | ARCHIVED
```

**Resposta 200**:
```json
{
  "artifacts": [
    {
      "id": "art_abc123",
      "organizationId": "org_demo",
      "projectId": null,
      "artifactType": "RISK_ITEM",
      "title": "Ausência de validação de input no formulário de cadastro",
      "description": "...",
      "status": "DRAFT",
      "aiAssisted": true,
      "sourceCheckupReportId": "rpt_xyz456",
      "sourceAiRunId": "run_abc789",
      "sourceSection": "Riscos de qualidade",
      "sourceItemIndex": 0,
      "details": null,
      "createdBy": "user_123",
      "createdAt": "2026-05-19T10:00:00Z",
      "updatedAt": "2026-05-19T10:00:00Z"
    }
  ],
  "limitReached": false
}
```

**Comportamento de segurança**: Retorna apenas artefatos da `organizationId` autenticada. O filtro `sourceCheckupReportId` é aplicado dentro do escopo da organização — nunca retorna artefatos de outra organização, independentemente do ID passado.

**Erros**:
```
403 FORBIDDEN   — X-Organization-Id ausente ou inválido
```

---

### GET /api/workspace/artifacts/{id}

Retorna um artefato específico.

**Headers obrigatórios**: igual ao listagem

**Resposta 200**: objeto `WorkspaceArtifact` completo (mesmo schema acima)

**Erros**:
```
403 FORBIDDEN   — org inválida
404 NOT_FOUND   — artefato não encontrado ou pertence a outra org
```

---

### PATCH /api/workspace/artifacts/{id}

Atualiza campos editáveis de um artefato. Campos de rastreabilidade são imutáveis e rejeitados com erro.

**Headers obrigatórios**: igual ao listagem + `Content-Type: application/json`

**Body (campos editáveis)**:
```json
{
  "title": "Novo título",
  "description": "Nova descrição",
  "status": "REVIEWED",
  "details": {}
}
```

**Campos IMUTÁVEIS (retornam 400 se enviados)**:
```
id, organizationId, projectId, artifactType, aiAssisted,
sourceCheckupReportId, sourceAiRunId, sourceSection, sourceItemIndex, createdBy, createdAt
```

**Resposta 200**: objeto `WorkspaceArtifact` atualizado

**Erros**:
```
400 VALIDATION_ERROR    — título vazio, status inválido
400 IMMUTABLE_FIELD     — tentativa de alterar campo imutável
403 FORBIDDEN           — org inválida
404 NOT_FOUND           — artefato não encontrado
```

---

## Contratos de Navegação (Frontend)

### Rota: /workspace/artifacts

**Query params lidos na montagem**:
```
sourceCheckupReportId  string (opcional)  — pré-popula filtro; exibe banner de contexto
```

**Exemplo de URL gerada pelo link do relatório de Check-up**:
```
/workspace/artifacts?sourceCheckupReportId=rpt_xyz456
```

**Comportamento**:
- Se `sourceCheckupReportId` presente: filtro pré-aplicado + banner "Exibindo artefatos do relatório: [ID curto]"
- Se ausente: lista completa da organização

---

### Rota: /checkup/[runId]

**Sem alteração de contrato de rota.** Nova seção `CheckupArtifactsSection` é renderizada internamente, sem mudar a URL ou os parâmetros da página.

**Dados consumidos internamente**:
```
report.id  →  usado como sourceCheckupReportId para chamar listArtifacts()
```

---

## Campos de Rastreabilidade — Apresentação na UI

| Campo do backend | Apresentação na UI |
|---|---|
| `sourceSection: "Riscos de qualidade"` | `"Riscos de qualidade"` |
| `sourceSection: null` ou `""` | `"Seção de origem não informada"` |
| `sourceItemIndex: 0` | `"Item de origem #1"` |
| `sourceItemIndex: 2` | `"Item de origem #3"` |
| `sourceItemIndex: null` | campo não exibido |
| `sourceCheckupReportId: "rpt_xyz"` + `sourceAiRunId: "run_abc"` | link `<a href="/checkup/run_abc">Ver relatório de origem</a>` |
| `sourceCheckupReportId: "rpt_xyz"` + `sourceAiRunId: null` | texto desabilitado "Relatório de origem não disponível" |
| `sourceCheckupReportId: null` | sem elemento de origem exibido |
| **NOTA**: `sourceCheckupReportId` ≠ `runId` na URL | `sourceAiRunId` é o `aiRunId` correto para a rota `/checkup/[runId]` |
| `aiAssisted: true` | badge `"Gerado com IA"` |
