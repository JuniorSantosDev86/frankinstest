# Feature Specification: Tool Recommendation Engine — Bloco 18

**Feature Branch**: `018-tool-recommendation-engine`

**Created**: 2026-05-20

**Status**: Draft

**Input**: Bloco 18 — Tool Recommendation Engine (primeira vertical: Performance Planning Guidance com k6/JMeter)

---

## Contexto e Motivação

O FrankInTest Workspace deve orientar o QA Lead sobre quais ferramentas usar, como estruturar os testes e quais próximos passos tomar, com base no perfil do projeto analisado pelo Check-up. O Bloco 18 cria a fundação desta recomendação.

A primeira vertical entregue é **Performance Planning Guidance**: dado o contexto de um relatório de Check-up, o sistema recomenda ferramentas de performance (k6, JMeter), estratégia de teste de carga, métricas-alvo e próximos passos práticos — tudo como artefato estruturado de QA, sem executar runners reais.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Gerar recomendação de ferramentas de QA a partir de um relatório de Check-up (Priority: P1)

Um QA Lead acessa um relatório de Check-up concluído e solicita recomendações de ferramentas de QA. O sistema analisa o contexto do relatório (tipo de alvo, riscos, cenários sugeridos) e retorna um artefato estruturado com recomendações por categoria, justificativa e próximos passos.

**Why this priority**: É o núcleo do bloco. Sem ele não há entrega de valor.

**Independent Test**: Criar um relatório de Check-up com `targetType = FEATURE_DESCRIPTION` e solicitar recomendações via endpoint. A resposta deve conter ao menos uma categoria de ferramenta com justificativa em pt-BR.

**Acceptance Scenarios**:

1. **Given** o usuário autenticado tem um relatório de Check-up concluído, **When** solicita recomendações de ferramentas, **Then** o backend retorna um `ToolRecommendationResult` com categorias, ferramentas recomendadas, justificativa e próximos passos em pt-BR.
2. **Given** o relatório tem `qualityRisks` ou `suggestedTestScenarios` não vazios, **When** o sistema analisa o contexto, **Then** a categoria de performance é incluída nas recomendações quando pertinente ao tipo de alvo.
3. **Given** o `ToolRecommendationResult` é gerado, **When** o usuário decide salvar, **Then** o artefato é persistido como `WorkspaceArtifact` do tipo `QA_ACTION` com o conteúdo estruturado em `details`.
4. **Given** o relatório pertence a outra organização, **When** o usuário tenta gerar recomendações, **Then** o backend retorna 404.
5. **Given** o relatório não existe, **When** o usuário tenta gerar recomendações, **Then** o backend retorna 404.

---

### User Story 2 — Recomendação específica de Performance Planning com k6/JMeter (Priority: P1)

Quando o contexto do projeto indica riscos de performance ou cenários de carga, o sistema gera um plano de testes de performance estruturado recomendando k6 ou JMeter como ferramenta, estratégia de teste, métricas-alvo e próximos passos práticos. Nenhum runner é executado.

**Why this priority**: É a primeira vertical concreta do Tool Recommendation Engine e entrega valor imediato para QA Leads que precisam planejar testes de performance.

**Independent Test**: Solicitar recomendação para um relatório com `qualityRisks` contendo termos como "performance", "latência" ou "carga". A resposta deve incluir categoria `PERFORMANCE` com k6 ou JMeter como ferramenta recomendada.

**Acceptance Scenarios**:

1. **Given** o contexto do relatório indica riscos de performance, **When** o sistema gera recomendações, **Then** a categoria `PERFORMANCE` aparece com ferramenta recomendada (k6 ou JMeter), cenários sugeridos, métricas-alvo (latência p95, RPS, taxa de erro) e próximos passos em pt-BR.
2. **Given** o relatório não apresenta sinais de risco de performance, **When** o sistema gera recomendações, **Then** a categoria `PERFORMANCE` está ausente — o endpoint retorna 200 com `categories` vazia.
3. **Given** a recomendação de performance é gerada, **When** o usuário revisa, **Then** cada próximo passo é acionável: instalar k6/JMeter, criar script base, definir cenário de carga, estabelecer threshold de aprovação/reprovação.

---

### User Story 3 — Exibir recomendações na UI do Workspace (Priority: P2)

