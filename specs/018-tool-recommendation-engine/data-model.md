# Data Model: Tool Recommendation Engine — Bloco 18

**Feature**: `018-tool-recommendation-engine`
**Date**: 2026-05-20

---

## Entidades em memória (não persistidas por padrão)

### ToolRecommendationResult

Resultado computado pelo engine. Retornado pelo endpoint `POST /api/tool-recommendations/{reportId}`. Não persistido automaticamente — salvar é ação explícita do usuário.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `reportId` | `String` | ID do relatório de Check-up de origem |
| `generatedAt` | `Instant` | Timestamp do cálculo |
| `categories` | `List<ToolRecommendationCategory>` | Categorias de ferramentas recomendadas |

---

### ToolRecommendationCategory

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `categoryCode` | `String` (enum: `PERFORMANCE`, ...) | Código canônico da categoria |
| `categoryLabel` | `String` (pt-BR) | Label exibível — ex.: "Testes de Performance" |
| `tools` | `List<RecommendedTool>` | Ferramentas recomendadas nesta categoria |
| `justification` | `String` (pt-BR) | Justificativa da categoria e critérios aplicados |
| `nextSteps` | `List<String>` (pt-BR) | Próximos passos acionáveis |

**Categorias suportadas no Bloco 18**:
- `PERFORMANCE` — única categoria entregue neste bloco (k6/JMeter)

---

### RecommendedTool

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `name` | `String` | Nome da ferramenta — ex.: "k6", "JMeter" |
| `url` | `String` | URL da documentação oficial |
| `priority` | `ToolPriority` (enum: `PRIMARY`, `SECONDARY`) | Relevância no contexto do relatório |
| `rationale` | `String` (pt-BR) | Razão específica para recomendar esta ferramenta |

---

## Entidade persistida (ao salvar)

### WorkspaceArtifact (QA_ACTION)

Tabela existente: `workspace_artifacts`. Nenhuma migração necessária.

| Campo | Valor ao salvar recomendação |
|-------|------------------------------|
| `id` | `UUID` gerado pelo backend |
| `organizationId` | do `X-Organization-Id` da requisição |
| `projectId` | `null` (recomendação não é vinculada a projeto neste bloco) |
| `artifactType` | `QA_ACTION` |
| `title` | `"Recomendações de ferramentas de QA — <reportId curto>"` |
| `description` | `"Recomendações geradas automaticamente para o relatório de Check-up."` |
| `status` | `DRAFT` |
| `aiAssisted` | `false` |
| `sourceCheckupReportId` | `reportId` |
| `sourceAiRunId` | `null` |
| `sourceSection` | `"tool-recommendations"` |
| `sourceItemIndex` | `0` |
| `details` | JSON serializado do `ToolRecommendationResult` |
| `createdBy` | `userId` do JWT |
| `createdAt` | timestamp do save |
| `updatedAt` | timestamp do save |

**Nota**: Cada chamada ao `/save` cria um novo artefato independente. Não há chave única `(reportId, artifactType)` — múltiplos saves geram múltiplos artefatos com UUIDs distintos.

---

## Consumo de dados do CheckupReport

O engine lê os seguintes campos do `CheckupReport` persistido:

| Campo | Tipo | Uso no engine |
|-------|------|---------------|
| `targetType` | `TargetType` enum | Seleção de categorias relevantes |
| `qualityRisks` | `List<FindingItem>` | Detecção de keywords de performance |
| `suggestedTestScenarios` | `List<ScenarioItem>` | Detecção de keywords de performance |
| `organizationId` | `String` | Validação de pertencimento à org |

---

## Enums novos (em `ToolRecommendationModels`)

```java
enum ToolCategory { PERFORMANCE }  // expandível pós-MVP
enum ToolPriority { PRIMARY, SECONDARY }
```
