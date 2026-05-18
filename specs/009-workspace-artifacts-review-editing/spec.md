# Feature Specification: Workspace Artifacts Review & Editing

**Feature Branch**: `009-workspace-artifacts-review-editing`

**Created**: 2026-05-18

**Status**: Draft

**Input**: User description: "Bloco 14 — Workspace Artifacts Review & Editing"

## User Scenarios & Testing *(mandatory)*

<!--
  User stories are prioritized by value and independence.
  P1 = fluxo crítico sem o qual o bloco não entrega valor.
-->

### User Story 1 - Listar e filtrar artefatos do Workspace (Priority: P1)

Um usuário autenticado acessa a área de revisão de artefatos do Workspace para visualizar todos os artefatos criados a partir de conversões de Check-up. Ele consegue filtrar por tipo, status e seção de origem, e identificar quais artefatos ainda precisam de revisão.

**Why this priority**: É o ponto de entrada principal do Bloco 14. Sem listagem não existe loop de revisão operacional. Entrega valor imediato ao revelar o estado atual dos artefatos convertidos.

**Independent Test**: Pode ser testado acessando a rota de listagem de artefatos com JWT válido e `X-Organization-Id` correto, verificando que os artefatos retornados pertencem à organização correta e que filtros por tipo/status/seção funcionam de forma independente.

**Acceptance Scenarios**:

1. **Given** o usuário está autenticado e tem acesso à organização correta, **When** acessa a área de revisão de artefatos, **Then** vê a lista de artefatos da organização com tipo, título, status, seção de origem e marcação AI-assisted.
2. **Given** o usuário está na listagem de artefatos, **When** filtra por tipo (ex.: REQUIREMENT), **Then** vê apenas artefatos daquele tipo.
3. **Given** o usuário está na listagem de artefatos, **When** filtra por status (ex.: DRAFT), **Then** vê apenas artefatos com aquele status.
4. **Given** o usuário está na listagem de artefatos, **When** filtra por seção de origem (ex.: "Requisitos ausentes"), **Then** vê apenas artefatos originados daquela seção.
5. **Given** o usuário está na listagem de artefatos, **When** filtra pelo ID do relatório de origem, **Then** vê apenas artefatos originados daquele relatório de Check-up.

---

### User Story 2 - Abrir e revisar detalhes de um artefato (Priority: P1)

O usuário abre um artefato específico em um painel de detalhes. Ele consegue ver todos os campos do artefato, incluindo rastreabilidade completa (relatório de origem, seção, índice) e a marcação AI-assisted, sem poder modificar os campos imutáveis.

**Why this priority**: A revisão individual de artefatos é a ação central do bloco. Sem ela, o usuário não tem como inspecionar e validar o conteúdo gerado pela IA antes de decidir o próximo status.

**Independent Test**: Pode ser testado acessando o endpoint de detalhe de um artefato com UUID válido e JWT correto. A resposta deve incluir todos os campos obrigatórios e o frontend deve exibir o painel de detalhes com campos de rastreabilidade não editáveis.

**Acceptance Scenarios**:

1. **Given** o usuário está na listagem de artefatos, **When** clica em um artefato, **Then** o painel de detalhes exibe tipo, título, descrição, status, seção de origem, referência ao relatório de origem, índice do item e marcação AI-assisted.
2. **Given** o usuário está no painel de detalhes, **When** tenta editar os campos de rastreabilidade (`sourceCheckupReportId`, `sourceSection`, `sourceItemIndex`, `aiAssisted`, `createdBy`, `createdAt`), **Then** esses campos estão bloqueados para edição (somente leitura).
3. **Given** um ID de artefato inexistente, **When** acessa o endpoint de detalhe, **Then** o backend retorna 404.
4. **Given** um ID de artefato que não pertence à organização do `X-Organization-Id`, **When** acessa o endpoint de detalhe, **Then** o backend retorna 404 — não revela a existência do artefato em outra organização. O backend retorna 403 apenas quando o header `X-Organization-Id` em si é inválido ou ausente.

---

