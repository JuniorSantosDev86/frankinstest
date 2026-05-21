# Tasks: Tool Recommendation Engine — Bloco 18

**Branch**: `018-tool-recommendation-engine` | **Date**: 2026-05-20
**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

---

## Fase 1 — Setup e documentação final

### [X] T-01 · Confirmar ambiente e dependências
- **Arquivo**: nenhum novo
- **Ação**: Verificar que Docker Compose está rodando, backend compila e frontend instala sem erros.
- **Comando de validação**:
  ```bash
  (cd services/api && ./mvnw compile -q)
  (cd apps/web && npm install --silent)
  ```
- **Critério de aceite**: zero erros de compilação ou instalação.
- **Depende de**: —
- **Bloqueante para**: todas as fases subsequentes

---

## Fase 2 — Backend: Models e Engine

### [X] T-02 · Criar `ToolRecommendationModels.java`
- **Arquivo**: `services/api/src/main/java/com/frankintest/api/toolrecommendation/ToolRecommendationModels.java`
- **Conteúdo**:
  - Enum `ToolCategory { PERFORMANCE }`
  - Enum `ToolPriority { PRIMARY, SECONDARY }`
  - Record `RecommendedTool(String name, String url, ToolPriority priority, String rationale)`
  - Record `ToolRecommendationCategory(String categoryCode, String categoryLabel, List<RecommendedTool> tools, String justification, List<String> nextSteps)`
  - Record `ToolRecommendationResult(String reportId, Instant generatedAt, List<ToolRecommendationCategory> categories)`
  - Exceções internas: `ReportNotFoundException(String reportId)`, `ReportNotReadyException(String reportId)`
- **Depende de**: T-01
- **Bloqueante para**: T-03, T-04

### [X] T-03 · Criar `ToolRecommendationEngine.java`
- **Arquivo**: `services/api/src/main/java/com/frankintest/api/toolrecommendation/ToolRecommendationEngine.java`
- **Contrato**: `ToolRecommendationResult compute(CheckupModels.CheckupReport report)`
- **Lógica**:
  1. Construir texto de inspeção: concatenar (lowercase) todos os `title` e `description` de `qualityRisks` e `suggestedTestScenarios`.
  2. Verificar presença de **keywords de performance**: `performance`, `latência`, `latencia`, `carga`, `load`, `stress`, `throughput`, `rps`, `tempo de resposta`, `response time`, `escalabilidade`, `concorrência`, `concurrent`.
  3. Se encontradas → gerar categoria `PERFORMANCE`:
     - Verificar **keywords de promoção JMeter**: `jmeter`, `enterprise`, `java`, `legado`, `legacy`, `soap`, `wsdl`, `ftp`, `jdbc`, `distribuída`, `distributed`, `corporativo`, `corporate`.
     - Se encontradas → JMeter = PRIMARY, k6 = SECONDARY.
     - Caso contrário → k6 = PRIMARY, JMeter = SECONDARY.
     - Justificativa e nextSteps em pt-BR conforme keywords detectadas.
  4. Se nenhuma keyword de performance encontrada → retornar `categories` vazia (sem categoria PERFORMANCE).
  5. Sem I/O, sem estado, sem dependência de Spring — classe `@Component` simples.
- **Restrição**: ZERO chamadas a `AiProviderPort`, `AnthropicAiProvider`, `MockAiProvider` ou qualquer AI provider.
- **Depende de**: T-02
- **Bloqueante para**: T-04, T-06

---

## Fase 3 — Backend: Service e Controller

