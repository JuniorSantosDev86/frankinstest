# Feature Specification: AI Foundation Cleanup & Spec Alignment

**Feature Branch**: `002-ai-foundation-cleanup`

**Created**: 2026-05-15

**Status**: Draft

**Input**: User description: "Bloco 09C — AI Foundation Cleanup & Spec Alignment. Clean up and normalize the AI foundation before moving to FrankInTest Check-up MVP. Remove ambiguity, align code with the constitution, update specs/docs/status, and ensure the AI foundation has one clear architecture. Review current AI backend implementation, identify legacy AI classes/controllers/services that duplicate or conflict with the newer AI Test Design flow, decide the canonical AI orchestration path, safely remove or adapt legacy code, preserve Bloco 09A/09B behavior, keep endpoints used by apps/web, keep tests green, ensure frontend calls only the canonical backend API, ensure tests use mock AI provider only, ensure no provider key is exposed to apps/web, keep AI outputs as structured QA artifacts/drafts, and keep credits and audit behavior test-covered."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consolidar a arquitetura de IA canônica (Priority: P1)

Como mantenedor do FrankInTest, quero que exista apenas uma arquitetura canônica de orquestração de IA, para que o produto avance para o Check-up MVP sem caminhos concorrentes, comportamento ambíguo ou risco de manutenção duplicada.

**Why this priority**: Este é o objetivo central do bloco. A fundação de IA só é confiável se créditos, auditoria, provider mock/real, validação de output e persistência de artefatos seguirem uma única decisão arquitetural.

**Independent Test**: Pode ser testado revisando a superfície de IA existente e verificando que todo fluxo ativo de geração passa pelo caminho canônico, enquanto caminhos legados foram removidos, adaptados, renomeados ou justificados como compatibilidade temporária.

**Acceptance Scenarios**:

1. **Given** o backend contém o fluxo novo de AI Test Design e possíveis classes legadas de IA, **When** a fundação é revisada, **Then** uma única rota de orquestração é definida como canônica e todos os usos ativos apontam para ela.
2. **Given** um componente legado duplica responsabilidades do fluxo canônico, **When** ele é avaliado, **Then** ele é removido, adaptado, renomeado ou mantido com justificativa clara de compatibilidade.
3. **Given** o fluxo canônico é usado, **When** uma geração assistida por IA é executada, **Then** créditos, AI run tracking, auditoria e validação de output continuam funcionando como no Bloco 09A/09B.

---

### User Story 2 - Preservar a experiência existente do Workspace (Priority: P2)

Como usuário do Workspace, quero que a assistência de IA já entregue para test design continue funcionando, para gerar rascunhos estruturados de cenários e casos de teste sem regressão de UX ou perda de rastreabilidade.

**Why this priority**: O bloco é uma limpeza de qualidade, não uma mudança de produto. Nenhum comportamento funcional aprovado em 09A/09B deve ser quebrado enquanto a arquitetura é normalizada.

**Independent Test**: Pode ser testado usando os fluxos de estimativa e geração já disponíveis no Workspace e confirmando que a UI continua chamando apenas APIs do FrankInTest, sem chamadas diretas a provedores externos.

**Acceptance Scenarios**:

1. **Given** um usuário com acesso válido ao projeto e artefatos de origem, **When** ele solicita estimativa e geração assistida por IA, **Then** a UI preserva os estados de estimativa, confirmação, carregamento, sucesso e erro em pt-BR.
2. **Given** uma geração concluída, **When** o resultado é exibido, **Then** os outputs continuam sendo rascunhos estruturados de QA vinculados aos artefatos de origem.
3. **Given** o frontend executa testes, lint e build, **When** a validação termina, **Then** não há dependência de provider externo nem exposição de segredo no código cliente.

---

### User Story 3 - Atualizar documentação e status do bloco (Priority: P3)

Como responsável pelo roadmap e pela qualidade do produto, quero que specs, docs e status descrevam fielmente a fundação de IA atual, para que os próximos blocos do Check-up MVP partam de uma base clara e auditável.

**Why this priority**: A normalização só é completa se o código e a documentação concordarem sobre o caminho canônico, o que foi removido, o que foi preservado e quais limites permanecem.

**Independent Test**: Pode ser testado revisando a documentação atualizada e confirmando que ela descreve a arquitetura canônica, o estado pós-09C, as limitações conhecidas e os próximos passos sem contradizer a constituição do produto.

**Acceptance Scenarios**:

1. **Given** a limpeza foi concluída, **When** os documentos de status e especificação são revisados, **Then** eles identificam o caminho canônico de IA e removem descrições conflitantes de arquitetura legada.
2. **Given** código legado foi removido ou mantido por compatibilidade, **When** o run report é lido, **Then** ele explica o que mudou, o que foi preservado e por quê.
3. **Given** o próximo bloco será Check-up MVP, **When** a documentação é usada como entrada, **Then** ela deixa claro que não houve implementação de novos recursos de IA, billing, streaming ou microserviços neste bloco.

