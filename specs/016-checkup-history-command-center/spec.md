# Feature Specification: Check-up History & Project Command Center

**Feature Branch**: `012-checkup-history-command-center`

**Created**: 2026-05-19

**Status**: Draft

**Input**: User description: "Bloco 16 — Check-up History & Project Command Center"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Acessar histórico de Check-ups (Priority: P1)

Um usuário que já realizou um ou mais Check-ups precisa encontrar análises anteriores sem precisar guardar o link direto de cada relatório. Ele acessa a área "Histórico de Check-ups" da organização e vê uma lista ordenada de execuções anteriores com informações suficientes para identificar cada análise.

**Why this priority**: Sem histórico, o produto é inutilizável após a primeira sessão. Toda a proposta de valor do Check-up recorrente depende de poder retomar trabalhos anteriores.

**Independent Test**: Pode ser testado criando dois Check-ups via API e verificando que ambos aparecem listados na tela de histórico com os campos corretos (alvo, profundidade, status, data, créditos).

**Acceptance Scenarios**:

1. **Given** um usuário autenticado com pelo menos um Check-up concluído na organização, **When** acessa a tela "Histórico de Check-ups", **Then** vê uma lista com pelo menos uma entrada exibindo: URL/alvo, profundidade, status, data de criação e créditos consumidos.
2. **Given** um usuário autenticado sem nenhum Check-up na organização, **When** acessa a tela "Histórico de Check-ups", **Then** vê um estado vazio com instrução clara de como iniciar o primeiro Check-up.
3. **Given** um usuário autenticado em organização A, **When** acessa o histórico, **Then** não vê Check-ups pertencentes à organização B.
4. **Given** a lista de histórico, **When** carrega, **Then** os itens são exibidos em ordem cronológica decrescente (mais recente primeiro).

---

### User Story 2 - Reabrir relatório de Check-up concluído (Priority: P1)

Um usuário que já finalizou um Check-up quer rever o relatório completo clicando diretamente na entrada do histórico, sem precisar copiar ou lembrar o runId.

**Why this priority**: O relatório é o principal entregável do Check-up. Sem poder reabri-lo facilmente, o histórico perde grande parte do seu valor.

**Independent Test**: Pode ser testado clicando em um item com status "Concluído" na lista e verificando que o relatório completo é exibido corretamente.

**Acceptance Scenarios**:

1. **Given** um Check-up com status "Concluído" na lista, **When** o usuário clica nele, **Then** é levado para a página do relatório daquela execução específica.
2. **Given** um Check-up com status "Em andamento" ou "Falhou" na lista, **When** o usuário visualiza o item, **Then** o botão de abrir relatório está desabilitado ou ausente, e o status é exibido de forma clara.
3. **Given** a página de relatório aberta a partir do histórico, **When** o usuário navega, **Then** todos os links de artefatos e rastreabilidade continuam funcionando normalmente.

---

### User Story 3 - Visualizar artefatos gerados por cada Check-up (Priority: P2)

Um usuário quer saber quantos e quais tipos de artefatos de Workspace foram criados a partir de cada Check-up sem precisar navegar para o Workspace.

**Why this priority**: Aumenta a percepção de valor de cada Check-up ao mostrar o trabalho gerado. Depende do histórico básico (P1) estar funcionando.

**Independent Test**: Pode ser testado verificando que, para um Check-up que gerou artefatos, o contador e o breakdown por tipo aparecem corretamente na linha do histórico.

**Acceptance Scenarios**:

1. **Given** um Check-up concluído que originou artefatos de Workspace, **When** o usuário vê esse item no histórico, **Then** vê um indicador com a contagem total de artefatos gerados (ex.: "3 artefatos criados").
2. **Given** um Check-up concluído que não originou artefatos, **When** o usuário vê esse item no histórico, **Then** o campo de artefatos mostra "Nenhum artefato criado" ou fica vazio sem causar erro.
3. **Given** um Check-up com status diferente de "Concluído", **When** o usuário vê esse item no histórico, **Then** o campo de artefatos mostra "—" ou equivalente, sem contagem.

---

### User Story 4 - Acessar o Command Center do projeto (Priority: P2)