O frontend exibe as recomendações geradas como uma **seção adicional na página existente do relatório de Check-up**, sem criar nova rota. O fluxo é: usuário abre o relatório → lê os achados → vê a seção "Recomendações de ferramentas" → clica em "Gerar recomendações de ferramentas" → revisa → decide se salva como artefato `QA_ACTION`. Uma rota dedicada é escopo pós-MVP, se o módulo evoluir.

**Why this priority**: Sem UI o valor fica inacessível ao usuário final; P2 porque backend/modelo vêm primeiro.

**Independent Test**: Acessar a página de relatório de Check-up com recomendações geradas → o painel de recomendações exibe categorias, ferramentas e próximos passos em pt-BR, com botão para salvar como artefato.

**Acceptance Scenarios**:

1. **Given** o usuário acessa a página de um relatório sem recomendações geradas, **When** o painel é exibido, **Then** aparece vazio com botão de ação explícita "Gerar recomendações de ferramentas" em destaque — nenhuma chamada ao backend é feita automaticamente.
2. **Given** recomendações foram geradas para um relatório, **When** o usuário acessa a página do relatório, **Then** o painel de recomendações exibe as categorias, ferramentas e próximos passos.
3. **Given** o usuário clica em "Salvar como artefato", **When** a operação é concluída, **Then** o artefato aparece na lista de artefatos do Workspace com tipo `QA_ACTION`.
4. **Given** a chamada de geração falha, **When** o frontend recebe erro, **Then** exibe mensagem discreta em pt-BR sem quebrar o restante da página.

---

### Edge Cases

- O que acontece se o contexto do relatório não for suficiente para recomendar nenhuma ferramenta? → O endpoint retorna 200 com `categories` vazia. Neste bloco só existe a categoria `PERFORMANCE`; sem keywords de performance detectadas, não há categoria a recomendar. Recomendações para outros tipos de risco são escopo pós-MVP.
- O que acontece se o usuário tentar gerar recomendações para um relatório ainda em processamento (`status != DRAFT` completo)? → O backend verifica o status; relatórios não concluídos retornam 422 com mensagem em pt-BR.
- O que acontece se o usuário gerar recomendações múltiplas vezes para o mesmo relatório? → Cada geração retorna um novo resultado computado; não há persistência automática (salvar é ação explícita do usuário).

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE oferecer endpoint `POST /api/tool-recommendations/{reportId}` que busca o relatório internamente no banco pelo `reportId`, valida JWT, `X-Organization-Id`, pertencimento à organização e status do relatório, e retorna um `ToolRecommendationResult` estruturado. O body da requisição é vazio neste bloco — o frontend NÃO envia o conteúdo do relatório. A recomendação é sempre calculada a partir dos dados reais persistidos no backend. Zero chamadas a AI provider — lógica determinística.
- **FR-002**: O `ToolRecommendationResult` DEVE conter: `reportId`, lista de `ToolRecommendationCategory` (nome, descrição, ferramentas recomendadas, justificativa, próximos passos) em pt-BR.
- **FR-003**: A categoria `PERFORMANCE` DEVE recomendar k6 como PRIMARY por padrão e JMeter como SECONDARY. JMeter é promovido para PRIMARY quando o relatório indica contexto enterprise, stack Java/legado, necessidade de carga distribuída, cenários de múltiplos protocolos ou ambientes corporativos tradicionais. A regra de escolha é determinística (sem AI) baseada em palavras-chave nos campos `qualityRisks`, `suggestedTestScenarios` e `targetType` do relatório. A justificativa gerada DEVE explicar o critério aplicado em pt-BR.
- **FR-004**: O sistema DEVE oferecer endpoint `POST /api/tool-recommendations/{reportId}/save` que SEMPRE cria um novo `WorkspaceArtifact` do tipo `QA_ACTION` a cada chamada — nunca sobrescreve artefatos anteriores. O campo `details` contém o `ToolRecommendationResult` serializado. Múltiplos salvamentos para o mesmo `reportId` geram múltiplos artefatos independentes, cada um com seu próprio `id`, `createdAt` e status inicial `DRAFT`.
- **FR-005**: O backend DEVE validar JWT e `X-Organization-Id` em todos os endpoints; 401 para não autenticado, 403 para org inválida/ausente, 404 para relatório inexistente ou de outra org.
- **FR-006**: Zero chamadas a AI provider (Anthropic, OpenAI ou qualquer outro). A lógica de recomendação é determinística baseada em regras sobre o conteúdo do relatório.
- **FR-007**: Toda UI nova em pt-BR.
- **FR-008**: Os endpoints de Check-up, conversão, revisão de artefatos e drift NÃO DEVEM ser alterados.

