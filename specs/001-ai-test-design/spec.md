# Feature Specification: AI Test Design Assistance

**Feature Branch**: `001-ai-test-design`

**Created**: 2026-05-15

**Status**: Draft

**Input**: User description: "Bloco 09A + 09B — AI Test Design Assistance"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Estimar e gerar cenários de teste a partir de uma regra de negócio (Priority: P1)

Como profissional de QA no Workspace, quero selecionar uma regra de negócio existente, ver uma estimativa de créditos e gerar cenários de teste estruturados com assistência de IA, para acelerar o test design sem perder rastreabilidade nem controle de custo.

**Why this priority**: Este é o primeiro fluxo de valor de IA dentro do Workspace e valida as regras centrais do produto: créditos antes de custo, IA vinculada a artefatos de QA, e rastreabilidade a partir de regras de negócio.

**Independent Test**: Pode ser testado criando ou usando uma regra de negócio existente, solicitando estimativa, confirmando a geração e verificando que os cenários aparecem como rascunhos assistidos por IA vinculados ao projeto e à regra de origem.

**Acceptance Scenarios**:

1. **Given** um usuário com acesso válido a um projeto e uma regra de negócio selecionada, **When** o usuário solicita a estimativa, **Then** o sistema mostra a estimativa de créditos antes de permitir a geração.
2. **Given** uma estimativa visível e créditos suficientes, **When** o usuário confirma a geração, **Then** o sistema cria cenários de teste estruturados como rascunhos assistidos por IA e mantém vínculo com a regra de negócio.
3. **Given** uma geração concluída, **When** o usuário revisa o resultado no Workspace, **Then** cada cenário deixa claro que ainda precisa de revisão humana antes de ser tratado como artefato aceito.

---

### User Story 2 - Gerar casos de teste a partir de um cenário existente (Priority: P2)

Como profissional de QA, quero transformar um cenário de teste existente em casos de teste estruturados com pré-condições, passos, dados e resultados esperados, para reduzir trabalho repetitivo mantendo a relação entre cenário e casos.

**Why this priority**: Este fluxo completa a cadeia Regra de negócio -> Cenário de teste -> Caso de teste, que é uma regra central do Workspace. Ele deve ser entregue somente se a UI atual conseguir representar casos com segurança e sem redesenho amplo.

**Independent Test**: Pode ser testado selecionando um cenário existente, solicitando estimativa, confirmando geração e verificando que os casos de teste gerados aparecem como rascunhos assistidos por IA vinculados ao cenário.

**Acceptance Scenarios**:

1. **Given** um cenário de teste existente em um projeto acessível, **When** o usuário solicita a geração de casos, **Then** o sistema apresenta uma estimativa de créditos antes da execução.
2. **Given** a geração de casos concluída com sucesso, **When** o usuário visualiza os resultados, **Then** os casos incluem campos estruturados suficientes para revisão e execução posterior.
3. **Given** a UI atual não consiga salvar casos de teste com segurança, **When** o usuário solicita este fluxo, **Then** o sistema não deve criar saída solta de chat e deve orientar que o recurso depende da representação segura de casos.

---

### User Story 3 - Rastrear ciclo de vida, falhas e créditos de runs de IA (Priority: P3)

Como responsável pelo workspace ou pela plataforma, quero que cada operação de IA tenha histórico rastreável, status claro e tratamento justo de créditos, para auditar uso, investigar falhas e evitar cobranças indevidas quando a plataforma falhar.

**Why this priority**: A assistência de IA só é aceitável no produto se custo, status e output forem auditáveis. Este fluxo reduz risco comercial, operacional e de confiança.

**Independent Test**: Pode ser testado executando runs bem-sucedidos e runs com falha controlada, verificando registros de run, transações ou reservas de crédito, status final e ausência de consumo final indevido em falhas de plataforma.

**Acceptance Scenarios**:

1. **Given** uma geração iniciada, **When** o sistema processa a solicitação, **Then** um registro de run de IA fica disponível com usuário, organização, projeto, tipo de operação, estimativa, status e timestamps relevantes.
2. **Given** uma falha causada pelo provedor ou pela plataforma, **When** o run termina, **Then** o status final registra a falha e os créditos finais não são consumidos de forma injusta.
3. **Given** uma geração bem-sucedida, **When** o run termina, **Then** o consumo de créditos e o vínculo com os artefatos gerados ficam auditáveis.