### [X] T-04 · Criar `ToolRecommendationService.java`
- **Arquivo**: `services/api/src/main/java/com/frankintest/api/toolrecommendation/ToolRecommendationService.java`
- **Dependências injetadas**: `CheckupRepository`, `WorkspaceArtifactRepository`, `ToolRecommendationEngine`, `WorkspaceAccessService` (não injetado aqui — validação de org fica no controller seguindo padrão do DriftController)
- **Métodos**:
  1. `ToolRecommendationResult generate(String reportId, String organizationId)`:
     - `CheckupRepository.findById(reportId)` → se vazio → lança `ReportNotFoundException`
     - Valida `report.organizationId().equals(organizationId)` → se não → lança `ReportNotFoundException` (não revela existência)
     - Valida `report.status() == ReportStatus.DRAFT || == ReportStatus.REVIEWED` → se não → lança `ReportNotReadyException`
     - Chama `engine.compute(report)` → retorna resultado
  2. `WorkspaceArtifactSaveResponse save(String reportId, String organizationId, String userId)`:
     - Chama `generate(reportId, organizationId)` internamente para garantir dados frescos
     - Serializa `ToolRecommendationResult` como JSON via `ObjectMapper`
     - Cria `WorkspaceArtifactRow` com: `id = UUID.randomUUID()`, `artifactType = QA_ACTION`, `title = "Recomendações de ferramentas de QA — " + reportId (primeiros 8 chars)`, `description = "Recomendações geradas para o relatório de Check-up."`, `status = DRAFT`, `aiAssisted = false`, `sourceCheckupReportId = reportId`, `sourceSection = "tool-recommendations"`, `sourceItemIndex = 0`, `details = jsonDoResultado`, `createdBy = userId`
     - Chama `WorkspaceArtifactRepository.save(row)`
     - Retorna `WorkspaceArtifactSaveResponse(id, artifactType, title, status, createdAt)` (novo record em `ToolRecommendationModels`)
- **Nota de implementação — createdAt**: `WorkspaceArtifactRepository.save()` retorna `void`. O service deve gerar `createdAt = Instant.now()` localmente antes de criar o `WorkspaceArtifactRow` e reutilizar o mesmo valor no `WorkspaceArtifactSaveResponse`. Não fazer round-trip ao banco para ler o `createdAt` — o valor local é suficiente e consistente.
- **Depende de**: T-02, T-03
- **Bloqueante para**: T-05

### [X] T-05 · Criar `ToolRecommendationController.java`
- **Arquivo**: `services/api/src/main/java/com/frankintest/api/toolrecommendation/ToolRecommendationController.java`
- **Endpoints**:
  1. `POST /api/tool-recommendations/{reportId}` → `ResponseEntity<?>`
  2. `POST /api/tool-recommendations/{reportId}/save` → `ResponseEntity<?>`
- **Padrão**: seguir `DriftController` exatamente — `@AuthenticationPrincipal AuthenticatedPrincipal principal`, `@RequestHeader(value = "X-Organization-Id", required = false) String organizationId`, try/catch com mapeamento para status HTTP.
- **Mapeamento de exceções**:
  - `MissingOrgHeaderException` | `AccessDeniedException` → 403
  - `ReportNotFoundException` → 404 com `{"message": "Relatório não encontrado."}`
  - `ReportNotReadyException` → 422 com `{"message": "Relatório ainda não está concluído."}`
  - `Exception` → 500
- **Endpoint `/save`**: retorna `201 Created` com body `WorkspaceArtifactSaveResponse`
- **Endpoint `/generate`**: retorna `200 OK` com body `ToolRecommendationResult`
- **Restrição**: controller thin — nenhuma lógica de negócio aqui.
- **Depende de**: T-04
- **Bloqueante para**: T-06, T-07

---

## Fase 4 — Backend: Testes

### [X] T-06 · Criar `ToolRecommendationEngineTest.java`
- **Arquivo**: `services/api/src/test/java/com/frankintest/api/toolrecommendation/ToolRecommendationEngineTest.java`
- **Tipo**: unit test puro (JUnit 5, sem Spring context, sem banco)
- **Casos de teste** (mínimos obrigatórios):
  1. `qualityRisks` com "performance" → categoria PERFORMANCE presente, k6 = PRIMARY
  2. `qualityRisks` com "latência" (acentuado) → PERFORMANCE presente, k6 = PRIMARY
  3. `qualityRisks` com "java" e "enterprise" → PERFORMANCE presente, JMeter = PRIMARY
  4. `qualityRisks` com "legado" → PERFORMANCE presente, JMeter = PRIMARY
  5. `suggestedTestScenarios` com "carga" (qualityRisks vazio) → PERFORMANCE presente
  6. Relatório sem nenhuma keyword de performance → categories vazia
  7. Keywords case-insensitive: "PERFORMANCE", "Latência", "JAVA" → detecção correta
  8. `targetType = URL` sem keywords → categories vazia (sem PERFORMANCE por padrão sem sinal)
  9. Resultado contém `reportId` e `generatedAt` não nulos
  10. `nextSteps` não vazio quando PERFORMANCE presente