Um usuário quer ter uma visão consolidada da atividade recente do projeto — Check-ups recentes e artefatos criados — sem navegar por múltiplas telas. O Command Center fica no topo da página de histórico de Check-ups (rota `/checkup/history`), acima da lista completa de execuções anteriores. A navegação principal expõe um link claro "Histórico de Check-ups" para essa página. O Command Center não substitui a homepage/dashboard principal neste bloco.

**Why this priority**: O Command Center eleva a percepção profissional do produto e facilita a retomada de trabalho. Depende do histórico de Check-ups (P1) como fonte de dados. O posicionamento no topo da mesma página mantém o escopo controlado e pode evoluir para virar a homepage corporativa em bloco futuro.

**Independent Test**: Pode ser testado verificando que a rota `/checkup/history` renderiza: (1) o bloco de Command Center com resumo numérico no topo e (2) a lista de histórico abaixo, sem erros e sem chamadas ao provedor de IA.

**Acceptance Scenarios**:

1. **Given** um usuário autenticado com atividade recente na organização, **When** acessa `/checkup/history`, **Then** vê no topo o Command Center com contadores separados: total de Check-ups, concluídos, em andamento, falhos, créditos consumidos no total (acumulado histórico) e total de artefatos gerados. Abaixo, a lista completa de execuções.
2. **Given** um usuário sem atividade anterior, **When** acessa a página de histórico de Check-ups, **Then** tanto o Command Center quanto a lista exibem estados vazios informativos com CTAs claros para iniciar o primeiro Check-up.
3. **Given** o Command Center carregado, **When** o usuário clica em um Check-up recente no resumo, **Then** a página rola (ou navega) para o item correspondente na lista de histórico abaixo, ou abre o relatório se o status for "Concluído".
4. **Given** o usuário está em qualquer tela do produto autenticado, **When** acessa o menu de navegação principal, **Then** encontra um link "Histórico de Check-ups" que leva à página com Command Center + lista.

---

### Edge Cases