### Edge Cases

- A regra de negócio ou cenário selecionado não existe mais no momento da geração.
- O usuário tenta gerar artefatos em um projeto ao qual não tem acesso.
- A organização não tem créditos suficientes ou excedeu limite de uso de IA.
- O usuário dispara a mesma geração repetidamente antes da primeira terminar.
- O provedor de IA retorna conteúdo vazio, malformado, duplicado ou inadequado para artefato de QA.
- O serviço de IA falha após uma reserva ou estimativa de crédito já ter sido apresentada.
- A estimativa expira porque o input mudou antes da confirmação.
- O frontend perde conexão durante o processamento e precisa recuperar o estado final do run.
- O conteúdo de entrada contém dados sensíveis que não são necessários para a geração.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir que usuários com acesso válido a um projeto solicitem estimativa de créditos para geração de cenários de teste a partir de uma regra de negócio.
- **FR-002**: O sistema MUST permitir que usuários com acesso válido a um projeto gerem cenários de teste estruturados a partir de uma regra de negócio após visualizar a estimativa de créditos.
- **FR-003**: O sistema MUST permitir geração de casos de teste estruturados a partir de um cenário quando o Workspace conseguir salvar e exibir esses casos como artefatos rastreáveis.
- **FR-004**: O sistema MUST impedir que saídas de IA sejam apresentadas apenas como chat solto; toda saída útil deve ser representada ou salva como artefato de QA estruturado.
- **FR-005**: Cenários e casos gerados por IA MUST ser marcados como assistidos por IA e como rascunho até revisão ou aceite humano.
- **FR-006**: O sistema MUST preservar a cadeia de rastreabilidade entre projeto, módulo quando disponível, requisito quando disponível, regra de negócio, cenário de teste e caso de teste.
- **FR-007**: O sistema MUST registrar cada run de IA com organização, usuário, projeto, tipo de geração, entrada resumida ou referência de entrada, estimativa de crédito, status, timestamps e referência ao output quando existir.
- **FR-008**: O sistema MUST registrar consumo, reserva, liberação, estorno ou fundação equivalente de transações de crédito para operações de IA.
- **FR-009**: Runs de IA com falha causada pela plataforma ou pelo provedor MUST NOT consumir créditos finais de forma injusta.
- **FR-010**: O sistema MUST bloquear ou orientar o usuário quando não houver crédito, entitlement ou permissão suficiente para iniciar uma geração.
- **FR-011**: O sistema MUST usar respostas determinísticas ou simuladas de IA em ambientes de desenvolvimento local e testes automatizados.
- **FR-012**: O sistema MUST permitir configuração server-side de provedor real de IA sem expor chave, token ou segredo ao cliente.
- **FR-013**: O frontend MUST chamar somente a camada de produto do FrankInTest para operações de IA e MUST NOT chamar provedores de IA diretamente.
- **FR-014**: A UI MUST mostrar estados de carregamento, sucesso, erro e ausência de resultado em português brasileiro.
- **FR-015**: A UI MUST mostrar a estimativa de créditos antes da confirmação de geração.
- **FR-016**: A UI MUST deixar visualmente claro que os artefatos gerados são rascunhos assistidos por IA e requerem revisão humana.
- **FR-017**: O sistema MUST validar acesso à organização e ao projeto antes de estimar, gerar, salvar output ou consultar run de IA.
- **FR-018**: O sistema MUST registrar eventos auditáveis para início, sucesso, falha e consumo ou ajuste de créditos de runs de IA.
- **FR-019**: O sistema MUST tratar outputs inválidos do provedor como falha controlada e não como artefato confiável.
- **FR-020**: A documentação relevante MUST informar variáveis locais necessárias para habilitar provedor real de IA, mantendo o mock como caminho padrão para desenvolvimento e testes.
- **FR-021**: System MUST preserve FrankInTest responsibility boundaries: UX in `apps/web`; business rules, persistence, permissions, credits, AI orchestration, audit logs, integrations, and security decisions in `services/api`.
- **FR-022**: If AI is used, System MUST produce or update structured QA artifacts rather than loose chat output.
- **FR-023**: If the feature performs expensive AI work, System MUST estimate credits before execution and track the AI run server-side.
- **FR-024**: If protected data is accessed or mutated, System MUST validate organization and project access on the backend.
- **FR-025**: New MVP UI copy MUST be in Brazilian Portuguese (`pt-BR`).