### User Story 3 - Editar título, descrição e status de um artefato (Priority: P1)

O usuário refina um artefato convertido, atualizando o título e a descrição para refletir o contexto real do projeto. Ele também avança o status do artefato pelo fluxo de revisão (DRAFT → REVIEWED → ACCEPTED) ou arquiva artefatos irrelevantes (→ ARCHIVED).

**Why this priority**: A edição é a ação de refinamento que completa o loop de revisão. Sem ela, os artefatos DRAFT ficam permanentemente como rascunhos sem possibilidade de progressão operacional.

**Independent Test**: Pode ser testado enviando uma requisição PATCH com novos valores de `title`, `description` e `status` para um artefato existente da organização correta. A resposta deve refletir os campos atualizados e um evento de auditoria deve ser registrado.

**Acceptance Scenarios**:

1. **Given** o usuário está no painel de detalhes de um artefato, **When** edita apenas o título e salva, **Then** o backend persiste o novo título, retorna o artefato atualizado e registra evento de auditoria com `changedFields = ["title"]` sem os campos `previousStatus` ou `newStatus`.
2. **Given** o usuário está no painel de detalhes, **When** edita a descrição e salva, **Then** o backend persiste a nova descrição e registra evento de auditoria.
3. **Given** o usuário está no painel de detalhes de um artefato com status DRAFT, **When** avança o status para REVIEWED, **Then** o backend persiste o novo status e registra evento de auditoria com o status anterior e novo.
4. **Given** o usuário tenta mover o status para um valor inválido (fora de DRAFT/REVIEWED/ACCEPTED/ARCHIVED), **When** envia a requisição, **Then** o backend rejeita com 400 e mensagem de validação.
5. **Given** o usuário tenta atualizar campos imutáveis (`sourceCheckupReportId`, `sourceSection`, `sourceItemIndex`, `aiAssisted`, `createdBy`, `createdAt`) via PATCH, **Then** o backend rejeita com 400 e retorna mensagem em pt-BR indicando quais campos imutáveis foram incluídos — nunca os modifica nem os ignora silenciosamente.
6. **Given** título vazio é enviado, **When** o backend processa a requisição, **Then** retorna 400 com mensagem de validação em pt-BR.
7. **Given** o usuário está no painel de detalhes, **When** altera o status via select e clica em "Salvar", **Then** a mudança de status é concluída em no máximo 3 interações do usuário (abrir painel → selecionar novo status → salvar).

---

### User Story 4 - Acesso protegido por autenticação e organização (Priority: P1)

Tentativas de acessar listagem, detalhe ou edição de artefatos sem autenticação ou com organização incorreta são rejeitadas pelo backend.

**Why this priority**: Segurança é não-negociável e deve ter a mesma prioridade dos fluxos funcionais.

**Independent Test**: Pode ser testado enviando requisições sem token JWT (espera 401) e com `X-Organization-Id` incorreto (espera 403) para todos os endpoints de artefatos.

**Acceptance Scenarios**:

1. **Given** uma requisição sem token JWT, **When** tenta acessar qualquer endpoint de artefatos, **Then** o backend retorna 401.
2. **Given** uma requisição com JWT válido mas `X-Organization-Id` inválido ou ausente, **When** tenta listar ou editar artefatos, **Then** o backend retorna 403.
3. **Given** uma requisição PATCH válida com JWT correto mas tentando editar um artefato que não pertence à organização do `X-Organization-Id`, **When** processada pelo backend, **Then** o backend retorna 404 (sem revelar existência do artefato) sem modificar nada.

---

### Edge Cases