### Edge Cases

- Um endpoint legado ainda é chamado pelo frontend atual e não pode ser removido sem quebrar comportamento existente.
- Uma classe legada compartilha nome ou responsabilidade com o fluxo canônico, mas ainda contém lógica necessária para créditos, auditoria ou testes.
- Uma remoção aparentemente segura quebra cobertura de testes, build ou contrato usado pela UI.
- Um teste automatizado tenta usar provider real por configuração acidental.
- Uma variável de provider real aparece em artefatos client-side, bundle ou testes de frontend.
- Um output de IA válido tecnicamente deixa de ser salvo ou exibido como artefato estruturado de QA.
- A documentação antiga contradiz a decisão canônica após a limpeza.
- A árvore de trabalho contém alterações não relacionadas que não devem ser revertidas pelo bloco.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST ter uma única arquitetura canônica documentada para orquestração de IA no produto.
- **FR-002**: O sistema MUST identificar componentes legados de IA que dupliquem, contornem ou conflitem com o fluxo canônico de AI Test Design.
- **FR-003**: Componentes legados conflitantes MUST ser removidos, adaptados, renomeados, desativados ou mantidos como compatibilidade temporária com justificativa explícita.
- **FR-003a**: Legacy endpoints that are still used MAY remain only as thin compatibility wrappers. They MUST delegate to the canonical AI Test Design orchestration path and MUST NOT contain duplicate AI provider selection, credit reservation/capture, AI run lifecycle, audit logic, artifact parsing, or independent prompt/output handling.
- **FR-003b**: Any retained legacy endpoint MUST be documented as deprecated or compatibility-only in the relevant spec/docs/run report.
- **FR-004**: O sistema MUST preservar os fluxos funcionais entregues em 09A/09B para estimar créditos e gerar rascunhos estruturados de cenários e casos de teste.
- **FR-005**: Endpoints ainda usados por `apps/web` MUST permanecer funcionais ou receber adaptação compatível para o caminho canônico.
- **FR-006**: O frontend MUST chamar somente APIs de produto do FrankInTest para operações de IA.
- **FR-007**: O frontend MUST NOT chamar provedores externos de IA diretamente.
- **FR-008**: Nenhuma chave, token ou segredo de provider de IA MUST estar exposto em código cliente, configuração client-side, bundle, teste de frontend ou payload enviado ao navegador.
- **FR-009**: Testes automatizados MUST usar apenas provider de IA mockado, determinístico ou simulado.
- **FR-010**: O sistema MUST NOT chamar provider real de IA durante validações automatizadas.
- **FR-011**: Outputs de IA MUST continuar representados como artefatos ou rascunhos estruturados de QA, não como chat solto.
- **FR-012**: O sistema MUST preservar tracking server-side de AI runs para operações de IA confirmadas.
- **FR-013**: O sistema MUST preservar estimativa, consumo, liberação ou ajuste auditável de créditos para operações de IA.
- **FR-014**: O sistema MUST preservar eventos de auditoria relevantes para início, sucesso, falha e impacto de créditos de runs de IA.
- **FR-015**: O sistema MUST maintain the protected-request boundary for canonical and retained compatibility AI endpoints: authentication validation must be preserved or explicitly documented as mocked/local for the MVP, organization/project access must remain backend-enforced, input schema validation must reject malformed or invalid requests, entitlement handling must be explicitly addressed, and audit behavior must remain covered.
- **FR-015a**: Full entitlement enforcement is not introduced by 09C. Until a dedicated entitlement system exists, this cleanup block MUST document entitlement as not applicable to implementation scope and MUST preserve the current organization/project and credit gates without adding a new entitlement subsystem.
- **FR-016**: O bloco MUST NOT adicionar novos recursos de IA, streaming, billing de compra, integração produtiva ampliada com provider externo, microserviços ou redesign amplo de UI.
- **FR-017**: Specs, docs e status relevantes MUST ser atualizados quando a limpeza alterar ou esclarecer a arquitetura de IA, estado do produto, limitações ou próximos passos.
- **FR-018**: O run report MUST explicar o que foi removido, o que foi preservado, o que foi adaptado e a razão de cada decisão relevante.
- **FR-019**: Backend tests MUST pass after cleanup.
- **FR-020**: Frontend lint, tests and build MUST pass after cleanup.
### Constitution Guardrails

