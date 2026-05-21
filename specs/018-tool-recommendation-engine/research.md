# Research: Tool Recommendation Engine — Bloco 18

**Feature**: `018-tool-recommendation-engine`
**Date**: 2026-05-20

---

## Decisão 1: Lógica determinística de escolha k6 vs JMeter

**Decision**: k6 = PRIMARY por padrão; JMeter promovido a PRIMARY por presença de palavras-chave no relatório.

**Rationale**: A spec e as clarificações definem critério explícito. O engine é um classificador de regras simples — sem AI, sem scoring complexo.

**Campos inspecionados do CheckupReport**:
- `targetType` — `URL`, `FEATURE_DESCRIPTION`, `API_DESCRIPTION`, `MOBILE_FLOW`, `OTHER` → k6 PRIMARY
- `qualityRisks[*].title` + `.description` (lowercase)
- `suggestedTestScenarios[*].title` + `.description` (lowercase)
- `context` e `technologies` (se disponíveis via relatório)

**Regra de promoção JMeter → PRIMARY** (qualquer match):
- Keywords em `qualityRisks` ou `suggestedTestScenarios`: `jmeter`, `enterprise`, `java`, `legado`, `legacy`, `soap`, `wsdl`, `ftp`, `jdbc`, `distribuída`, `distributed`, `corporativo`, `corporate`
- targetType = `DOCUMENT` com keywords acima (conteúdo documental enterprise)

**Alternativas consideradas**:
- Score numérico ponderado → rejeitado; aumenta complexidade sem ganho no MVP
- Sempre incluir os dois como PRIMARY → rejeitado; dilui valor da recomendação

---

## Decisão 2: Onde o endpoint busca dados do relatório

**Decision**: Backend busca `CheckupReport` no banco via `CheckupRepository.findById(reportId)` + validação `organizationId`.

**Rationale**: `CheckupRepository.findById(id)` existe mas não filtra por org. O `ToolRecommendationService` deve buscar o relatório e validar `report.organizationId().equals(organizationId)` explicitamente — padrão consistente com `DriftService.calculateReportDrift()`.

**Campos usados do CheckupReport para o engine**:
```
targetType, qualityRisks, suggestedTestScenarios, context, technologies (via context)
```

**Alternatives considered**:
- Adicionar `findByIdAndOrg` ao `CheckupRepository` → válido mas desnecessário agora; a validação inline no service é mais simples
- Receber contexto no body → rejeitado em clarificação (manipulação/inconsistência)

---

## Decisão 3: Módulo de pacote no backend

**Decision**: `services/api/src/main/java/com/frankintest/api/toolrecommendation/`

**Rationale**: Segue o padrão modular do monolito existente — `drift/`, `workspace/`, `conversion/` são módulos irmãos. Nomes de arquivo seguem padrão: `ToolRecommendationController`, `ToolRecommendationService`, `ToolRecommendationModels`, `ToolRecommendationEngine`.

**Alternatives considered**:
- Subpacote dentro de `workspace/` → rejeitado; recomendação é uma funcionalidade independente com seus próprios endpoints
- Subpacote dentro de `checkup/` → rejeitado; o módulo consome checkup mas não é parte dele

---

## Decisão 4: Persistência via WorkspaceArtifactRepository existente

**Decision**: Reutilizar `WorkspaceArtifactRepository.save()` para criar artefatos `QA_ACTION`.

**Rationale**: O repositório e a tabela `workspace_artifacts` já existem e têm o campo `details` (TEXT/JSONB). `ToolRecommendationResult` serializado como JSON vai em `details`. Campos de rastreabilidade: `sourceCheckupReportId = reportId`, `sourceSection = "tool-recommendations"`, `sourceItemIndex = 0`, `aiAssisted = false`.

**Alternatives considered**:
- Novo endpoint de criação de artefato genérico → desnecessário; `save()` já faz insert direto

---

## Decisão 5: Localização do painel no frontend

**Decision**: Novo componente `ToolRecommendationPanel` em `apps/web/src/app/checkup/[runId]/ToolRecommendationPanel.tsx` adicionado à página existente `apps/web/src/app/checkup/[runId]/page.tsx`.

**Rationale**: A página `[runId]/page.tsx` já renderiza múltiplos painéis (`CheckupConversionPanel`, `CheckupArtifactsSection`, `DriftSummaryPanel`). O padrão está estabelecido. Sem nova rota — decisão confirmada em clarificação.

**Novo arquivo de API do frontend**: `apps/web/src/lib/toolrecommendations/toolRecommendationsApi.ts`
**Novos tipos**: `apps/web/src/lib/toolrecommendations/toolRecommendationsTypes.ts`

---

## Decisão 6: Ausência de migração de banco de dados

**Decision**: Nenhuma nova tabela ou coluna. `ToolRecommendationResult` não é persistido por padrão — apenas computado. Quando salvo, vai em `workspace_artifacts` existente.

**Rationale**: A spec define que `ToolRecommendationResult` é "resultado computado, não persistido por padrão". A tabela `workspace_artifacts` e o campo `details` já suportam o artefato salvo.

---

## Decisão 7: Estratégia de testes

**Backend**:
- `ToolRecommendationEngineTest` — unit test para lógica determinística (k6/JMeter, palavras-chave, categorias geradas)
- `ToolRecommendationControllerTest` — integração: gerar recomendação, auth 401/403, relatório 404, save cria novo artefato

**Frontend**:
- Componente `ToolRecommendationPanel` — estado vazio com CTA, estado com resultados, botão de salvar
- Sem E2E neste bloco (sem fluxo crítico de pagamento/autenticação)
