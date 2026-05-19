# Feature Specification: Workspace Artifact Navigation & Traceability Polish

**Feature Branch**: `011-artifact-navigation-traceability`

**Created**: 2026-05-19

**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Navegar do relatório de Check-up para seus artefatos (Priority: P1)

O usuário abriu um relatório de Check-up que já teve itens convertidos em artefatos de Workspace. Ele quer ver todos os artefatos gerados a partir daquele relatório sem precisar ir manualmente para a lista geral de artefatos e filtrar por conta própria.

**Why this priority**: É a jornada central deste bloco. Sem ela, o usuário não consegue perceber que a conversão gerou artefatos rastreáveis; os blocos 13 e 14 ficam invisíveis para o usuário.

**Independent Test**: Pode ser testado abrindo um relatório com artefatos já convertidos e verificando que a seção "Artefatos criados a partir deste relatório" aparece com a lista correta e links funcionais.

**Acceptance Scenarios**:

1. **Given** um relatório de Check-up com pelo menos um artefato convertido, **When** o usuário abre a página do relatório, **Then** uma seção "Artefatos criados a partir deste relatório" é exibida com a contagem e a lista de artefatos.
2. **Given** a seção de artefatos do relatório visível, **When** o usuário clica em um artefato listado, **Then** ele é direcionado para a tela de revisão do artefato correspondente.
3. **Given** um relatório de Check-up sem nenhum artefato convertido, **When** o usuário abre a página do relatório, **Then** a seção exibe um estado vazio com instrução em pt-BR orientando como converter itens do relatório.

---

### User Story 2 — Navegar de um artefato de volta ao relatório de origem (Priority: P1)

O usuário está revisando um artefato na tela de revisão de artefatos de Workspace e quer entender de onde aquele artefato foi gerado para consultar o contexto original do relatório.

**Why this priority**: Sem esse caminho de volta, o usuário perde o contexto da origem do artefato. É o complemento obrigatório da história 1 para rastreabilidade bidirecional.

**Independent Test**: Pode ser testado abrindo um artefato com `sourceCheckupReportId` preenchido e verificando que o link "Ver relatório de origem" aparece e navega corretamente.

**Acceptance Scenarios**:

1. **Given** um artefato com `sourceCheckupReportId` e `sourceAiRunId` preenchidos, **When** o usuário abre o painel de detalhes do artefato, **Then** um link clicável "Ver relatório de origem" é exibido apontando para `/checkup/${sourceAiRunId}`.
2. **Given** o link "Ver relatório de origem" clicável visível, **When** o usuário clica nele, **Then** ele é direcionado para a página do relatório de Check-up de origem (usando `sourceAiRunId` como `runId` na rota).
3. **Given** um artefato com `sourceCheckupReportId` preenchido mas `sourceAiRunId` ausente ou nulo (relatório excluído ou não resolvível), **When** o usuário abre o painel de detalhes, **Then** é exibido "Relatório de origem não disponível" como texto desabilitado — sem link clicável, sem revelar dados de outra organização, mas com `sourceSection` e `sourceItemIndex` visíveis.
4. **Given** um artefato sem `sourceCheckupReportId` (criado manualmente), **When** o usuário abre o painel de detalhes, **Then** nenhuma informação de origem é exibida.

---

### User Story 3 — Ver metadados de origem em linguagem amigável no painel do artefato (Priority: P2)

O usuário está revisando um artefato convertido e quer entender de qual seção e posição do relatório original aquele item foi extraído, sem precisar decifrar IDs técnicos.

**Why this priority**: Melhora a confiança do usuário na rastreabilidade sem introduzir nova funcionalidade pesada — é refinamento de UX de alto valor sobre o que já existe.

**Independent Test**: Pode ser testado verificando que o painel de detalhes exibe "Origem: Seção [nome da seção], item [índice + 1]" em vez de IDs crus.

**Acceptance Scenarios**:

1. **Given** um artefato com `sourceSection` e `sourceItemIndex` preenchidos, **When** o usuário abre o painel de detalhes, **Then** `sourceSection` é exibido diretamente como rótulo (ex.: "Segurança") e `sourceItemIndex` como "Item de origem #3" (0-based → 1-based). Se `sourceSection` for nulo ou vazio, exibe "Seção de origem não informada".
2. **Given** os campos de rastreabilidade exibidos, **When** o usuário tenta editar qualquer campo de origem, **Then** os campos permanecem somente leitura — sem input habilitado.
3. **Given** um artefato marcado como `aiAssisted: true`, **When** o usuário visualiza os metadados, **Then** um indicador "Gerado com IA" é exibido próximo à informação de origem.