- O que acontece quando um Check-up fica preso em "Em andamento" por muito tempo (timeout ou falha silenciosa)? O status é exibido como "Em andamento" sem bloquear o usuário de ver outros itens. O usuário pode clicar no botão "Atualizar" para buscar o estado mais recente.
- O que acontece quando o backend retorna erro ao listar o histórico? O frontend exibe mensagem de erro em pt-BR com opção de tentar novamente.
- O que acontece quando a lista tem muitos itens (paginação)? A lista deve exibir os mais recentes primeiro; paginação simples ou scroll infinito são aceitáveis para o MVP.
- O que acontece quando um Check-up foi criado mas o relatório foi deletado ou corrompido? O item permanece no histórico com status de erro; a abertura do relatório mostra mensagem de indisponibilidade.
- O que acontece quando o `X-Organization-Id` não está presente ou é inválido? O backend rejeita com 401/403 e o frontend exibe erro de sessão.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Sistema DEVE expor endpoint `GET /api/checkup/runs` que retorna a lista paginada de Check-ups da organização corrente, ordenados por `createdAt` decrescente. Campos obrigatórios por item: `aiRunId`, `reportId` (quando disponível), `status`, `targetType`, `targetValue`, `depth`, `estimatedCredits`, `consumedCredits`, `createdAt`, `completedAt` (quando disponível) e `artifactCount` (calculado via `COUNT` em `workspace_artifacts` onde `source_ai_run_id = ai_runs.id`, respeitando `organizationId`; retorna `0` quando não há artefatos vinculados; sem campo desnormalizado na tabela). Requer JWT e `X-Organization-Id`. Filtrado por `organizationId` no backend. Não chama provedor de IA.
- **FR-002**: Sistema DEVE expor endpoint `GET /api/checkup/runs/summary` que retorna os seguintes contadores separados para a organização: `totalRuns` (total de Check-ups), `completedRuns` (concluídos), `runningRuns` (em andamento), `failedRuns` (falhos), `totalConsumedCredits` (soma acumulada histórica de `consumedCredits`, sem filtro de período) e `totalArtifacts` (total de artefatos gerados). Requer JWT e `X-Organization-Id`. Filtrado por `organizationId` no backend. O frontend pode chamar `GET /api/checkup/runs` e `GET /api/checkup/runs/summary` em paralelo. O endpoint existente `GET /api/checkup/runs/{aiRunId}` NÃO deve ser alterado.
- **FR-003**: Sistema DEVE exibir para cada Check-up na lista: alvo (`targetType` + `targetValue`), profundidade, status (Em andamento / Concluído / Falhou), data de criação, créditos estimados, créditos consumidos e `artifactCount` conforme definido em FR-001.
- **FR-004**: Usuários DEVEM poder abrir o relatório completo de qualquer Check-up com status "Concluído" diretamente da lista de histórico.
- **FR-005**: Sistema DEVE impedir que Check-ups de outras organizações sejam exibidos ou acessados, validando o `X-Organization-Id` no backend.
- **FR-006**: Sistema DEVE exibir estados vazios informativos em pt-BR quando não houver Check-ups ou artefatos.
- **FR-007**: Sistema DEVE exibir erros de carregamento em pt-BR com botão "Tentar novamente" tanto na lista de histórico quanto no bloco do Command Center. Os rótulos dos estados de erro DEVEM ser consistentes entre os dois componentes.
- **FR-008**: Sistema DEVE oferecer um Command Center posicionado no topo da página `/checkup/history`, exibindo os seguintes contadores separados: total de Check-ups, concluídos, em andamento, falhos, créditos consumidos no total (acumulado histórico sem filtro de período, rótulo: "Créditos consumidos no total") e total de artefatos gerados. A lista de histórico completa ocupa a área abaixo na mesma página. A navegação principal DEVE expor link "Histórico de Check-ups" apontando para `/checkup/history`. O Command Center NÃO substitui a homepage/dashboard principal neste bloco.
- **FR-009**: Sistema DEVE representar claramente os status "Em andamento" e "Falhou" sem permitir abertura de relatório nesses estados.
- **FR-010**: Sistema DEVE preservar as fronteiras de responsabilidade do FrankInTest: UX em `apps/web`; regras de negócio, persistência, permissões, créditos, orquestração de IA, logs de auditoria, integrações e decisões de segurança em `services/api`.
- **FR-011**: Nenhum endpoint novo de histórico ou Command Center DEVE realizar chamadas ao provedor de IA.
- **FR-012**: Nenhuma lógica de créditos deve ser alterada por esta funcionalidade.
- **FR-013**: Todo texto novo na UI DEVE estar em português brasileiro (pt-BR).
- **FR-014**: Sistema DEVE aplicar paginação por offset/limit no endpoint `GET /api/checkup/runs` com parâmetros `page` (default 0) e `size` (default 20, máximo 50).
- **FR-015**: A página `/checkup/history` NÃO DEVE implementar polling automático neste bloco. Um botão "Atualizar" no topo da página DEVE recarregar tanto a lista de histórico quanto o resumo do Command Center. Não há botão de refresh por item. Polling/tempo real é pós-MVP.

### Key Entities

- **CheckupRun**: Representa uma execução de Check-up. Atributos relevantes para o histórico: id, organizationId, targetUrl, depth, status (PENDING / RUNNING / COMPLETED / FAILED), estimatedCredits, consumedCredits, createdAt, completedAt, reportId.
- **CheckupReport**: Relatório gerado ao final de um Check-up concluído. Referenciado pelo `CheckupRun`.
- **WorkspaceArtifact**: Artefato de Workspace criado a partir de itens do relatório. Possui referência ao `CheckupRun` de origem (via sourceRunId ou equivalente).
- **Organization**: Delimita o escopo de visibilidade. Cada `CheckupRun` pertence a exatamente uma organização.

### QA Artifact Impact