### Key Entities *(include if feature involves data)*

- **AI Run**: Registro de uma operação assistida por IA. Inclui organização, usuário, projeto, tipo de geração, referência ao artefato de entrada, estimativa de créditos, créditos finais quando aplicável, status, timestamps, erro controlado quando houver e referência ao output.
- **Credit Transaction**: Registro auditável de impacto financeiro ou de uso de créditos. Inclui organização, usuário quando aplicável, run relacionado, tipo de movimentação, quantidade estimada ou final, motivo e status.
- **Business Rule**: Artefato de origem que descreve uma regra do produto e pode gerar múltiplos cenários de teste.
- **Test Scenario**: Artefato de test design gerado ou mantido no Workspace. Pode ser rascunho, assistido por IA e vinculado a regra de negócio, requisito, módulo e projeto.
- **Test Case**: Artefato executável ou revisável derivado de um cenário. Pode ser rascunho, assistido por IA e vinculado a cenário, regra, requisito, módulo e projeto.
- **AI Provider Configuration**: Configuração operacional server-side que define se a geração usa provedor simulado ou provedor real autorizado.

### QA Artifact Impact *(include if feature involves AI or QA workflow data)*

- **Artifacts created/updated**: Cenários de teste e casos de teste como rascunhos assistidos por IA. Nenhum bug report, relatório, drift finding ou Check-up é criado neste bloco.
- **AI run tracking**: Required. Cada estimativa confirmada e cada geração deve ter ciclo de vida rastreável no servidor.
- **Credit impact**: Estimated before execution. Consumo final ou fundação equivalente deve ser auditável; falhas de plataforma não devem consumir créditos finais injustamente.
- **Audit events**: Estimativa relevante, início de run, sucesso, falha, output salvo, transação de crédito e tentativa negada por permissão, entitlement ou crédito insuficiente.
- **Sensitive data handling**: Enviar apenas o contexto necessário para gerar artefatos de teste, nunca expor secrets ao cliente, nunca armazenar tokens de provedor em texto visível, e manter outputs com linguagem de limitação e revisão humana.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um usuário com uma regra de negócio existente consegue ver a estimativa, confirmar a geração e visualizar cenários de teste em até 2 minutos em um ambiente saudável.
- **SC-002**: 100% dos cenários e casos gerados por IA aparecem com indicação de rascunho e assistido por IA até revisão humana.
- **SC-003**: 100% das gerações confirmadas geram um registro de run rastreável com status final de sucesso ou falha controlada.
- **SC-004**: 0 runs com falha causada pela plataforma ou provedor resultam em consumo final injusto de créditos.
- **SC-005**: 100% dos testes automatizados de geração de IA usam provedor simulado, sem chamadas reais a provedores externos.
- **SC-006**: 0 chaves, tokens ou secrets de provedor de IA ficam disponíveis em código cliente, payloads de UI ou artefatos enviados ao navegador.
- **SC-007**: Pelo menos 90% dos usuários avaliadores conseguem identificar, sem orientação externa, o custo estimado e o status de rascunho assistido por IA antes de aceitar o resultado.
- **SC-008**: Backend, frontend e documentação passam pelas validações planejadas do bloco sem regressão nos fluxos determinísticos existentes do Workspace.

## Assumptions

- Bloco R já entregou a arquitetura separada de frontend e backend exigida para este bloco.
- O fluxo inicial ocorre dentro do QA Workspace, não no Check-up.
- A primeira versão prioriza geração síncrona de pequeno porte; filas e workers ficam para runs maiores no futuro.
- O mock de IA é o padrão para desenvolvimento local e testes automatizados.
- A integração com provedor real fica atrás de configuração server-side e pode permanecer desabilitada quando não houver chave local.
- O billing de compra de créditos continua fora de escopo; este bloco precisa da fundação de estimativa, transação e tratamento justo de consumo.
- A revisão humana completa e mudança de status de rascunho para aceito pode ser simples nesta etapa, desde que o estado de rascunho assistido por IA seja preservado.
- A geração de casos a partir de cenários só deve avançar se o modelo e a UI atual suportarem persistência estruturada sem redesenho amplo.