---

### User Story 4 — Acessar a área de revisão de artefatos pela navegação principal do Workspace (Priority: P2)

O usuário está no Workspace e quer ir diretamente para a lista de artefatos sem precisar lembrar da URL ou navegar por Check-up.

**Why this priority**: Ponto de entrada natural para usuários que retornam ao produto. Sem isso, o Workspace não comunica claramente que tem uma área de revisão de artefatos.

**Independent Test**: Pode ser testado verificando que a navegação lateral ou principal do Workspace possui um item "Artefatos" que leva para `/workspace/artifacts`.

**Acceptance Scenarios**:

1. **Given** o usuário autenticado no Workspace, **When** ele olha para a navegação principal, **Then** um item "Artefatos" ou "Revisão de Artefatos" está visível e clicável.
2. **Given** o item "Artefatos" na navegação, **When** o usuário clica nele, **Then** ele é direcionado para `/workspace/artifacts` com a lista completa de artefatos da organização.
3. **Given** o usuário em `/workspace/artifacts` sem nenhum artefato criado, **When** a página carrega, **Then** um estado vazio com instrução clara em pt-BR é exibido, orientando como iniciar um Check-up e converter itens.

---

### User Story 5 — Filtrar artefatos por relatório de origem ao vir do relatório (Priority: P2)

O usuário navegou do relatório de Check-up para a lista de artefatos via o link da seção de artefatos do relatório. Ele espera ver apenas os artefatos vinculados àquele relatório, não todos os artefatos da organização.

**Why this priority**: Evita desorientação quando a organização tem muitos artefatos de múltiplos Check-ups. É uma consequência natural da história 1.

**Independent Test**: Pode ser testado abrindo `/workspace/artifacts?sourceCheckupReportId=<id>` e verificando que apenas os artefatos daquele relatório são exibidos, com contexto visual do filtro ativo.

**Acceptance Scenarios**:

1. **Given** o usuário navega via o link do relatório, **When** a lista de artefatos abre, **Then** um banner ou indicador mostra "Exibindo artefatos do relatório: [identificador do relatório]" e apenas artefatos daquele `sourceCheckupReportId` aparecem.
2. **Given** o filtro de relatório ativo, **When** o usuário clica em "Ver todos os artefatos", **Then** o filtro é removido e a lista completa da organização é exibida.
3. **Given** o filtro ativo com `sourceCheckupReportId` inválido ou sem artefatos, **When** a lista carrega, **Then** um estado vazio é exibido com link para voltar ao relatório.

---

### Edge Cases