- O que acontece se o usuário tentar editar um artefato com `details` de formato inválido para o `artifactType`? → O backend valida `details` contra o mesmo esquema mínimo por `artifactType` usado na criação no Bloco 13 (REQUIREMENT, TEST_SCENARIO, TEST_CASE, RISK_ITEM e QA_ACTION possuem requisitos mínimos distintos). `details` inválido retorna 400 com descrição do problema estrutural em pt-BR. O artefato não é modificado.
- O que acontece se dois usuários da mesma organização editarem o mesmo artefato simultaneamente? → O backend usa `updatedAt` como campo de controle; a última gravação vence (last-write-wins) no MVP. Conflito de concorrência é escopo pós-MVP.
- O que acontece se o relatório de Check-up de origem for deletado? → Os artefatos permanecem no Workspace; `sourceCheckupReportId` é um campo de rastreabilidade histórica, não uma FK com cascade delete. A UI exibe o ID de origem mesmo que o relatório não exista mais.
- O que acontece se um filtro combinar tipo e seção que não retorna resultados? → O backend retorna lista vazia com 200 (não é erro).
- O que acontece se a organização tiver mais de 200 artefatos? → O backend retorna apenas os 200 mais recentes (por `createdAt` decrescente) com 200 OK. O frontend exibe aviso em pt-BR: "Exibindo os 200 itens mais recentes". O usuário deve usar filtros para refinar os resultados ou aguardar paginação pós-MVP.
- O que acontece se o campo `details` for omitido no PATCH? → O backend trata como "sem alteração em details" e não limpa o campo existente.
- O que acontece se o usuário tentar mover um artefato ARCHIVED de volta para ACCEPTED? → O MVP permite transições livres entre todos os status; restrições de fluxo unidirecional são escopo pós-MVP.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE oferecer endpoint para listar artefatos do Workspace filtrando por `organizationId` (obrigatório, vindo do header `X-Organization-Id`), e opcionalmente por `projectId`, `sourceCheckupReportId`, `artifactType` e `status`. O backend DEVE aplicar um limite máximo de 200 artefatos por resposta, ordenados por `createdAt` decrescente (mais recentes primeiro). Se existirem mais de 200 artefatos, apenas os 200 mais recentes são retornados. O frontend DEVE exibir aviso em pt-BR quando o limite for atingido (ex.: "Exibindo os 200 itens mais recentes").
- **FR-002**: O sistema DEVE oferecer endpoint para ler um único artefato por ID, retornando todos os campos incluindo os de rastreabilidade.
- **FR-003**: O sistema DEVE oferecer endpoint para atualizar os campos editáveis (`title`, `description`, `status`, `details`) de um artefato por ID via PATCH. Quando `details` for enviado, o backend DEVE validá-lo contra o mesmo esquema mínimo por `artifactType` usado na criação (Bloco 13); `details` inválido retorna 400 com mensagem em pt-BR indicando o problema estrutural.
- **FR-004**: O backend DEVE validar que `status` enviado no PATCH pertence ao conjunto `{DRAFT, REVIEWED, ACCEPTED, ARCHIVED}`. Qualquer outro valor retorna 400 com mensagem em pt-BR.
- **FR-005**: O backend DEVE rejeitar com 400 qualquer PATCH que contenha os campos imutáveis `sourceCheckupReportId`, `sourceSection`, `sourceItemIndex`, `aiAssisted`, `createdBy` ou `createdAt`. A resposta de erro DEVE indicar em pt-BR quais campos imutáveis foram enviados. O backend NUNCA deve alterar esses campos após a criação, e NUNCA deve ignorá-los silenciosamente — a rejeição explícita é a autoridade.
- **FR-006**: O backend DEVE validar que `title` não é vazio ou nulo quando presente no PATCH. Retorna 400 com mensagem em pt-BR.
- **FR-007**: O backend DEVE registrar evento de auditoria em toda atualização de artefato, incluindo: `artifactId`, `organizationId`, `userId`, `timestamp`, `changedFields`, `previousStatus` (quando status for alterado) e `newStatus`.
- **FR-008**: O backend DEVE validar JWT e `X-Organization-Id` em todos os endpoints de artefatos; retornar 401 para não autenticado e 403 para organização incorreta.
- **FR-009**: O backend DEVE validar que o artefato pertence à organização do `X-Organization-Id` antes de qualquer leitura ou escrita. Retornar 404 quando o artefato não for encontrado no escopo da organização (não revela a existência de artefatos de outras organizações). Retornar 403 apenas quando o header `X-Organization-Id` em si for inválido ou ausente.
- **FR-010**: O frontend DEVE exibir a área de revisão de artefatos com tipo, título, status, seção de origem, referência ao relatório de origem e marcação AI-assisted para cada artefato listado.
- **FR-011**: O frontend DEVE permitir filtragem ou agrupamento visual de artefatos por tipo, status e seção de origem.
- **FR-012**: O frontend DEVE exibir painel de detalhes com campos de rastreabilidade como somente leitura (`sourceCheckupReportId`, `sourceSection`, `sourceItemIndex`, `aiAssisted`, `createdBy`, `createdAt`).
- **FR-013**: O frontend DEVE permitir edição de `title`, `description` e `status` no painel de detalhes.
- **FR-014**: O frontend NÃO DEVE enviar `organizationId`, `projectId`, `sourceCheckupReportId`, `sourceSection`, `sourceItemIndex`, `aiAssisted`, `createdBy` ou `createdAt` no payload de atualização.
- **FR-015**: Toda cópia da UI DEVE estar em português brasileiro (pt-BR).
- **FR-016**: O sistema DEVE preservar rate limiting, CORS e proteções LGPD conforme configurado no Bloco 11.
- **FR-017**: O sistema DEVE preservar a separação de responsabilidades: UX em `apps/web`; regras de negócio, persistência, permissões e auditoria em `services/api`.
- **FR-018**: O provedor de IA (Anthropic) NÃO DEVE ser chamado neste bloco.
- **FR-019**: Os fluxos de Check-up (Blocos 10, 11, 12) e de conversão (Bloco 13) NÃO DEVEM ser alterados.

