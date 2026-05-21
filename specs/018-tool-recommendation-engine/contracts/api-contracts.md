# API Contracts: Tool Recommendation Engine — Bloco 18

**Feature**: `018-tool-recommendation-engine`
**Date**: 2026-05-20
**Base URL**: `/api/tool-recommendations`

---

## POST /api/tool-recommendations/{reportId}

Gera recomendações de ferramentas de QA para um relatório de Check-up.

### Request

```http
POST /api/tool-recommendations/{reportId}
Authorization: Bearer <jwt>
X-Organization-Id: <orgId>
Content-Type: application/json

(body vazio)
```

### Response 200 OK

```json
{
  "reportId": "rpt_abc123",
  "generatedAt": "2026-05-20T14:32:00Z",
  "categories": [
    {
      "categoryCode": "PERFORMANCE",
      "categoryLabel": "Testes de Performance",
      "tools": [
        {
          "name": "k6",
          "url": "https://k6.io/docs/",
          "priority": "PRIMARY",
          "rationale": "k6 é a escolha recomendada para testes de performance em APIs REST e aplicações web modernas, com suporte a scripting em JavaScript e integração com CI/CD."
        },
        {
          "name": "JMeter",
          "url": "https://jmeter.apache.org/",
          "priority": "SECONDARY",
          "rationale": "JMeter é uma alternativa consolidada, especialmente útil em ambientes enterprise com múltiplos protocolos ou equipes com histórico nesta ferramenta."
        }
      ],
      "justification": "O relatório apresenta riscos de performance (ex.: 'latência elevada em carga'). Testes de carga e stress são recomendados para validar comportamento sob demanda.",
      "nextSteps": [
        "Instalar k6: https://k6.io/docs/getting-started/installation/",
        "Criar script base de carga para o endpoint principal identificado no relatório",
        "Definir cenário de carga: usuários virtuais, ramp-up e duração",
        "Estabelecer thresholds de aprovação/reprovação: p95 < 500ms, taxa de erro < 1%",
        "Integrar execução ao pipeline de CI como etapa opcional de validação"
      ]
    }
  ]
}
```

### Responses de erro

| Status | Condição |
|--------|----------|
| `401 Unauthorized` | JWT ausente ou inválido |
| `403 Forbidden` | `X-Organization-Id` ausente ou não pertence ao principal |
| `404 Not Found` | Relatório inexistente ou de outra organização |
| `422 Unprocessable Entity` | Relatório não está em status válido para recomendação (ex.: AI run ainda em andamento) |

**Corpo de erro padrão**:
```json
{ "message": "Relatório não encontrado." }
```

---

## POST /api/tool-recommendations/{reportId}/save

Persiste o `ToolRecommendationResult` como artefato `WorkspaceArtifact` do tipo `QA_ACTION`. Sempre cria novo artefato — nunca sobrescreve.

### Request

```http
POST /api/tool-recommendations/{reportId}/save
Authorization: Bearer <jwt>
X-Organization-Id: <orgId>
Content-Type: application/json

(body vazio — o backend recalcula ou usa o resultado mais recente)
```

**Decisão de design**: O backend gera (ou regenera) o `ToolRecommendationResult` no momento do save, em vez de receber o resultado como body. Garante que o artefato salvo corresponde sempre aos dados reais do banco.

### Response 201 Created

```json
{
  "artifactId": "art_xyz789",
  "artifactType": "QA_ACTION",
  "title": "Recomendações de ferramentas de QA — rpt_abc123",
  "status": "DRAFT",
  "createdAt": "2026-05-20T14:33:00Z"
}
```

### Responses de erro

| Status | Condição |
|--------|----------|
| `401 Unauthorized` | JWT ausente ou inválido |
| `403 Forbidden` | `X-Organization-Id` ausente ou inválido |
| `404 Not Found` | Relatório inexistente ou de outra organização |
| `422 Unprocessable Entity` | Relatório não está em status válido |

---

## Notas de segurança

- Ambos os endpoints validam JWT via `JwtAuthFilter` e `X-Organization-Id` via `WorkspaceAccessService.requireOrgAccess()`.
- O `reportId` é validado com `CheckupRepository.findById()` + verificação `report.organizationId().equals(organizationId)` — 404 se não pertencer à org (não revela existência de relatórios de outras orgs).
- Nenhuma chamada a AI provider. Lógica determinística pura.
- Rate limiting existente aplica-se automaticamente via `RateLimitFilter`.
