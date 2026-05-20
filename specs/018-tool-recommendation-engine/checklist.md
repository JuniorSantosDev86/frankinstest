# Checklist de QA — Tool Recommendation Engine — Bloco 18

**Branch**: `018-tool-recommendation-engine` | **Date**: 2026-05-20
**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md) | **Tasks**: [tasks.md](tasks.md)

Marcar cada item com `[x]` ao validar. Itens com `[!]` são bloqueantes — o bloco não pode ser considerado pronto enquanto não estiverem resolvidos.

---

## 1. Escopo do Bloco

- [ ] O módulo `toolrecommendation/` existe em `services/api/src/main/java/com/frankintest/api/toolrecommendation/` com exatamente 4 arquivos: `ToolRecommendationModels.java`, `ToolRecommendationEngine.java`, `ToolRecommendationService.java`, `ToolRecommendationController.java`.
- [ ] Nenhum arquivo fora de `toolrecommendation/` foi criado ou modificado no backend, exceto `SecurityConfig` se necessário para registrar a nova rota.
- [ ] Nenhuma nova tabela foi criada no banco de dados.
- [ ] Nenhuma migration Flyway/Liquibase foi adicionada.
- [ ] Nenhuma nova rota de frontend foi criada (sem novo `page.tsx` em nova pasta).
- [ ] `ToolRecommendationPanel.tsx` está em `apps/web/src/app/checkup/[runId]/` — não em uma nova pasta de rota.
- [ ] `toolRecommendationsApi.ts` e `toolRecommendationsTypes.ts` estão em `apps/web/src/lib/toolrecommendations/`.
- [ ] Nenhum runner, worker ou job de background foi criado.
- [ ] Nenhum código executa k6, JMeter ou qualquer ferramenta de carga real.
- [ ] Nenhuma URL externa de target foi acessada pelo backend.

---

## 2. Backend — Models

- [ ] `ToolRecommendationModels.java` contém: `ToolCategory`, `ToolPriority`, `RecommendedTool`, `ToolRecommendationCategory`, `ToolRecommendationResult`, `WorkspaceArtifactSaveResponse`.
- [ ] `ReportNotFoundException` e `ReportNotReadyException` estão definidas (como inner classes ou no models).
- [ ] `ToolRecommendationResult` tem campos: `reportId (String)`, `generatedAt (Instant)`, `categories (List<ToolRecommendationCategory>)`.
- [ ] `RecommendedTool` tem campo `url` com documentação oficial (não URL de target do usuário).
- [ ] `WorkspaceArtifactSaveResponse` tem campos: `artifactId`, `artifactType`, `title`, `status`, `createdAt`.

---

## 3. Backend — Engine determinístico

- [ ] `ToolRecommendationEngine` não tem dependência de `AiProviderPort`, `AnthropicAiProvider` nem `MockAiProvider`.
- [ ] `ToolRecommendationEngine` não faz I/O (sem JdbcTemplate, sem HTTP client, sem acesso a arquivo).
- [ ] O método `compute(CheckupReport)` inspeciona `qualityRisks` E `suggestedTestScenarios` (ambos os campos).
- [ ] A inspeção é case-insensitive (lowercase antes de comparar).
- [ ] k6 é PRIMARY por padrão quando keywords de performance detectadas sem keywords enterprise.
- [ ] JMeter é promovido a PRIMARY quando qualquer keyword enterprise/Java/legado detectada.
- [ ] Quando nenhuma keyword de performance detectada, `categories` retorna vazia (sem PERFORMANCE genérica sem sinal).
- [ ] `justification` e `nextSteps` estão em pt-BR.
- [ ] `nextSteps` inclui pelo menos: instalar ferramenta, criar script base, definir cenário de carga, definir threshold de aprovação/reprovação.
- [!] `ToolRecommendationEngine` não executa k6, JMeter, curl, wget nem qualquer chamada de rede.

---

## 4. Backend — Service

