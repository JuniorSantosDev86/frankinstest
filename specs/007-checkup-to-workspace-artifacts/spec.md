# Feature Specification: Check-up to Workspace Artifacts

**Feature Branch**: `007-checkup-to-workspace-artifacts`

**Created**: 2026-05-18

**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Selecionar e converter itens do relatório (Priority: P1)

Um usuário que concluiu um Check-up abre o relatório gerado e seleciona quais itens quer promover para o Workspace. Ele revisa os artefatos a serem criados em uma tela de pré-visualização e confirma a conversão. O backend cria os artefatos e os vincula ao relatório de origem.

**Why this priority**: É o fluxo principal do Bloco 13. Sem ele nenhum outro cenário faz sentido. Entrega valor imediato ao usuário: transforma saída de IA em artefatos versionados e rastreáveis no Workspace.

**Independent Test**: Pode ser testado acessando um relatório de Check-up concluído, selecionando ao menos um item de cada tipo disponível, confirmando e verificando que os artefatos aparecem no Workspace com status DRAFT e marcação AI-assisted.

**Acceptance Scenarios**:

1. **Given** o usuário está autenticado e tem acesso à organização correta, **When** abre um relatório de Check-up concluído, **Then** vê a lista de itens do relatório com checkboxes de seleção por tipo (requisitos, cenários, casos de teste, riscos).
2. **Given** o usuário selecionou itens, **When** clica em "Pré-visualizar artefatos", **Then** o backend retorna os artefatos a serem criados sem persistir nada ainda.
3. **Given** o usuário está na tela de pré-visualização, **When** confirma a conversão, **Then** o backend cria os artefatos, retorna os IDs criados e exibe confirmação na UI.
4. **Given** o usuário não selecionou nenhum item, **When** tenta confirmar, **Then** o backend rejeita a requisição e a UI exibe mensagem de validação.

---

### User Story 2 - Verificar rastreabilidade dos artefatos criados (Priority: P2)

Após a conversão, o usuário acessa um artefato no Workspace e consegue ver de qual relatório de Check-up e qual seção do relatório ele foi originado.

**Why this priority**: Rastreabilidade é um requisito de auditabilidade e do produto. Sem ela, os artefatos gerados por IA perdem contexto e o usuário não sabe de onde vieram.

**Independent Test**: Pode ser testado consultando um artefato criado via conversão e verificando que os campos `sourceCheckupReportId` e `sourceSection` estão presentes e corretos.

**Acceptance Scenarios**:

1. **Given** um artefato foi criado via conversão, **When** o usuário consulta o artefato, **Then** os campos de origem (ID do relatório e nome da seção) estão visíveis e corretos.
2. **Given** um artefato criado via conversão, **When** consultado via API, **Then** a resposta inclui `sourceCheckupReportId`, `sourceSection`, `aiAssisted: true` e `status: DRAFT`.

---

### User Story 3 - Acesso protegido por autenticação e organização (Priority: P1)

Tentativas de acessar o fluxo de conversão sem autenticação ou com organização incorreta são rejeitadas pelo backend.

**Why this priority**: Segurança é não-negociável. Este cenário deve ter a mesma prioridade do fluxo principal.

**Independent Test**: Pode ser testado enviando requisições sem token JWT (espera 401) e com `X-Organization-Id` de outra organização (espera 403).

**Acceptance Scenarios**:

1. **Given** uma requisição sem token JWT, **When** tenta acessar qualquer endpoint de conversão, **Then** o backend retorna 401.
2. **Given** uma requisição com JWT válido mas `X-Organization-Id` de outra organização, **When** tenta converter itens, **Then** o backend retorna 403.
3. **Given** uma requisição válida para um relatório de outra organização, **When** tenta pré-visualizar ou confirmar conversão, **Then** o backend retorna 403.

---

### Edge Cases