- **Depende de**: T-03
- **Paralelizável com**: T-07

### [X] T-07 · Criar `ToolRecommendationControllerTest.java`
- **Arquivo**: `services/api/src/test/java/com/frankintest/api/toolrecommendation/ToolRecommendationControllerTest.java`
- **Tipo**: teste de integração com banco (estende `BaseIntegrationTest`)
- **Setup**: inserir relatório de Check-up de teste no banco com `qualityRisks` contendo "performance"
- **Casos de teste** (mínimos obrigatórios):
  1. `POST /api/tool-recommendations/{reportId}` com JWT válido e relatório da org → 200 + categories[0].categoryCode = "PERFORMANCE"
  2. `POST /api/tool-recommendations/{reportId}` sem JWT → 401
  3. `POST /api/tool-recommendations/{reportId}` sem `X-Organization-Id` → 403
  4. `POST /api/tool-recommendations/{reportId}` com `X-Organization-Id` de outra org → 404
  5. `POST /api/tool-recommendations/{reportId}` com `reportId` inexistente → 404
  6. `POST /api/tool-recommendations/{reportId}/save` com JWT válido e relatório da org → 201 + body com `artifactType = QA_ACTION`
  7. `POST /api/tool-recommendations/{reportId}/save` → artefato presente na tabela `workspace_artifacts` com `details` não nulo e `source_section = tool-recommendations`
  8. `POST /api/tool-recommendations/{reportId}/save` duas vezes para o mesmo relatório → 2 artefatos distintos (UUIDs diferentes)
  9. `POST /api/tool-recommendations/{reportId}/save` sem JWT → 401
  10. SC-005 é verificado pela T-15 (grep no módulo toolrecommendation/) — não duplicar aqui
- **Depende de**: T-05
- **Paralelizável com**: T-06

---

## Fase 5 — Frontend: Tipos e API Client

### [X] T-08 · Criar `toolRecommendationsTypes.ts`
- **Arquivo**: `apps/web/src/lib/toolrecommendations/toolRecommendationsTypes.ts`
- **Conteúdo**:
  ```typescript
  export type ToolPriority = 'PRIMARY' | 'SECONDARY'

  export interface RecommendedTool {
    name: string
    url: string
    priority: ToolPriority
    rationale: string
  }

  export interface ToolRecommendationCategory {
    categoryCode: string
    categoryLabel: string
    tools: RecommendedTool[]
    justification: string
    nextSteps: string[]
  }

  export interface ToolRecommendationResult {
    reportId: string
    generatedAt: string
    categories: ToolRecommendationCategory[]
  }

  export interface ToolRecommendationSaveResponse {
    artifactId: string
    artifactType: string
    title: string
    status: string
    createdAt: string
  }
  ```
- **Depende de**: T-01
- **Paralelizável com**: T-02, T-03, T-04, T-05 (frontend independe do backend nesta fase)
- **Bloqueante para**: T-09

### [X] T-09 · Criar `toolRecommendationsApi.ts`
- **Arquivo**: `apps/web/src/lib/toolrecommendations/toolRecommendationsApi.ts`
- **Padrão**: seguir `checkupApi.ts` — usar `buildAuthHeaders()` com JWT e `X-Organization-Id`
- **Funções**:
  1. `generateRecommendations(reportId: string): Promise<ToolRecommendationResult>` → `POST /api/tool-recommendations/{reportId}` (body vazio)
  2. `saveRecommendationAsArtifact(reportId: string): Promise<ToolRecommendationSaveResponse>` → `POST /api/tool-recommendations/{reportId}/save` (body vazio)
- **Tratamento de erro**: lançar `ApiError` com status e mensagem (mesmo padrão de `checkupApi.ts`)
- **Restrição**: ZERO chamadas a AI provider direto; ZERO lógica de negócio ou validação de org
- **Depende de**: T-08
- **Bloqueante para**: T-10

---

## Fase 6 — Frontend: Componente e integração na página