- [ ] `ToolRecommendationService.generate()` chama `CheckupRepository.findById(reportId)` (não `findByIdAndOrg` — validação de org é inline no service).
- [ ] Se `findById` retornar vazio → lança `ReportNotFoundException` (404).
- [!] Se `report.organizationId()` não for igual ao `organizationId` recebido → lança `ReportNotFoundException` (404, nunca 403 neste caso — não revela existência cross-org).
- [ ] Se `report.status()` não for `DRAFT` nem `REVIEWED` → lança `ReportNotReadyException` (422).
- [ ] `generate()` não persiste nada — apenas computa e retorna.
- [ ] `save()` chama `generate()` internamente (dados frescos do banco, não cache do cliente).
- [ ] `save()` cria `WorkspaceArtifactRow` com `artifactType = "QA_ACTION"`.
- [ ] `save()` define `aiAssisted = false`.
- [ ] `save()` define `sourceCheckupReportId = reportId`.
- [ ] `save()` define `sourceSection = "tool-recommendations"`.
- [ ] `save()` define `sourceItemIndex = 0`.
- [ ] `save()` define `status = "DRAFT"`.
- [ ] `save()` gera `id = UUID.randomUUID()` a cada chamada — dois saves do mesmo relatório geram dois UUIDs distintos.
- [ ] O campo `details` contém o JSON serializado do `ToolRecommendationResult` — não nulo, não vazio.
- [ ] `ObjectMapper` usado para serializar `details` é o bean Spring injetado (não instância manual).

---

## 5. Backend — Controller

- [ ] `@RequestMapping("/api/tool-recommendations")` declarado na classe.
- [ ] Endpoint de geração: `POST /{reportId}` (sem sufixo `/save` ou `/generate` na URL de geração).
- [ ] Endpoint de save: `POST /{reportId}/save`.
- [ ] Ambos os endpoints têm `@AuthenticationPrincipal AuthenticatedPrincipal principal`.
- [ ] Ambos os endpoints têm `@RequestHeader(value = "X-Organization-Id", required = false) String organizationId`.
- [ ] `workspaceAccessService.requireOrgAccess(principal, organizationId)` é chamado antes de qualquer operação de negócio em ambos os endpoints.
- [ ] `MissingOrgHeaderException` e `AccessDeniedException` → 403.
- [ ] `ReportNotFoundException` → 404 com `{"message": "Relatório não encontrado."}`.
- [ ] `ReportNotReadyException` → 422 com `{"message": "Relatório ainda não está concluído."}`.
- [ ] Exception genérica → 500.
- [ ] Endpoint de geração retorna `200 OK`.
- [ ] Endpoint de save retorna `201 Created`.
- [ ] Controller não contém lógica de negócio — apenas delega para o service.
- [ ] Nenhum endpoint existente de checkup, conversion, workspace/artifacts ou drift foi alterado.

---

## 6. Segurança e autorização

- [!] Requisição sem JWT → 401 em ambos os endpoints.
- [!] Requisição com `X-Organization-Id` ausente → 403 em ambos os endpoints.
- [!] Requisição com `X-Organization-Id` de org diferente da do relatório → 404 (não 403, não revela existência).
- [!] `reportId` de relatório inexistente → 404.
- [ ] Rate limiting existente (via `RateLimitFilter`) aplica-se automaticamente — nenhuma alteração no filtro.
- [ ] CORS existente aplica-se — nenhuma alteração em `CorsConfig`.
- [ ] Nenhum secret novo foi adicionado ao código fonte ou ao frontend.
- [ ] O frontend não envia o conteúdo do relatório no body — body é vazio em ambas as chamadas.

---

## 7. Garantia de zero AI provider (SC-005)

- [!] Executar e confirmar saída `OK`:
  ```bash
  grep -r "AnthropicAiProvider\|AiProviderPort\|MockAiProvider\|openai\|anthropic" \
    services/api/src/main/java/com/frankintest/api/toolrecommendation/ \
    && echo "FALHOU — AI provider encontrado" \
    || echo "OK — zero chamadas a AI provider"
  ```
- [!] Nenhuma classe de `toolrecommendation/` importa pacote `com.frankintest.api.ai.*`.
- [ ] Nenhuma chamada a API de LLM, embedding ou similares no módulo novo.
- [ ] Nenhum campo de `AiRun`, `aiRunId` ou crédito é criado ou consumido neste bloco.

---

## 8. Garantia de zero execução real de k6/JMeter

- [!] Nenhuma chamada a `ProcessBuilder`, `Runtime.exec()` ou similar no módulo `toolrecommendation/`.
- [!] Nenhum `kubectl`, `docker run`, `k6 run`, `jmeter -n` ou equivalente no módulo.
- [ ] `nextSteps` contém instruções textuais em pt-BR para o usuário executar — não código que executa automaticamente.
- [ ] URLs de documentação (`k6.io/docs`, `jmeter.apache.org`) estão hardcoded como strings estáticas — não são acessadas em runtime.

---

## 9. Persistência correta como QA_ACTION