- O que acontece se o usuário tentar converter itens de um Check-up cujo ai_run ainda não foi concluído? → O backend verifica `ai_runs.status` via `checkupReport.aiRunId`; se não for `'completed'`, retorna 422 com mensagem em pt-BR.
- O que acontece se o relatório de Check-up for de uma organização diferente da enviada no header? → O backend retorna 403.
- O que acontece se o usuário confirmar a conversão duas vezes (double-submit)? → O backend é idempotente: detecta pela tripla `(checkupReportId, sourceSection, sourceItemIndex)` se o item já foi convertido e retorna os artefatos existentes sem duplicar. Se o segundo payload inclui itens ainda não convertidos (tripla não encontrada), cria apenas esses novos itens. A desabilitação do botão na UI é apenas um auxílio de UX, não o mecanismo de proteção.
- O que acontece se a lista de itens selecionados estiver vazia no payload de confirmação? → O backend retorna erro de validação (400).
- O que acontece se um item do relatório não corresponder a nenhum tipo de artefato mapeado? → O backend ignora o item desconhecido e registra em log; não falha a conversão inteira.
- O que acontece se um item selecionado já tiver sido convertido em uma sessão anterior? → O backend sinaliza `alreadyConverted: true` na resposta de pré-visualização, incluindo referência ao artefato existente quando disponível. A UI exibe aviso em pt-BR e sugere pular o item por padrão. O usuário pode escolher explicitamente criar uma nova versão. A confirmação respeita a escolha do usuário. O backend nunca cria duplicatas silenciosamente.
- O que acontece se a criação de um ou mais artefatos falhar durante a confirmação? → Toda a conversão é revertida (all-or-nothing em uma única transação de banco). Nenhum artefato parcial deve permanecer. O backend retorna mensagem de erro clara em pt-BR. O usuário pode tentar novamente com segurança (idempotência garante que os itens já convertidos não serão duplicados). Falhas de conversão devem ser registradas em evento de auditoria quando aplicável.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE permitir que o usuário visualize os itens de um relatório de Check-up concluído organizados por tipo (requisitos ausentes/unclear, cenários de teste, casos de teste, riscos de qualidade, riscos UX/produto, notas de release readiness).
- **FR-002**: O sistema DEVE permitir que o usuário selecione individualmente quais itens deseja promover para o Workspace.
- **FR-003**: O sistema DEVE oferecer uma etapa de pré-visualização dos artefatos a serem criados antes de qualquer persistência. A resposta de pré-visualização DEVE indicar, para cada item, se já existe um artefato gerado anteriormente (`alreadyConverted: true` com referência ao `existingArtifactId`).
- **FR-022**: A UI DEVE exibir aviso em pt-BR para itens com `alreadyConverted: true` e sugerir pular esses itens por padrão. O usuário pode escolher explicitamente criar uma nova versão (`CREATE_NEW`). O payload de confirmação DEVE incluir a intenção do usuário por item (`SKIP` ou `CREATE_NEW`). O backend NÃO DEVE criar duplicatas silenciosamente.
- **FR-004**: O backend DEVE criar artefatos no Workspace somente após confirmação explícita do usuário (requisição separada de confirmação).
- **FR-005**: Os artefatos criados DEVEM ter status `DRAFT` e serem marcados como `aiAssisted: true`.
- **FR-006**: Os artefatos criados DEVEM preservar `sourceCheckupReportId`, `sourceSection` e `sourceItemIndex` (posição 0-based do item dentro da seção no relatório) para rastreabilidade, além do projeto/organização de destino resolvido pelo backend. Não existem IDs individuais por item no relatório de Check-up — `sourceItemIndex` é o identificador posicional canônico.
- **FR-007**: O backend DEVE validar JWT e `X-Organization-Id` em todos os endpoints de conversão; retornar 401 para não autenticado e 403 para organização incorreta.
- **FR-008**: O backend DEVE validar que o Check-up report pertence à organização do header antes de qualquer operação.
- **FR-009**: O backend DEVE validar que o `ai_run` associado ao Check-up report (via `checkupReport.aiRunId`) tem `status = 'completed'` antes de permitir conversão. Se o ai_run não estiver completo, o backend retorna 422 com mensagem em pt-BR. Não existe `status = COMPLETED` na tabela `checkup_reports` — o guard correto é `ai_runs.status`.
- **FR-010**: O backend DEVE rejeitar payloads de confirmação com lista de itens vazia.
- **FR-019**: A criação de artefatos na confirmação DEVE ser executada em uma única transação atômica (all-or-nothing); se qualquer artefato falhar, toda a conversão é revertida sem deixar artefatos parciais no Workspace. O backend retorna mensagem de erro clara em pt-BR e o usuário pode tentar novamente com segurança.
- **FR-020**: O backend DEVE tentar registrar evento de auditoria para falha de conversão. Se o registro de auditoria também falhar, a falha primária de conversão prevalece e não deve ser encoberta pelo erro de auditoria.
- **FR-017**: O backend DEVE implementar idempotência na conversão. A chave de idempotência canônica é a tripla `(checkupReportId, sourceSection, sourceItemIndex)`. Dado o mesmo payload, o backend retorna os artefatos existentes sem duplicar. Se o payload contém itens ainda não convertidos (tripla não encontrada), cria apenas esses novos itens. `artifactType` não faz parte da chave — um item de seção mapeia deterministicamente para um único tipo de artefato neste bloco.
- **FR-018**: A desabilitação do botão de confirmação na UI após o primeiro envio é um auxílio de UX, não o mecanismo de proteção contra duplicatas — o backend é a autoridade.
- **FR-011**: O sistema DEVE registrar evento de auditoria quando artefatos forem criados via conversão (quem converteu, quando, de qual relatório, quais artefatos).
- **FR-012**: O fluxo de Check-up existente (Blocos 10, 11, 12) NÃO DEVE ser alterado.
- **FR-013**: O provedor de IA (Anthropic) NÃO DEVE ser chamado neste bloco; a conversão é determinística, baseada no conteúdo estruturado do relatório existente.
- **FR-014**: A UI DEVE exibir todos os textos em português brasileiro (pt-BR).
- **FR-015**: O sistema DEVE preservar rate limiting e CORS conforme configurado no Bloco 11.
- **FR-021**: O backend DEVE resolver o projeto de destino dos artefatos a partir de `ai_runs.project_id` (via `checkupReport.aiRunId`). A tabela `checkup_reports` não possui coluna `project_id`. Se `ai_runs.project_id` existir e não for vazio ou `'default'`, os artefatos herdam esse `projectId`; caso contrário, ficam vinculados ao escopo da organização (`projectId = null`). O frontend NÃO DEVE enviar nem sobrescrever o `projectId` no payload de confirmação.
- **FR-016**: O sistema DEVE preservar a separação de responsabilidades: UX em `apps/web`; regras de negócio, persistência, permissões e auditoria em `services/api`.