### [X] T-10 · Criar `ToolRecommendationPanel.tsx`
- **Arquivo**: `apps/web/src/app/checkup/[runId]/ToolRecommendationPanel.tsx`
- **Props**: `{ reportId: string }` — recebe o `reportId` explicitamente, **não** o `runId` da rota. O `runId` da rota é o `aiRunId`; o `reportId` é `status?.report?.id`, já extraído pela página.
- **Estado local**: `type PanelState = 'idle' | 'loading' | 'loaded' | 'error' | 'saving' | 'saved'`
- **Comportamento por estado**:
  - `idle`: Exibir painel com título "Recomendações de ferramentas" e botão `"Gerar recomendações de ferramentas"` em destaque. Nenhuma chamada ao backend.
  - `loading`: Indicador de carregamento (spinner ou texto "Carregando recomendações..."). Botão desabilitado.
  - `loaded`: Exibir lista de categorias. Cada categoria mostra: `categoryLabel`, `justification`, lista de `tools` (nome, prioridade, rationale, link para `url`), lista `nextSteps` numerada. Botão `"Salvar como artefato"` disponível.
  - `saving`: Botão de salvar desabilitado com texto "Salvando...".
  - `saved`: Confirmação discreta "Artefato salvo no Workspace." com link para `/workspace/artifacts`.
  - `error`: Mensagem discreta em pt-BR sem quebrar o restante da página. Botão de tentar novamente.
- **Labels obrigatórios em pt-BR**:
  - `"Recomendações de ferramentas"`
  - `"Gerar recomendações de ferramentas"`
  - `"Salvar como artefato"`
  - `"Carregando recomendações..."`
  - `"Salvando..."`
  - `"Artefato salvo no Workspace."`
  - `"Erro ao gerar recomendações. Tente novamente."`
  - `"Erro ao salvar artefato. Tente novamente."`
  - Badge de prioridade: `"Principal"` (PRIMARY) / `"Alternativa"` (SECONDARY)
- **Restrição**: nenhuma chamada automática ao montar o componente; geração só ocorre via clique do usuário.
- **Depende de**: T-09
- **Bloqueante para**: T-11

### [X] T-11 · Adicionar `<ToolRecommendationPanel>` à página do relatório
- **Arquivo alterado**: `apps/web/src/app/checkup/[runId]/page.tsx`
- **Ação**: Importar `ToolRecommendationPanel` e renderizá-lo após `<DriftSummaryPanel>`, passando `reportId={report.id}`. A página já extrai `const reportId = status?.report?.id ?? null` na linha 138 — usar essa variável.
- **Condicional de renderização**: renderizar o painel somente quando `reportId` estiver disponível (`{reportId && <ToolRecommendationPanel reportId={reportId} />}`). Quando `reportId` for nulo (relatório ainda em processamento), o painel não é renderizado — sem estado de fallback visível.
- **Regra**: nenhuma outra alteração na página — não remover, reordenar ou modificar componentes existentes.
- **Depende de**: T-10
- **Bloqueante para**: T-12

---

## Fase 7 — Frontend: Testes de componente

### [X] T-12 · Testes do `ToolRecommendationPanel`
- **Verificação prévia**: O `package.json` de `apps/web` declara `"test": "node --test"` — o projeto não usa Jest nem React Testing Library. **Não adicionar essas dependências** neste bloco.
- **Abordagem**: validação por build/lint + checklist manual (padrão MVP do projeto para componentes frontend sem runner de componente configurado).
- **Ações**:
  1. Garantir que `npm run lint` passa sem erros no novo componente e no `page.tsx` alterado.
  2. Garantir que `npm run build` compila sem erros de tipo TypeScript (type-checks cobrem contratos de props, incluindo que `reportId: string` é passado corretamente).
  3. Executar checklist manual descrito em T-16 para validar comportamento visual dos estados (`idle`, `loading`, `loaded`, `error`, `saving`, `saved`).
- **Nota**: testes de componente com runner dedicado (Vitest + Testing Library ou Playwright component) são escopo pós-MVP. Adicionar qualquer dependência de test framework deve ser feito em bloco dedicado de infraestrutura de testes, não aqui.
- **Depende de**: T-10, T-11
- **Paralelizável com**: T-07 (backend e frontend são independentes entre si)

---

## Fase 8 — QA final, lint, build e run report

### [X] T-13 · Executar suite completa de testes backend
- **Comandos**:
  ```bash
  (cd services/api && ./mvnw test)
  ```