- [ ] O artefato salvo é do tipo `QA_ACTION` — verificar coluna `artifact_type` na tabela `workspace_artifacts`.
- [ ] Status inicial do artefato salvo é `DRAFT`.
- [ ] `ai_assisted = false` no banco.
- [ ] `source_checkup_report_id` corresponde ao `reportId` usado na chamada.
- [ ] `source_section = 'tool-recommendations'` no banco.
- [ ] `details` é JSON válido e não nulo — contém `reportId`, `generatedAt`, `categories`.
- [ ] Dois saves do mesmo `reportId` geram dois registros distintos com UUIDs diferentes na tabela.
- [ ] O artefato salvo aparece na listagem de `/workspace/artifacts` com tipo `QA_ACTION`.
- [ ] O artefato salvo pode ser aberto no painel de detalhes de artefatos (Bloco 14) sem erros.
- [ ] Nenhuma foreign key ou constraint nova foi adicionada que possa quebrar o save.

---

## 10. Uso correto de reportId vs aiRunId no frontend

- [!] `ToolRecommendationPanel` recebe prop `reportId: string` — não `runId`, não `aiRunId`.
- [!] A página `[runId]/page.tsx` passa `reportId={reportId}` onde `reportId` é `status?.report?.id ?? null`.
- [!] O painel não renderiza quando `reportId` é nulo — sem chamada ao backend com `undefined` ou `null`.
- [ ] As funções `generateRecommendations(reportId)` e `saveRecommendationAsArtifact(reportId)` recebem e usam o `reportId` real do relatório — não o `runId` da URL.
- [ ] A URL das chamadas de API tem o formato `/api/tool-recommendations/<reportId>` — verificar no DevTools que o UUID na URL é o `report.id`, não o `aiRunId`.
- [ ] TypeScript não apresenta erros de tipo na prop `reportId: string` — `npm run build` passa sem erros.

---

## 11. Frontend — Comportamento por estado

- [ ] Estado `idle`: botão "Gerar recomendações de ferramentas" visível e habilitado. Nenhuma chamada ao backend ocorreu.
- [ ] Estado `loading`: indicador de carregamento visível. Botão desabilitado. Nenhuma chamada dupla ao clicar.
- [ ] Estado `loaded`: categorias, ferramentas (nome, prioridade em pt-BR, rationale, link) e próximos passos numerados visíveis.
- [ ] Estado `loaded`: botão "Salvar como artefato" visível e habilitado.
- [ ] Estado `saving`: botão "Salvando..." desabilitado. Nenhum double-submit.
- [ ] Estado `saved`: confirmação "Artefato salvo no Workspace." visível. Link para `/workspace/artifacts` presente.
- [ ] Estado `error` (geração): mensagem "Erro ao gerar recomendações. Tente novamente." visível. Restante da página intacto — nenhum componente vizinho quebrou.
- [ ] Estado `error` (save): mensagem "Erro ao salvar artefato. Tente novamente." visível. Resultado ainda visível.
- [ ] Nenhuma chamada ao backend ocorre ao montar o componente (sem `useEffect` que dispara a geração automaticamente).

---

## 12. Frontend — UI em pt-BR

- [ ] Título da seção: "Recomendações de ferramentas" (pt-BR).
- [ ] Botão de geração: "Gerar recomendações de ferramentas" (pt-BR).
- [ ] Botão de save: "Salvar como artefato" (pt-BR).
- [ ] Loading: "Carregando recomendações..." (pt-BR).
- [ ] Save em andamento: "Salvando..." (pt-BR).
- [ ] Confirmação de save: "Artefato salvo no Workspace." (pt-BR).
- [ ] Erro de geração: "Erro ao gerar recomendações. Tente novamente." (pt-BR).
- [ ] Erro de save: "Erro ao salvar artefato. Tente novamente." (pt-BR).
- [ ] Badge de prioridade PRIMARY: "Principal" (pt-BR, não "Primary").
- [ ] Badge de prioridade SECONDARY: "Alternativa" (pt-BR, não "Secondary").
- [ ] Nenhum texto em inglês ou espanhol adicionado à UI.
- [ ] `categoryLabel` exibido em pt-BR — ex.: "Testes de Performance" (vindo do backend).
- [ ] `justification` e itens de `nextSteps` exibidos em pt-BR (vindo do backend).

---

## 13. Testes backend

- [ ] `ToolRecommendationEngineTest` existe com os 10 casos de teste mínimos definidos em T-06.
- [ ] `ToolRecommendationControllerTest` existe com os 10 casos de teste mínimos definidos em T-07.
- [ ] Ambos os testes passam: `(cd services/api && ./mvnw test -Dtest="ToolRecommendation*" -q)`.
- [ ] Suite completa de testes backend passa sem regressões: `(cd services/api && ./mvnw test -q)`.
- [ ] Nenhum teste existente de checkup, conversion, workspace ou drift quebrou.
- [ ] `ToolRecommendationControllerTest` estende `BaseIntegrationTest` (sem configuração de banco duplicada).
- [ ] O teste de save verifica que dois saves geram dois artefatos distintos (UUIDs diferentes no banco).
- [ ] O teste de save verifica que `details` não é nulo e contém JSON válido.