### Mapeamento de tipos de itens para artefatos

| Seção do relatório               | Tipo de artefato gerado     |
|----------------------------------|-----------------------------|
| Requisitos ausentes/unclear      | Rascunho de Requisito        |
| Cenários de teste sugeridos      | Rascunho de Cenário de Teste |
| Casos de teste sugeridos         | Rascunho de Caso de Teste    |
| Riscos de qualidade              | Item de Risco                |
| Riscos UX/produto                | Item de Risco                |
| Notas de release readiness       | Ação de QA Recomendada       |

### Key Entities

- **CheckupReport**: Relatório gerado pelo Check-up. Elegível para conversão quando o `ai_run` associado (via `aiRunId`) tem `status = 'completed'`. Fonte de verdade para os itens a serem convertidos. Não possui coluna `project_id` — o projeto de destino é resolvido via `ai_runs`.
- **CheckupReportItem**: Item individual do relatório (requisito, cenário, caso de teste, risco, nota). Identificado pela combinação de `sourceSection` (nome da seção) e `sourceItemIndex` (posição 0-based na lista da seção). Não possui ID próprio — o índice posicional dentro da seção é o identificador canônico.
- **WorkspaceArtifact**: Artefato criado no Workspace a partir de um item do relatório. Armazenado em tabela única `workspace_artifacts` com discriminador `artifactType` (REQUIREMENT, TEST_SCENARIO, TEST_CASE, RISK_ITEM, QA_ACTION). Campos comuns: `id`, `organizationId`, `projectId`, `title`, `description`, `status` (DRAFT), `aiAssisted` (true), `sourceCheckupReportId`, `sourceSection`, `sourceItemIndex`, `createdAt`, `updatedAt`. Campos específicos por tipo ficam em campo `details` (JSON). O backend valida o formato mínimo de `details` conforme `artifactType`.
- **ConversionPreview**: Representação dos artefatos que serão criados, retornada pelo backend antes da confirmação. Não é persistida. Cada item de preview inclui `alreadyConverted: boolean` e, quando `true`, referência ao `existingArtifactId`. O payload de confirmação inclui, por item, a intenção do usuário: `SKIP` (pular, padrão para já convertidos) ou `CREATE_NEW` (criar nova versão explicitamente).
- **AuditEvent**: Registro imutável da ação de conversão, incluindo usuário, organização, timestamp, IDs do relatório e artefatos criados.

### QA Artifact Impact