### Key Entities

- **WorkspaceArtifact**: Artefato criado no Workspace via conversão de Check-up. Campos editáveis: `title`, `description`, `status`, `details`. Campos imutáveis de rastreabilidade: `sourceCheckupReportId`, `sourceSection`, `sourceItemIndex`, `aiAssisted`, `createdBy`, `createdAt`. Status válidos no MVP: `DRAFT`, `REVIEWED`, `ACCEPTED`, `ARCHIVED`. O campo `updatedAt` é gerenciado automaticamente pelo backend a cada atualização.
- **ArtifactStatus**: Enum com valores `DRAFT`, `REVIEWED`, `ACCEPTED`, `ARCHIVED`. Transições são livres no MVP (sem restrições de direção). `DRAFT` é o status inicial criado pelo Bloco 13.
- **AuditEvent**: Registro imutável de cada atualização de artefato, incluindo campos alterados, status anterior/novo, usuário, organização e timestamp.

### QA Artifact Impact

- **Artifacts created/updated**: `WorkspaceArtifact` — campos editáveis atualizados; status avançado pelo fluxo de revisão.
- **AI run tracking**: Não aplicável — nenhuma chamada a provedor de IA neste bloco.
- **Credit impact**: Sem impacto de créditos — operações são CRUD puro, sem consumo de AI tokens.
- **Audit events**: Toda atualização de artefato (campos editados, mudança de status, usuário responsável, timestamp).
- **Sensitive data handling**: Dados dos artefatos são restritos à organização; validação `X-Organization-Id` em todos os endpoints.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O usuário consegue abrir a área de revisão de artefatos, visualizar até 200 artefatos convertidos (os mais recentes) e aplicar filtros por tipo, status ou seção de origem em uma única tela. Quando o limite de 200 é atingido, a UI exibe aviso em pt-BR.
- **SC-002**: 100% das atualizações de artefato geram evento de auditoria com campos alterados e usuário responsável registrados corretamente.
- **SC-003**: 100% dos campos de rastreabilidade (`sourceCheckupReportId`, `sourceSection`, `sourceItemIndex`, `aiAssisted`, `createdBy`, `createdAt`) permanecem inalterados após qualquer operação de edição.
- **SC-004**: Requisições sem autenticação retornam 401; requisições com organização incorreta retornam 403 — sem exceções em todos os endpoints de listagem, detalhe e edição.
- **SC-005**: O fluxo de Check-up existente (estimate → execute → report) e o fluxo de conversão (Bloco 13) continuam funcionando sem regressões.
- **SC-006**: Todos os testes de backend para listagem, leitura, atualização, autorização e imutabilidade de rastreabilidade passam.
- **SC-007**: Lint, build e testes de frontend passam sem erros se o frontend for modificado.
- **SC-008**: Nenhuma chamada ao provedor de IA é introduzida.
- **SC-009**: O usuário consegue avançar o status de um artefato de DRAFT para REVIEWED, ACCEPTED ou ARCHIVED em menos de 3 interações na UI.