- **Artifacts created/updated**: Nenhum artefato novo é criado por esta feature. Apenas leitura e exibição de artefatos existentes e de runs existentes.
- **AI run tracking**: Não aplicável — nenhuma chamada de IA é realizada.
- **Credit impact**: Sem impacto em créditos — apenas leitura de dados já existentes.
- **Audit events**: Acesso à listagem de histórico e abertura de relatório devem ser registrados como eventos de leitura auditáveis (opcional para MVP, obrigatório antes de produção).
- **Sensitive data handling**: URLs de alvo e relatórios de análise podem conter informações sensíveis do cliente; acesso deve ser restrito à organização proprietária.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Usuários conseguem localizar e abrir um Check-up anterior sem conhecer o runId em menos de 30 segundos a partir da tela principal.
- **SC-002**: A lista de histórico carrega em menos de 2 segundos para organizações com até 100 Check-ups.
- **SC-003**: 100% dos Check-ups exibidos na lista pertencem à organização do usuário autenticado (zero vazamento de dados entre organizações).
- **SC-004**: Check-ups com status "Em andamento" ou "Falhou" nunca permitem abertura de relatório incompleto ou corrompido.
- **SC-005**: O Command Center exibe dados corretos e atualizados sem exigir nenhuma ação adicional do usuário além de navegar para a tela.
- **SC-006**: Todos os fluxos existentes de Check-up (execução, conversão para artefatos, revisão e rastreabilidade) continuam funcionando sem regressão após a implementação.
- **SC-007**: Nenhuma chamada ao provedor de IA é introduzida pelos endpoints de histórico ou Command Center.

## Clarifications

### Session 2026-05-19

- Q: Onde o Command Center vive na navegação do produto? → A: Bloco no topo da página `/checkup/history`. O Command Center exibe contadores separados (total, concluídos, em andamento, falhos, créditos acumulados, artefatos gerados); a lista completa de execuções fica abaixo na mesma página. Um link "Histórico de Check-ups" deve ser adicionado à navegação principal apontando para `/checkup/history`. Não substitui a homepage/dashboard neste bloco. Pode evoluir para homepage corporativa em bloco futuro.
- Q: Como a lista de histórico deve se comportar para Check-ups com status "Em andamento"? → A: Sem auto-refresh. Um botão "Atualizar" no topo da página recarrega a lista e o resumo do Command Center. Status "Em andamento" é exibido claramente sem ação de abertura de relatório. Sem botão de refresh por item. Polling/tempo real é pós-MVP.
- Q: O resumo do Command Center deve incluir créditos consumidos em qual janela de tempo? → A: Total histórico acumulado de todos os Check-ups da organização (soma de `consumedCredits`, sem filtro de período). Rótulo na UI: "Créditos consumidos no total". Filtros por período são pós-MVP.
- Q: O endpoint de listagem do histórico deve ser novo dedicado ou reutilizar existente? → A: Dois endpoints novos e separados: `GET /api/checkup/runs` (lista paginada, campos: aiRunId, reportId, status, targetType, targetValue, depth, estimatedCredits, consumedCredits, createdAt, completedAt, artifactCount) e `GET /api/checkup/runs/summary` (totais: total, concluídos, em andamento, falhos, créditos acumulados, total de artefatos). Ambos exigem JWT e X-Organization-Id, filtrados por org no backend, sem chamada ao provedor de IA. Endpoint `GET /api/checkup/runs/{aiRunId}` não é alterado.
- Q: O campo `artifactCount` na listagem — calculado na query ou desnormalizado? → A: Calculado no backend via `COUNT` em `workspace_artifacts` onde `source_ai_run_id = ai_runs.id`, respeitando `organizationId`. Retorna `0` quando não há artefatos. Sem campo desnormalizado nem incremento manual. Otimizações/materialização são pós-MVP.

## Assumptions

- Usuários autenticados já possuem `organizationId` disponível via JWT e cabeçalho `X-Organization-Id`, sem necessidade de novo mecanismo de autenticação.
- O modelo de dados de `CheckupRun` já possui os campos necessários (status, créditos, createdAt) ou pode ser estendido com migração simples.
- A relação entre `CheckupRun` e `WorkspaceArtifact` já existe ou pode ser derivada de campo existente (ex.: `sourceRunId`) sem redesign do modelo.
- A listagem de histórico é scoped por organização; escopo por projeto específico é desejável mas não obrigatório para o MVP.
- Paginação simples com limite fixo (ex.: 20 itens por página) é suficiente para o MVP; scroll infinito é opcional.
- O Command Center não implementa analytics avançados nem gráficos de tendência — apenas resumo textual/numérico recente.
- Mobile responsiveness é esperado mas não é o foco principal desta iteração; o layout deve funcionar em telas de tablet e desktop.
- A feature não altera o fluxo de execução de Check-up nem os endpoints existentes de relatório — apenas adiciona endpoints de leitura e telas de listagem.