- **Artifacts created/updated**: Rascunho de Requisito, Rascunho de Cenário de Teste, Rascunho de Caso de Teste, Item de Risco, Ação de QA Recomendada.
- **AI run tracking**: Não aplicável — nenhuma chamada a provedor de IA neste bloco.
- **Credit impact**: Sem impacto de créditos — conversão é determinística, sem consumo de AI tokens.
- **Audit events**: Criação de artefatos via conversão de Check-up (usuário, organização, relatório de origem, lista de artefatos criados, timestamp).
- **Sensitive data handling**: Dados do relatório e artefatos são restritos à organização; validação no backend em todos os endpoints.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O usuário completa o fluxo em 3 etapas distintas na UI: (1) seleção de itens com checkboxes, (2) pré-visualização dos artefatos a serem criados, (3) confirmação explícita. Nenhuma etapa intermediária adicional é necessária.
- **SC-002**: 100% dos artefatos criados via conversão preservam `sourceCheckupReportId` e `sourceSection` corretos.
- **SC-003**: 100% dos artefatos criados via conversão estão com status `DRAFT` e `aiAssisted: true`.
- **SC-004**: Requisições sem autenticação retornam 401; requisições com organização incorreta retornam 403 — sem exceções.
- **SC-005**: O fluxo de Check-up existente (estimate → execute → report) continua funcionando sem regressões.
- **SC-006**: Todos os testes de backend para conversão, autorização e rastreabilidade passam.
- **SC-007**: Lint, build e testes de frontend passam sem erros se o frontend for modificado.
- **SC-008**: Nenhuma chamada ao provedor de IA é realizada durante o fluxo de conversão.

## Clarifications

### Session 2026-05-18

- Q: Comportamento de double-submit na confirmação de conversão → A: Idempotente — mesmo payload retorna artefatos existentes; payload incremental cria apenas itens novos; chave canônica = (checkupReportId, sourceSection, sourceItemIndex); artifactType excluído da chave (mapeamento 1:1 determinístico); UI disabling é só UX helper.
- Q: Comportamento em falha parcial durante criação de artefatos → A: Atômico all-or-nothing — uma única transação; qualquer falha reverte tudo; sem artefatos parciais; backend retorna erro claro em pt-BR; retry seguro via idempotência; falhas auditadas quando detectáveis.
- Q: Destino dos artefatos convertidos (projeto vs organização) → A: Backend resolve via ai_runs.project_id (checkupReport não tem project_id); se ai_runs.project_id existir e não for vazio/'default', artefatos herdam esse projectId; senão ficam no escopo da organização (projectId=null); frontend não envia projectId; seletor de projeto é pós-MVP.
- Q: Modelo de dados dos artefatos do Workspace → A: Tabela única workspace_artifacts com artifact_type ENUM (REQUIREMENT, TEST_SCENARIO, TEST_CASE, RISK_ITEM, QA_ACTION); campos comuns em colunas próprias; campos específicos em details JSON; backend valida formato mínimo de details por tipo; abordagem MVP evolutiva.
- Q: Comportamento ao reconverter item já convertido anteriormente → A: Backend sinaliza alreadyConverted: true + existingArtifactId na preview; UI exibe aviso em pt-BR e sugere SKIP por padrão; usuário pode escolher CREATE_NEW explicitamente; payload de confirmação inclui intenção por item; sem duplicatas silenciosas.

## Assumptions

- Os itens do relatório de Check-up já estão em formato estruturado (resultado do Bloco 10/12), permitindo mapeamento determinístico para tipos de artefato.
- O Workspace já possui entidades (ou esquema preparado) para Requisitos, Cenários de Teste, Casos de Teste, Itens de Risco e Ações de QA — mesmo que em nível básico. Se não existirem, serão criadas tabelas/entidades mínimas neste bloco.
- Não há fluxo de edição dos artefatos neste bloco; o usuário pode editar após a criação no Workspace (fora do escopo do Bloco 13).
- Integrações com ferramentas externas (Jira, GitHub) estão fora do escopo.
- Billing e controle de créditos não são afetados por este bloco.
- A pré-visualização não requer persistência temporária (é calculada on-the-fly pelo backend e retornada na resposta).
- O destino dos artefatos é resolvido pelo backend via `ai_runs.project_id` (usando `checkupReport.aiRunId`). A tabela `checkup_reports` não possui coluna `project_id`. Se `ai_runs.project_id` existir e não for vazio ou `'default'`, os artefatos herdam esse `projectId`; caso contrário ficam vinculados ao escopo da organização. O frontend não escolhe nem sobrescreve o `projectId` neste bloco. Seletor de projeto é escopo pós-MVP.
- A rastreabilidade preserva `checkupReportId`, `sourceSection`, `sourceItemIndex` (posição 0-based) e o projeto/organização de destino.