- O que acontece quando o relatório de origem foi excluído ou é inacessível mas o artefato ainda existe? → Exibir "Relatório de origem não disponível" como texto desabilitado (não clicável). `sourceSection` e `sourceItemIndex` permanecem visíveis. Nenhum detalhe do relatório inacessível de outra organização é revelado.
- O que acontece quando `sourceItemIndex` é zero? → Deve ser exibido como "Item de origem: 1" (índice legível a partir de 1).
- O que acontece quando o usuário tenta acessar `/workspace/artifacts?sourceCheckupReportId=<id>` de outra organização? → A autenticação e validação de organização no backend devem retornar apenas artefatos da organização autenticada, ignorando silenciosamente o filtro se o relatório não pertencer a ela.
- O que acontece quando há muitos artefatos na lista filtrada? → A paginação existente da lista deve continuar funcionando com o filtro aplicado.
- O que acontece quando `sourceSection` está vazio ou nulo? → Exibir "Seção de origem não informada" em pt-BR, sem quebrar o layout. Nenhum enum ou mapeamento é necessário.
- O que acontece com artefatos convertidos antes da migration de `sourceAiRunId`? → Esses artefatos terão `sourceAiRunId = null` mas `sourceCheckupReportId` não-nulo. A UI deve exibir "Relatório de origem não disponível" como texto desabilitado, sem link clicável — o mesmo comportamento do relatório inacessível. Não é necessário backfill de dados.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A navegação principal do Workspace DEVE exibir um item de menu "Artefatos" que leva o usuário para `/workspace/artifacts`.
- **FR-002**: A página do relatório de Check-up DEVE exibir uma seção "Artefatos criados a partir deste relatório" quando existirem artefatos vinculados ao `sourceCheckupReportId` daquele relatório.
- **FR-003**: A seção de artefatos do relatório DEVE listar os artefatos vinculados com nome, tipo e status, cada um com link para a tela de revisão do artefato.
- **FR-004**: A seção de artefatos do relatório DEVE exibir estado vazio com instrução em pt-BR quando nenhum artefato vinculado existir.
- **FR-005**: O painel de detalhes do artefato DEVE exibir `sourceSection` diretamente como rótulo (string livre já em pt-BR) e `sourceItemIndex` como "Item de origem #N" (índice 0-based convertido para 1-based). Se `sourceSection` for nulo ou vazio, exibir "Seção de origem não informada". Nenhum enum ou mapa de tradução deve ser criado para `sourceSection`.
- **FR-006**: O painel de detalhes do artefato DEVE exibir o contexto de origem sempre que `sourceCheckupReportId` estiver preenchido, em três estados: (a) se `sourceAiRunId` estiver disponível no artefato, exibir link clicável "Ver relatório de origem"; (b) se `sourceCheckupReportId` estiver preenchido mas `sourceAiRunId` não estiver disponível (relatório excluído ou inacessível), exibir "Relatório de origem não disponível" como texto desabilitado (não clicável); (c) se `sourceCheckupReportId` for nulo/vazio, não exibir nenhum elemento de origem. `sourceSection` e `sourceItemIndex` permanecem visíveis independentemente da acessibilidade do relatório.
- **FR-007**: O link "Ver relatório de origem" (quando clicável) DEVE navegar para `/checkup/${sourceAiRunId}` — usando o `aiRunId` da sessão de Check-up, não o `sourceCheckupReportId` (que é o `reportId`, um UUID diferente). Nunca revelar dados de relatório pertencente a outra organização. O campo `sourceAiRunId` deve ser preenchido no artefato no momento da conversão e exposto pelo backend.
- **FR-007a**: O backend DEVE armazenar `sourceAiRunId` no artefato durante a conversão (preenchido a partir de `CheckupReport.aiRunId`) e expô-lo na resposta dos endpoints de listagem e detalhe de artefatos. Este é o único campo novo adicionado ao modelo de dados neste bloco.
- **FR-008**: Os campos de rastreabilidade (`sourceCheckupReportId`, `sourceSection`, `sourceItemIndex`, `aiAssisted`) DEVEM ser somente leitura na UI — sem inputs editáveis.
- **FR-009**: A lista de artefatos em `/workspace/artifacts` DEVE aceitar o parâmetro de query `sourceCheckupReportId` para filtrar artefatos por relatório de origem.
- **FR-010**: Quando o filtro `sourceCheckupReportId` estiver ativo, a UI DEVE exibir um indicador claro do contexto do filtro e uma ação para removê-lo.
- **FR-011**: O backend DEVE suportar filtragem por `sourceCheckupReportId` no endpoint `GET /api/workspace/artifacts`, respeitando o escopo da organização autenticada.
- **FR-012**: Todos os textos, labels, estados vazios e mensagens de ajuda introduzidos DEVEM estar em pt-BR.
- **FR-013**: Nenhuma chamada ao provedor de IA DEVE ser introduzida neste bloco.
- **FR-014**: As proteções de autenticação JWT, validação de `X-Organization-Id`, CORS e rate limiting existentes DEVEM ser mantidas intactas no backend.
- **FR-015**: As regras de imutabilidade dos campos de rastreabilidade de artefatos definidas no Bloco 14 DEVEM ser preservadas.
- **FR-016**: System MUST preserve FrankInTest responsibility boundaries: UX in `apps/web`; business rules, persistence, permissions, credits, AI orchestration, audit logs, integrations, and security decisions in `services/api`.
- **FR-017**: New MVP UI copy MUST be in Brazilian Portuguese (`pt-BR`).

### Key Entities

- **WorkspaceArtifact**: Artefato de Workspace existente. Este bloco adiciona o campo de rastreabilidade `sourceAiRunId` (ID do `AiRun` associado ao `CheckupReport` de origem), necessário para construir o link de navegação correto para `/checkup/[runId]`. Os demais campos existentes (`sourceCheckupReportId`, `sourceSection`, `sourceItemIndex`, `aiAssisted`) têm apenas a apresentação melhorada.
- **CheckupReport**: Relatório de Check-up existente. Este bloco adiciona na sua página de visualização uma seção de artefatos vinculados, sem alterar o modelo de dados do relatório.
- **ArtifactListFilter**: Parâmetro de query `sourceCheckupReportId` adicionado ao endpoint de listagem de artefatos para suportar filtragem por relatório de origem.

