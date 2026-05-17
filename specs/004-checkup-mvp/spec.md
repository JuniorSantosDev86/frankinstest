# Feature Specification: FrankInTest Check-up MVP

**Feature Branch**: `004-checkup-mvp`

**Created**: 2026-05-16

**Status**: Draft

**Input**: Bloco 10 — FrankInTest Check-up MVP

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Submissão de Contexto e Estimativa de Créditos (Priority: P1)

Um usuário sem experiência em QA quer saber o que pode quebrar no seu produto antes do lançamento. Ele acessa a área de Check-up, preenche um formulário descrevendo o que o produto faz e o que quer validar, confirma que está autorizado a analisar o alvo, e recebe uma estimativa de quantos créditos a análise vai consumir antes de confirmar a execução.

**Why this priority**: É o ponto de entrada do produto. Sem esse fluxo, nenhum outro cenário de Check-up é alcançável. A estimativa de créditos é essencial para o modelo de negócio baseado em créditos.

**Independent Test**: Pode ser testado individualmente preenchendo o formulário e clicando em "Estimar créditos" — o sistema deve retornar estimativa sem executar nada.

**Acceptance Scenarios**:

1. **Given** o usuário está na área de Check-up, **When** ele preenche os campos obrigatórios (tipo do alvo, valor do alvo, contexto, objetivo, profundidade) e marca o checkbox de autorização, **Then** o botão "Estimar créditos" fica habilitado.
2. **Given** os campos obrigatórios estão preenchidos, **When** o usuário clica em "Estimar créditos", **Then** o sistema exibe a estimativa de créditos e o detalhamento do cálculo antes de qualquer execução de IA.
3. **Given** o checkbox de autorização não foi marcado, **When** o usuário tenta estimar, **Then** o sistema rejeita a requisição com mensagem explicativa em pt-BR.
4. **Given** o usuário não tem saldo suficiente, **When** visualiza a estimativa, **Then** o sistema exibe aviso de saldo insuficiente antes da confirmação.

---

### User Story 2 — Execução do Check-up e Geração do Relatório (Priority: P1)

Após visualizar a estimativa, o usuário confirma a execução. O sistema processa a análise via IA, persiste o relatório estruturado como rascunho e o usuário visualiza os resultados organizados por seções — riscos de qualidade, cenários de teste sugeridos, próximas ações — identificados claramente como "Rascunho · Assistido por IA".

**Why this priority**: É a proposta de valor central do produto. O relatório estruturado é o que diferencia o Check-up de um chat genérico de IA.

**Independent Test**: Pode ser testado com dados mock do provider de IA, validando que o relatório renderiza corretamente em todas as seções.

**Acceptance Scenarios**:

1. **Given** o usuário confirmou a execução, **When** o sistema processa a análise, **Then** a UI exibe estado de carregamento com texto "Analisando... isso pode levar alguns instantes."
2. **Given** a análise foi concluída com sucesso, **When** o usuário visualiza o resultado, **Then** o relatório exibe badge "Rascunho · Assistido por IA" e todas as seções definidas (riscos de qualidade, requisitos ausentes/imprecisos, cenários de teste sugeridos, casos de teste sugeridos, riscos de UX/produto, notas de release readiness, próximas ações recomendadas).
3. **Given** o relatório foi gerado, **When** o usuário visualiza o resumo, **Then** o total de créditos consumidos é exibido.
4. **Given** o usuário escolheu profundidade "STANDARD" ou "DEEP", **When** visualiza o relatório, **Then** cenários de teste sugeridos estão presentes nas seções correspondentes.

---

### User Story 3 — Tratamento de Falha sem Perda de Créditos (Priority: P2)

Se a análise falhar por erro interno da plataforma, o usuário recebe mensagem clara em pt-BR e seus créditos são preservados integralmente — sem cobrança por análise não concluída.

**Why this priority**: Crítico para confiança no produto. Usuários que perdem créditos sem receber resultado abandonam a plataforma.

**Independent Test**: Pode ser testado injetando falha no provider mock e verificando que o saldo do usuário não é alterado.

**Acceptance Scenarios**:

1. **Given** o provider de IA falha durante a execução, **When** o sistema detecta o erro, **Then** exibe mensagem "Não foi possível concluir a análise. Seus créditos foram preservados." em pt-BR.
2. **Given** ocorreu falha no provider, **When** os créditos foram previamente reservados, **Then** o sistema libera os créditos reservados e não realiza captura final.
3. **Given** ocorreu falha, **When** o usuário visualiza a tela de erro, **Then** o botão "Tentar novamente" está disponível.

---

### User Story 4 — Submissão com Diferentes Tipos de Alvo (Priority: P2)