## Clarifications

### Session 2026-05-18

- Q: Comportamento de acesso cross-org no GET /{id} e PATCH — 403 ou 404? → A: 404 quando o artefato não existe no escopo da organização autenticada (evita enumeração de IDs de outras organizações). 403 apenas quando o header X-Organization-Id em si é inválido ou ausente. Repositório usa findById(id, organizationId) — retorna empty quando ID não pertence à org, serviço lança 404.
- Q: Limite máximo de artefatos retornados na listagem sem paginação → A: Máximo 200 por resposta, ordenados por `createdAt` decrescente (mais recentes primeiro). Backend aplica o limite; frontend exibe aviso em pt-BR quando atingido. Paginação completa é pós-MVP.
- Q: Validação de `details` no PATCH — mesmo esquema da criação ou JSON livre? → A: Mesmo esquema mínimo por `artifactType` da criação (Bloco 13). REQUIREMENT, TEST_SCENARIO, TEST_CASE, RISK_ITEM e QA_ACTION têm requisitos mínimos distintos. `details` inválido retorna 400 com mensagem em pt-BR. Previne degradação estrutural dos artefatos para consumidores downstream.
- Q: Comportamento do backend quando um PATCH contém campos imutáveis (`sourceCheckupReportId`, `sourceSection`, `sourceItemIndex`, `aiAssisted`, `createdBy`, `createdAt`) → A: Rejeição explícita com 400 e mensagem em pt-BR listando os campos imutáveis enviados. O backend nunca ignora silenciosamente campos imutáveis — a rejeição é a autoridade. O frontend deve enviar apenas campos editáveis (`title`, `description`, `status`, `details`).

## Assumptions

- A tabela `workspace_artifacts` criada no Bloco 13 já existe e possui todos os campos de rastreabilidade (`sourceCheckupReportId`, `sourceSection`, `sourceItemIndex`, `aiAssisted`, `createdBy`, `createdAt`). Se não existir, o Bloco 13 deve ser implementado primeiro.
- O campo `updatedAt` já existe na tabela `workspace_artifacts` ou será adicionado neste bloco.
- O fluxo de status no MVP é livre (sem restrições de transição); restrições de fluxo unidirecional são escopo pós-MVP.
- Conflito de concorrência (dois usuários editando o mesmo artefato simultaneamente) é tratado com last-write-wins no MVP; otimistic locking é escopo pós-MVP.
- O frontend não implementa paginação no MVP. O backend aplica um limite máximo de 200 artefatos por resposta, ordenados por `createdAt` decrescente. A UI exibe aviso em pt-BR quando o limite é atingido. Paginação completa é escopo pós-MVP.
- Não há deleção de artefatos neste bloco; arquivamento via status `ARCHIVED` é o mecanismo de descarte no MVP.
- Integrações com ferramentas externas (Jira, GitHub) estão fora do escopo.
- Billing e controle de créditos não são afetados por este bloco.
- A área de revisão de artefatos é um novo componente de UI adicionado ao Workspace existente, sem redesign geral da interface.
- O campo `details` é editável para permitir refinamento do conteúdo gerado pela IA. A validação de `details` no PATCH usa o mesmo esquema mínimo por `artifactType` aplicado na criação pelo Bloco 13 (REQUIREMENT, TEST_SCENARIO, TEST_CASE, RISK_ITEM e QA_ACTION possuem requisitos mínimos distintos). `details` inválido retorna 400 com mensagem em pt-BR.