### QA Artifact Impact

- **Artifacts created/updated**: Nenhum novo tipo de artefato de QA. Este bloco melhora a navegação e apresentação dos artefatos existentes.
- **AI run tracking**: Não aplicável — nenhuma chamada de IA neste bloco.
- **Credit impact**: Sem impacto em créditos — nenhuma operação de IA ou billing.
- **Audit events**: Nenhum novo evento de auditoria sensível. Navegação e leitura não requerem novos audit logs.
- **Sensitive data handling**: Os dados de artefatos e relatórios já são protegidos por autenticação JWT e validação de organização. Nenhum dado sensível adicional é exposto.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um usuário consegue navegar de um relatório de Check-up para a lista de artefatos vinculados em no máximo 1 clique.
- **SC-002**: Um usuário consegue navegar de um artefato de volta ao seu relatório de origem em no máximo 1 clique.
- **SC-003**: 100% dos campos de rastreabilidade (`sourceCheckupReportId`, `sourceSection`, `sourceItemIndex`, `aiAssisted`) permanecem somente leitura na UI após este bloco.
- **SC-004**: A filtragem de artefatos por `sourceCheckupReportId` retorna apenas artefatos da organização autenticada — zero vazamentos de dados entre organizações.
- **SC-005**: O item de navegação "Artefatos" no Workspace é visível e funcional em todas as rotas autenticadas do Workspace.
- **SC-006**: Todos os estados vazios introduzidos exibem instruções acionáveis em pt-BR, sem textos genéricos ou em outro idioma.
- **SC-007**: Os testes de backend existentes continuam passando; os testes de frontend (lint e build) passam após as mudanças de frontend.

## Clarifications

### Session 2026-05-19

- Q: `sourceSection` é texto livre ou enum/código interno? → A: Texto livre (string) já armazenado em pt-BR — exibir diretamente sem mapeamento, sem criar enum novo, sem migrar dados. Se nulo/vazio, exibir "Seção de origem não informada". `sourceItemIndex` exibido como "Item de origem #N" (0-based → 1-based na UI).
- Q: Comportamento do link "Ver relatório de origem" quando o relatório foi excluído ou é inacessível? → A: Exibir "Relatório de origem não disponível" como texto desabilitado (não clicável). Não ocultar a origem, não criar link quebrado, não revelar dados de relatório inacessível de outra organização. `sourceSection` e `sourceItemIndex` continuam visíveis. O link clicável só aparece quando o relatório existe e é acessível no contexto da organização autenticada.

## Assumptions

- O relatório de Check-up tem uma página de visualização existente no frontend (introduzida no Bloco 10) que pode receber a nova seção de artefatos.
- O endpoint `GET /api/workspace/artifacts` já existe (Bloco 14) e pode ser estendido com um parâmetro de query adicional `sourceCheckupReportId` sem quebrar clientes existentes.
- **Descoberta de implementação**: `sourceCheckupReportId` é o `id` do `CheckupReport`, não o `aiRunId` do `AiRun`. A rota `/checkup/[runId]` usa `aiRunId`. Os dois são UUIDs distintos gerados independentemente. O campo `sourceAiRunId` deve ser adicionado ao `WorkspaceArtifact` e preenchido na conversão a partir de `CheckupReport.aiRunId`, para que o frontend possa construir o link correto sem round-trip adicional.
- A navegação principal do Workspace tem uma estrutura de menu lateral ou top-bar existente que pode receber o novo item "Artefatos" sem redesign amplo.
- Paginação existente na lista de artefatos funciona com parâmetros de query adicionais.
- `sourceSection` é uma string livre já armazenada em pt-BR (sem enum, sem migração). `sourceItemIndex` é armazenado com base zero no backend; a UI deve exibi-lo como "Item de origem #N" (somando 1).
- Não há necessidade de um novo endpoint dedicado para "artefatos por relatório" — o filtro no endpoint existente é suficiente para o MVP.
- Artefatos criados manualmente (sem origem em Check-up) podem coexistir na lista e simplesmente não terão campos de rastreabilidade exibidos.