O usuário pode submeter diferentes tipos de contexto para análise: URL de landing page, descrição textual de feature, descrição de API, ou descrição de fluxo mobile. O sistema analisa o contexto fornecido pelo usuário — sem realizar crawling ou scanning ativo na URL informada.

**Why this priority**: Ampliar os casos de uso do Check-up sem aumentar risco de segurança. A análise é sempre baseada no contexto descrito pelo usuário, não em execução real.

**Independent Test**: Pode ser testado preenchendo o formulário com cada tipo de alvo disponível e verificando que o sistema aceita e processa corretamente.

**Acceptance Scenarios**:

1. **Given** o usuário seleciona "URL" como tipo de alvo, **When** informa a URL e o contexto descritivo, **Then** o sistema usa apenas o contexto informado — não acessa nem faz requisições à URL.
2. **Given** o usuário seleciona "Descrição de feature", **When** preenche o texto descritivo, **Then** o sistema aceita e processa a análise normalmente.
3. **Given** o usuário seleciona "Descrição de API", **When** informa a descrição dos endpoints, **Then** o relatório inclui cenários de API (cobertura de endpoints, cenários positivos/negativos, status codes esperados).

---

### Edge Cases

- O que acontece se o output de IA for parcialmente inválido (ex.: uma seção não parseia)? O sistema aplica fallback seguro — a seção fica vazia em vez de falhar a análise inteira.
- O que acontece se o usuário fechar o browser durante o processamento? O relatório continua sendo processado no backend; o usuário pode consultar o status via ID do run ao retornar.
- O que acontece se `userAuthorizationConfirmed` for `false` na requisição de execução? O backend rejeita com HTTP 422 sem criar AI run, sem reservar créditos.
- O que acontece se o saldo for insuficiente no momento da execução (após estimativa)? O backend rejeita com HTTP 402 sem chamar o provider de IA.
- O que acontece se o usuário enviar contexto muito extenso para profundidade "QUICK"? O sistema aceita e processa, mas o relatório pode ter escopo limitado — a profundidade escolhida define os limites de análise.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE oferecer formulário de submissão de Check-up com campos obrigatórios: tipo do alvo, valor do alvo, contexto (mínimo 20 caracteres), objetivo (mínimo 10 caracteres), profundidade, e confirmação de autorização.
- **FR-002**: O sistema DEVE oferecer campos opcionais no formulário: público-alvo, fluxos críticos, riscos conhecidos, tecnologias.
- **FR-003**: O sistema DEVE calcular e exibir estimativa de créditos antes de executar qualquer análise de IA.
- **FR-004**: O sistema DEVE exigir `userAuthorizationConfirmed: true` para iniciar qualquer execução — sem exceções.
- **FR-005**: O sistema DEVE reservar créditos antes de chamar o provider de IA.
- **FR-006**: O sistema DEVE capturar créditos definitivamente apenas após a conclusão bem-sucedida da análise.
- **FR-007**: O sistema DEVE liberar créditos reservados integralmente em caso de falha da plataforma.
- **FR-008**: O sistema DEVE rastrear o ciclo de vida do AI run: `PENDING → RUNNING → COMPLETED | FAILED`.
- **FR-009**: O sistema DEVE persistir o relatório gerado com status `DRAFT`.
- **FR-010**: O sistema DEVE aplicar fallback por seção em caso de parse parcialmente inválido do output de IA — nenhuma seção com erro deve derrubar a análise inteira.
- **FR-011**: O sistema DEVE registrar eventos de auditoria em cada etapa crítica do Check-up.
- **FR-012**: O sistema DEVE exibir o relatório identificado como "Rascunho · Assistido por IA" — nunca como resultado definitivo de testes.
- **FR-013**: O sistema DEVE oferecer estados de UI explícitos: formulário, confirmação de estimativa, carregamento, sucesso (relatório), erro.
- **FR-014**: Usuários DEVEM poder consultar o status de um Check-up em execução por ID do run, incluindo status RUNNING (sem relatório) e COMPLETED (com relatório completo).
- **FR-015**: O sistema DEVE suportar os tipos de alvo: URL, descrição de feature, descrição de API, documento, descrição de fluxo mobile, outro — sem realizar crawling ou requisições HTTP ao `targetValue` em nenhum caso.

### Key Entities