### Key Entities

- **ToolRecommendationResult**: Resultado computado de recomendação (não persistido por padrão). Contém `reportId`, lista de `ToolRecommendationCategory`.
- **ToolRecommendationCategory**: Categoria de ferramenta (ex.: PERFORMANCE, WEB_AUTOMATION, API_TESTING). Campos: `categoryCode`, `categoryLabel` (pt-BR), `tools` (lista de `RecommendedTool`), `justification` (pt-BR), `nextSteps` (lista de strings pt-BR).
- **RecommendedTool**: Ferramenta específica recomendada. Campos: `name`, `url` (documentação oficial), `priority` (PRIMARY / SECONDARY), `rationale` (pt-BR).

---

## Success Criteria *(mandatory)*

- **SC-001**: Dado um relatório de Check-up com riscos de qualidade, o endpoint retorna `ToolRecommendationResult` com ao menos uma categoria em < 300ms (cálculo determinístico, sem AI).
- **SC-002**: A categoria PERFORMANCE está presente quando o relatório contém riscos de performance ou cenários de carga; `categories` retorna vazia quando não há nenhuma categoria recomendável no MVP.
- **SC-003**: Artefato salvo via `/save` aparece na listagem de artefatos do Workspace com tipo `QA_ACTION`.
- **SC-004**: 401/403/404 corretos em 100% dos cenários de auth/org/relatório inexistente.
- **SC-005**: Zero chamadas a AI provider — verificado por grep no código novo.
- **SC-006**: Todos os testes backend passam; lint + build do frontend passam.
- **SC-007**: Endpoints existentes de Check-up, conversão, artefatos e drift não regridem.

---

## Clarifications

### Session 2026-05-20

- Q: Critério determinístico para escolha entre k6 (PRIMARY) e JMeter (PRIMARY) na categoria PERFORMANCE → A: k6 = PRIMARY por padrão; JMeter promovido a PRIMARY apenas quando o relatório indica contexto enterprise, stack Java/legado, carga distribuída, múltiplos protocolos ou ambiente corporativo tradicional. Regra baseada em palavras-chave nos campos `qualityRisks`, `suggestedTestScenarios` e `targetType` — sem AI.
- Q: O endpoint POST /api/tool-recommendations/{reportId} busca o contexto no banco ou recebe no body? → A: Backend busca o relatório internamente pelo `reportId`. Body da requisição vazio neste bloco. Frontend nunca envia conteúdo do relatório — evita manipulação e inconsistência. Refinamento manual futuro é fluxo separado e auditável, não sobrescrita silenciosa.
- Q: O endpoint /save sobrescreve artefato QA_ACTION anterior ou sempre cria novo? → A: Sempre cria novo artefato `QA_ACTION` a cada salvamento. Nunca sobrescreve. Múltiplos saves do mesmo `reportId` geram múltiplos artefatos independentes com `id`, `createdAt` e status `DRAFT` próprios — preserva rastreabilidade e evita perda de contexto revisado ou aceito.
- Q: Comportamento da UI quando o relatório ainda não tem recomendações geradas → A: Painel vazio com botão de ação explícita "Gerar recomendações de ferramentas" em destaque. Nenhuma chamada automática ao backend. Mesmo sendo determinístico e sem créditos neste bloco, a geração exige ação explícita do usuário — preparado para custo futuro e alinhado com princípio de ações rastreáveis e compreensíveis.
- Q: Painel de recomendações em seção da página do relatório ou rota própria? → A: Seção adicional na página existente do relatório de Check-up — sem nova rota neste bloco. Mantém contexto junto, reduz complexidade de frontend e mantém o bloco coeso. Rota dedicada é escopo pós-MVP se o módulo crescer.

---

## Assumptions

- Bloco 17 (FrankInDrift) está concluído e na main.
- A tabela `workspace_artifacts` e o endpoint `POST /api/workspace/artifacts` (ou equivalente de conversão) existem e podem ser reutilizados para persistir o artefato salvo.
- A lógica de recomendação neste bloco é determinística — AI assistida é escopo pós-MVP.
- Não há execução real de k6/JMeter; não há criação de runner, worker ou disparo de carga.
- O campo `details` de `WorkspaceArtifact` suporta JSON livre suficientemente grande para o resultado serializado.