- **Critério de aceite**: zero falhas. Todos os testes de blocos anteriores continuam passando (SC-007).
- **Depende de**: T-06, T-07

### [X] T-14 · Executar lint e build do frontend
- **Comandos**:
  ```bash
  (cd apps/web && npm run lint && npm run build)
  ```
- **Critério de aceite**: zero erros de lint; build completo sem erros de tipo (SC-006).
- **Depende de**: T-12

### [X] T-15 · Verificar ausência de chamadas a AI provider (SC-005)
- **Comando**:
  ```bash
  grep -r "AnthropicAiProvider\|AiProviderPort\|openai\|anthropic" \
    services/api/src/main/java/com/frankintest/api/toolrecommendation/ \
    && echo "FALHOU" || echo "OK — zero chamadas a AI provider"
  ```
- **Critério de aceite**: saída `OK — zero chamadas a AI provider`.
- **Depende de**: T-05
- **Paralelizável com**: T-13, T-14

### T-16 · Validação manual do fluxo completo (quickstart)
- **Referência**: [quickstart.md](quickstart.md)
- **Checklist**:
  - [ ] Backend sobe sem erros
  - [ ] `POST /api/tool-recommendations/{reportId}` retorna 200 com categoria PERFORMANCE
  - [ ] `POST /api/tool-recommendations/{reportId}/save` retorna 201
  - [ ] Artefato `QA_ACTION` aparece em `/workspace/artifacts`
  - [ ] Página do relatório exibe painel vazio com CTA ao abrir
  - [ ] Clique em "Gerar recomendações" exibe ferramentas em pt-BR
  - [ ] Clique em "Salvar como artefato" exibe confirmação
  - [ ] Segundo save para o mesmo relatório cria segundo artefato distinto
  - [ ] Endpoints existentes de Check-up, conversão e drift não regridem
- **Depende de**: T-13, T-14, T-15

### T-17 · Escrever run report do Bloco 18
- **Localização sugerida**: adicionar ao `AGENTS.md` ou como comentário no commit final
- **Seções obrigatórias** (conforme CLAUDE.md):
  1. Arquivos alterados ou criados
  2. Funcionalidades implementadas
  3. Regras de negócio preservadas
  4. Testes adicionados/atualizados
  5. Comandos de validação executados
  6. Limitações conhecidas
  7. Atualizações de roadmap/status atual
  8. Mensagem de commit sugerida
- **Depende de**: T-16

---

## Grafo de Dependências

```
T-01
 ├── T-02
 │    ├── T-03
 │    │    ├── T-04
 │    │    │    └── T-05
 │    │    │         ├── T-07
 │    │    │         └── T-15
 │    │    └── T-06
 │    └── T-04 (ver acima)
 ├── T-08
 │    └── T-09
 │         └── T-10
 │              └── T-11
 │                   └── T-12
T-06 + T-07 → T-13
T-12        → T-14
T-13 + T-14 + T-15 → T-16
T-16 → T-17
```

---

## Tarefas Paralelizáveis

| Grupo | Tarefas | Condição |
|-------|---------|----------|
| A | T-02, T-08 | Após T-01 — backend models e frontend types são independentes |
| B | T-06, T-07 | Após T-05 — unit test do engine e integration test do controller são independentes |
| C | T-13, T-14, T-15 | Após T-07 e T-12 — testes backend, frontend e grep de AI são independentes |

---

## Resumo da Ordem de Execução

1. **T-01** — Confirmar ambiente
2. **T-02 + T-08** (paralelo) — Models Java + Types TypeScript
3. **T-03** — Engine determinístico
4. **T-09** (pode iniciar após T-08) — API client frontend
5. **T-04** — Service backend
6. **T-10** (pode iniciar após T-09) — Componente ToolRecommendationPanel
7. **T-05** — Controller backend
8. **T-11** — Integrar painel na página do relatório
9. **T-06 + T-07 + T-12** (paralelo) — Engine tests + Controller tests + Component tests
10. **T-13 + T-14 + T-15** (paralelo) — Suite backend + Lint/build frontend + Grep AI
11. **T-16** — Validação manual
12. **T-17** — Run report

---

## Próximo Passo

Executar `/speckit-checklist` para gerar o checklist de QA manual do Bloco 18.