- **CG-001**: System MUST preserve FrankInTest responsibility boundaries: UX in `apps/web`; business rules, persistence, permissions, credits, AI orchestration, audit logs, integrations, and security decisions in `services/api`.
- **CG-002**: If AI is used, System MUST produce or update structured QA artifacts rather than loose chat output.
- **CG-003**: If the feature performs expensive AI work, System MUST estimate credits before execution and track the AI run server-side.
- **CG-004**: If protected data is accessed or mutated, System MUST validate organization and project access on the backend.
- **CG-005**: New MVP UI copy MUST be in Brazilian Portuguese (`pt-BR`).

### Key Entities *(include if feature involves data)*

- **Canonical AI Orchestration Path**: A decisão única que define o fluxo aprovado para validar input, estimar créditos, registrar AI run, chamar provider via backend, validar output, salvar artefatos estruturados e auditar impacto.
- **Legacy AI Path**: Qualquer controller, service, adapter, client, helper, teste ou contrato antigo que execute ou simule IA fora do caminho canônico ou com responsabilidades duplicadas.
- **AI Run**: Registro auditável de uma operação assistida por IA, com contexto de organização, usuário, projeto, tipo de geração, estimativa, status, timestamps, erro controlado e referência ao output quando existir.
- **Credit Transaction**: Registro de reserva, consumo, liberação, estorno ou ajuste equivalente associado a uso de IA.
- **Structured QA Draft**: Artefato de QA gerado por IA que permanece em estado de rascunho até revisão humana, como cenário de teste ou caso de teste.
- **Provider Configuration**: Configuração server-side que decide se o ambiente usa provider mockado ou provider real autorizado, sem exposição ao frontend.
- **Active AI Generation Flow**: Executable production code path or frontend-consumed endpoint that can initiate or query AI-assisted generation. Historical documentation, inventories, explicit deprecation notes, and compatibility descriptions are not active flows unless they point to executable non-wrapper behavior.

### QA Artifact Impact *(include if feature involves AI or QA workflow data)*

- **Artifacts created/updated**: Nenhum novo tipo de artefato de QA é criado neste bloco. Cenários e casos de teste assistidos por IA existentes devem continuar sendo preservados como rascunhos estruturados.
- **AI run tracking**: Required. O bloco deve manter ou reforçar tracking dos runs existentes e eliminar caminhos que contornem esse tracking.
- **Credit impact**: No new credit product behavior. A fundação de estimativa, consumo/liberação e auditoria já existente deve permanecer testada e coerente.
- **Audit events**: Início, sucesso, falha e impacto de créditos de runs de IA devem continuar auditáveis; caminhos legados sem auditoria não devem permanecer como fluxo ativo.
- **Sensitive data handling**: Secrets de provider permanecem exclusivamente server-side; testes usam mock; o frontend recebe apenas dados de produto necessários para UX.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos fluxos ativos de geração assistida por IA usam o caminho canônico documentado.
- **SC-002**: 0 caminhos ativos de IA duplicados ou conflitantes permanecem sem justificativa explícita após a limpeza.
- **SC-003**: 100% dos endpoints de IA usados pelo frontend continuam funcionais ou são adaptados de forma compatível.
- **SC-004**: 0 chamadas diretas a provedores externos de IA existem em `apps/web`.
- **SC-005**: 0 secrets de provider de IA aparecem em código cliente, testes de frontend ou artefatos enviados ao navegador.
- **SC-006**: 100% dos testes automatizados de IA executam com provider mockado, determinístico ou simulado.
- **SC-007**: Backend tests pass with no regression in credit handling, AI run tracking, audit behavior or structured output validation.
- **SC-008**: Frontend lint, tests and build pass with no regression in the AI generation UI.
- **SC-009**: Docs/spec/status updated for 09C accurately describe the canonical AI foundation, preserved behavior, removed/adapted legacy paths and known limitations.
- **SC-010**: The run report lists changed files, implemented cleanup, preserved business rules, validation commands, known limitations, roadmap/status updates and suggested commit message.
- **SC-011**: 100% of canonical or retained compatibility AI endpoints have documented protected-request behavior for authentication, organization/project access, input schema validation, entitlement applicability, and audit expectations.

## Assumptions

- Bloco 09A/09B already delivered a newer AI Test Design flow that should be treated as the default canonical candidate unless code review finds a safer alternative.
- This block is a cleanup and alignment block; user-visible behavior should remain stable unless a legacy path was previously exposing unsafe or unsupported behavior.
- Legacy removal is allowed only when tests and frontend usage show it is safe, or when compatibility is provided through the canonical path.
- Documentation updates are limited to AI foundation alignment, current status, specs and roadmap/status notes needed for Check-up MVP readiness.
- Authentication is currently expected to remain mocked/local if real authentication is not implemented in the current backend; 09C must preserve and document that boundary instead of adding a new auth system.
- Full entitlement enforcement is outside 09C; organization/project validation and credit gates remain the active MVP controls until a later entitlement block.
- No commit is created by the agent as part of this block.