---

## 14. Validação final de build e lint

- [ ] Backend compila sem warnings de compilação: `(cd services/api && ./mvnw compile -q)`.
- [ ] Frontend instala sem erros: `(cd apps/web && npm install --silent)`.
- [ ] Lint do frontend passa: `(cd apps/web && npm run lint)`.
- [ ] Build do frontend passa sem erros de tipo TypeScript: `(cd apps/web && npm run build)`.
- [ ] Zero erros de tipo em `toolRecommendationsTypes.ts`, `toolRecommendationsApi.ts`, `ToolRecommendationPanel.tsx`.
- [ ] TypeScript verifica que `reportId: string` é passado corretamente do `page.tsx` para `ToolRecommendationPanel`.

---

## 15. Critérios de aceite da spec (Success Criteria)

- [!] **SC-001**: Endpoint de geração responde em < 300ms para relatório existente. Verificar nos logs do Spring ou via `curl -w "%{time_total}"`.
- [!] **SC-002**: Categoria PERFORMANCE presente quando `qualityRisks` ou `suggestedTestScenarios` contêm keywords de performance; ausente quando não contêm.
- [!] **SC-003**: Artefato salvo via `/save` aparece em `GET /api/workspace/artifacts?artifactType=QA_ACTION` com tipo `QA_ACTION`.
- [!] **SC-004**: 401/403/404 retornados corretamente em 100% dos cenários de auth — validados pelos testes de integração.
- [!] **SC-005**: `grep -r "AnthropicAiProvider\|AiProviderPort" services/api/src/main/java/com/frankintest/api/toolrecommendation/` → sem resultado.
- [!] **SC-006**: `(cd services/api && ./mvnw test -q)` → zero falhas; `(cd apps/web && npm run lint && npm run build)` → zero erros.
- [!] **SC-007**: Testes existentes de checkup, conversion, workspace e drift continuam passando — nenhuma regressão.

---

## 16. Validação manual do fluxo completo

Executar com ambiente local rodando (Docker Compose + backend + frontend).

- [ ] Backend sobe sem erros no log de startup.
- [ ] `POST /api/tool-recommendations/{reportId}` com relatório com riscos de performance retorna 200 com `categories[0].categoryCode = "PERFORMANCE"`.
- [ ] `POST /api/tool-recommendations/{reportId}` com relatório sem riscos de performance retorna 200 com `categories` vazia.
- [ ] `POST /api/tool-recommendations/{reportId}/save` retorna 201 com `artifactType = "QA_ACTION"`.
- [ ] Segundo `POST /api/tool-recommendations/{reportId}/save` para o mesmo relatório retorna 201 com UUID diferente.
- [ ] Artefato aparece em `GET /api/workspace/artifacts?artifactType=QA_ACTION` (via curl ou Workspace UI).
- [ ] Navegar para `/checkup/{runId}` de um relatório concluído → painel "Recomendações de ferramentas" visível com CTA.
- [ ] Clicar em "Gerar recomendações de ferramentas" → categorias e ferramentas aparecem em pt-BR.
- [ ] Clicar em "Salvar como artefato" → confirmação "Artefato salvo no Workspace." aparece.
- [ ] Navegar para `/workspace/artifacts` → artefato `QA_ACTION` do bloco 18 visível na lista.
- [ ] Abrir o artefato no painel de detalhes → campos de rastreabilidade (`sourceCheckupReportId`, `sourceSection = "tool-recommendations"`) visíveis e corretos.
- [ ] Navegar para `/checkup/{runId}` de relatório em processamento (sem `report.id`) → painel de recomendações não renderiza.
- [ ] Recarregar a página do relatório concluído → painel exibe estado `idle` (sem recomendações pré-carregadas — nenhuma chamada automática).
- [ ] Fluxos existentes de Check-up (estimar → executar → relatório → converter) funcionam sem alteração.
- [ ] Fluxo de Drift (painel de drift no relatório) funciona sem alteração.

---

## Inconsistências encontradas durante a geração deste checklist

| # | Localização | Descrição | Severidade |
|---|-------------|-----------|------------|
| 1 | `tasks.md` T-13, T-14 | Comandos usam `cd bare` sem subshell (`cd services/api && ./mvnw test`), inconsistente com a correção aplicada em T-01. Não bloqueante — comportamento é equivalente dentro do mesmo shell — mas inconsistente com o padrão adotado. | Baixa |

> Aguardar instrução do usuário para corrigir ou aceitar como está.