- **CheckupRequest**: Representa a submissão do usuário — tipo de alvo, valor, contexto, objetivo, profundidade, modo de output, confirmação de autorização, campos opcionais.
- **AIRun**: Rastreia o ciclo de vida de uma execução de IA — status (PENDING/RUNNING/COMPLETED/FAILED), créditos reservados, créditos capturados, timestamps, referência ao relatório.
- **CheckupReport**: Relatório estruturado persistido — status (DRAFT/REVIEWED), seções tipadas (riscos de qualidade, requisitos imprecisos, cenários sugeridos, casos de teste sugeridos, riscos de UX, notas de release readiness, próximas ações), output bruto preservado para auditoria.
- **FindingItem**: Achado individual com título, descrição e severidade (LOW/MEDIUM/HIGH/CRITICAL).
- **ScenarioItem**: Cenário de teste sugerido com título, descrição e tipo (POSITIVE/NEGATIVE/EDGE_CASE).
- **TestCaseItem**: Caso de teste com pré-condições, passos e resultado esperado.
- **ActionItem**: Próxima ação recomendada com descrição, justificativa e prioridade.
- **AuditEvent**: Registro imutável de evento relevante do sistema (CHECK_UP_REQUESTED, CHECK_UP_CREDITS_RESERVED, CHECK_UP_RUNNING, CHECK_UP_COMPLETED, CHECK_UP_FAILED, CHECK_UP_CREDITS_RELEASED).
- **CreditBalance**: Saldo de créditos do usuário — consultado antes da execução, atualizado após captura ou liberação.

### QA Artifact Impact

- **Artifacts created/updated**: Relatório de Check-up (CheckupReport), AI run (AIRun), eventos de auditoria (AuditEvent). O CheckupReport é o artefato primário — equivale a uma combinação de resumo de evidências, itens de risco, cenários de teste sugeridos e recomendações de próximas ações.
- **AI run tracking**: Obrigatório — cada execução de Check-up cria e rastreia um AIRun server-side com ciclo de vida completo.
- **Credit impact**: Estimativa exibida antes da execução; reserva pré-execução; captura definitiva somente em COMPLETED; liberação integral em FAILED.
- **Audit events**: CHECK_UP_REQUESTED, CHECK_UP_CREDITS_RESERVED, CHECK_UP_RUNNING, CHECK_UP_COMPLETED, CHECK_UP_FAILED, CHECK_UP_CREDITS_RELEASED.
- **Sensitive data handling**: Output bruto da IA preservado internamente para auditoria; relatório exibido ao usuário é o output parseado e estruturado; nenhuma API key de provider exposta em respostas de API ou no frontend.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Usuários completam o fluxo de submissão do formulário até confirmação da estimativa em menos de 3 minutos.
- **SC-002**: 100% das execuções com falha no provider preservam integralmente os créditos do usuário — zero cobranças por análises não concluídas.
- **SC-003**: O relatório estruturado é exibido em menos de 60 segundos para profundidade QUICK, menos de 120 segundos para STANDARD, e menos de 180 segundos para DEEP (tempo end-to-end incluindo processamento do provider).
- **SC-004**: 95% das análises concluídas com sucesso produzem relatório com todas as seções previstas preenchidas.
- **SC-005**: Zero ocorrências de API keys de provider de IA expostas em respostas de API ou no frontend.
- **SC-006**: 100% das execuções de Check-up geram pelo menos um evento de auditoria registrado server-side.
- **SC-007**: O sistema rejeita 100% das requisições com `userAuthorizationConfirmed: false` antes de criar AI run ou reservar créditos.
- **SC-008**: A suite de testes automatizados do backend passa com 100% de aprovação usando provider mock determinístico.

---

## Assumptions

- A autenticação do usuário é gerenciada via mock do MVP — autenticação real será implementada em bloco posterior.
- O saldo de créditos do usuário já existe no sistema (gerenciado pelo módulo de créditos existente) — este bloco não implementa compra de créditos.
- O `AiProviderPort` canônico está implementado no backend (fundação do Bloco 09) — este bloco usa a interface existente sem modificá-la.
- Streaming de resposta da IA está fora de escopo neste bloco — a execução é síncrona com polling do frontend.
- A promoção de artefatos de Check-up para o Workspace (criar projeto, módulos, requisitos a partir do relatório) está fora de escopo neste bloco.
- Exportação do relatório (PDF, etc.) está fora de escopo neste bloco.
- O sistema não realiza crawling, scanning ativo ou requisições HTTP à URL submetida pelo usuário — a análise é baseada exclusivamente no contexto textual fornecido.
- Todos os testes automatizados usam `MockAiProvider` determinístico — nenhum teste chama provider real.
- Mobile responsiveness da UI de Check-up é coberto pelo sistema de design existente — não requer testes de device farm.
- A interface de usuário do relatório exibe os dados parseados — o campo `rawAiOutput` é persistido para auditoria interna mas não exibido ao usuário.
