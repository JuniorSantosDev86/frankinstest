# Feature Specification: FrankInDrift — Drift Detection Foundation

**Feature Branch**: `017-frankindrift-foundation`

**Created**: 2026-05-20

**Status**: Draft

**Input**: Bloco 17 — FrankInDrift: Drift Detection Foundation

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Drift Status no Detalhe do Artefato (Priority: P1)

Um QA que converteu itens de um relatório de Check-up em artefatos de Workspace, e depois editou esses artefatos, acessa a tela de detalhe ou revisão de um artefato e quer saber imediatamente se o artefato ainda está alinhado com o que foi gerado pelo AI originalmente. Sem essa informação, o QA perde confiança na cadeia de rastreabilidade ao longo do tempo.

**Why this priority**: É o núcleo do FrankInDrift. Sem visibilidade de drift no artefato, todo o restante desta fundação não entrega valor concreto. Habilita a detecção básica de desalinhamento sem qualquer chamada de AI.

**Independent Test**: Pode ser testado criando um artefato derivado de um relatório de Check-up, editando seu título, e verificando que o indicador "Possível drift" aparece na tela de detalhe do artefato. Entrega valor imediato: o usuário consegue identificar que um artefato foi alterado desde sua criação.

**Acceptance Scenarios**:

1. **Dado** que um artefato foi criado a partir de um item de relatório de Check-up e não foi editado, **Quando** o usuário acessa o detalhe do artefato, **Então** o indicador exibe "Sem drift detectado".
2. **Dado** que um artefato foi criado e seu título ou descrição foi posteriormente alterado, **Quando** o usuário acessa o detalhe do artefato, **Então** o indicador exibe "Possível drift" com a razão "Título ou descrição editados após criação".
3. **Dado** que um artefato teve seu status alterado de RASCUNHO para outro estado, **Quando** o usuário acessa o detalhe do artefato, **Então** o indicador exibe "Possível drift" com a razão "Status alterado desde a criação".
4. **Dado** que um artefato possui múltiplos sinais de drift ativos, **Quando** o usuário acessa o detalhe do artefato, **Então** o indicador exibe o status mais severo e lista todas as razões detectadas.
5. **Dado** que um artefato não foi criado a partir de um relatório de Check-up (sem rastreabilidade de origem), **Quando** o usuário acessa o detalhe do artefato, **Então** nenhum indicador de drift é exibido para esse artefato.
6. **Dado** que o artefato pertence a uma organização diferente da do usuário autenticado, **Quando** a solicitação de status de drift é feita, **Então** o sistema retorna erro 404 — não revela a existência do artefato fora do escopo da organização autenticada.

---

### User Story 2 — Resumo de Drift de um Relatório de Check-up (Priority: P2)

Um QA revisando um relatório de Check-up quer ver um painel resumido mostrando quantos e quais artefatos derivados daquele relatório apresentam drift, quais ainda estão alinhados, e se há itens do relatório que nunca geraram artefatos.

**Why this priority**: Permite visão consolidada da saúde da rastreabilidade de todo um ciclo de Check-up. Sem isso, o usuário teria que verificar artefato por artefato.

**Independent Test**: Pode ser testado acessando a página de um relatório de Check-up com artefatos em diferentes estados de drift e verificando que o resumo exibe as contagens corretas por status.

**Acceptance Scenarios**:

1. **Dado** um relatório de Check-up com artefatos derivados em diferentes estados de drift, **Quando** o usuário acessa a página do relatório, **Então** o resumo de drift exibe a contagem de artefatos por status: "Sem drift", "Possível drift", "Rastreabilidade incompleta", "Origem indisponível".
2. **Dado** um relatório de Check-up cujos itens relevantes não geraram nenhum artefato, **Quando** o usuário acessa o resumo de drift, **Então** o resumo exibe uma seção "Itens sem artefato criado" com a contagem de itens não convertidos.
3. **Dado** um relatório de Check-up que pertence a outra organização, **Quando** a solicitação de resumo de drift é feita, **Então** o sistema retorna erro 404 — não revela a existência do relatório fora do escopo da organização autenticada. 403 é reservado exclusivamente para `X-Organization-Id` ausente ou inválido.
4. **Dado** um relatório de Check-up sem nenhum artefato derivado, **Quando** o usuário acessa o resumo de drift, **Então** exibe estado vazio com mensagem em pt-BR indicando que nenhum artefato foi criado a partir deste relatório.

---

### User Story 3 — Rastreabilidade Incompleta e Origem Indisponível (Priority: P3)

Um QA que está auditando a integridade dos artefatos de Workspace quer identificar quais artefatos têm campos de rastreabilidade ausentes (sem referência ao relatório ou item de origem) ou cujo relatório de origem não está mais acessível na organização atual.

**Why this priority**: Garante que a fundação de drift também cobre os casos de degradação de rastreabilidade — não apenas edições, mas também falhas de integridade estrutural.

**Independent Test**: Pode ser testado verificando um artefato com `sourceCheckupReportId` presente e `sourceItemIndex` ausente, confirmando que o indicador exibe "Rastreabilidade incompleta"; e verificando um artefato com `sourceCheckupReportId` que aponta para um relatório inacessível na organização, confirmando "Relatório de origem indisponível". Artefatos sem `sourceCheckupReportId` estão fora do escopo de drift e o endpoint retorna 404.

**Acceptance Scenarios**:

1. **Dado** um artefato derivado de Check-up com `sourceCheckupReportId` presente mas `sourceItemIndex` ausente ou inválido, **Quando** o usuário acessa o detalhe do artefato, **Então** o indicador exibe "Rastreabilidade incompleta" com razão clara em pt-BR.
2. **Dado** um artefato cujo `sourceCheckupReportId` aponta para um relatório de Check-up que não pode ser acessado na organização atual, **Quando** o usuário acessa o detalhe do artefato, **Então** o indicador exibe "Relatório de origem indisponível".
3. **Dado** um artefato com rastreabilidade completa e relatório de origem acessível e sem edições, **Quando** o usuário acessa o detalhe do artefato, **Então** o indicador exibe "Sem drift detectado".

---

### Edge Cases

- O que acontece quando um artefato foi criado mas imediatamente editado no mesmo segundo? → Qualquer alteração após a criação conta como drift; não há período de graça.
- Como o sistema trata artefatos criados manualmente (não derivados de Check-up)? → Nenhum indicador de drift é exibido. Drift Detection Foundation aplica-se exclusivamente a artefatos com `sourceCheckupReportId` preenchido.
- O que acontece quando vários sinais de drift estão ativos simultaneamente? → O status exibido é o mais severo (hierarquia: `RELATORIO_INDISPONIVEL` > `RASTREABILIDADE_INCOMPLETA` > `POSSIVEL_DRIFT` > `SEM_DRIFT`), e todas as razões são listadas.
- O que acontece quando o relatório de Check-up de origem é de outra organização? → O sistema trata como indisponível (não vaza dados de outras organizações).
- O que acontece quando o backend não consegue calcular o status de drift (erro inesperado)? → O backend retorna HTTP 500. O frontend trata qualquer resposta não-2xx do endpoint de drift como erro não-bloqueante: o artefato continua exibido normalmente e o indicador de drift mostra estado discreto em pt-BR ("Não foi possível calcular drift agora"). O backend deve registrar o erro de forma segura sem vazar dados sensíveis. Casos de domínio esperados (`RASTREABILIDADE_INCOMPLETA`, `RELATORIO_INDISPONIVEL`) continuam retornando 200 com `driftStatus` específico — somente falhas técnicas inesperadas retornam 500.
- O que acontece quando não há artefatos derivados de um relatório? → O resumo de drift exibe estado vazio em pt-BR.

---

## Clarifications

### Session 2026-05-20

- Q: Como o sinal `STATUS_CHANGED` detecta o status original — invariante de negócio, campo `originalStatus` ou audit log? → A: Invariante de negócio: todo artefato derivado de Check-up nasce com status `DRAFT` (`RASCUNHO` é apenas o rótulo pt-BR). `STATUS_CHANGED = artifact.status != ArtifactStatus.DRAFT`. Nenhum campo extra, nenhuma migration de snapshot, nenhuma leitura de audit log neste bloco.
- Q: Quais tipos de item do relatório são "relevantes" para o sinal `MISSING_ARTIFACTS` — lista estática, todos os itens, ou derivado do Bloco 13? → A: Derivado do Bloco 13: itens elegíveis = itens que satisfazem as regras de elegibilidade/mapeamento da conversão do Bloco 13. FrankInDrift não mantém lista duplicada; reutiliza a regra centralizada. Correlação usa `organizationId` + `sourceCheckupReportId` + `sourceSection` + `sourceItemIndex`. `sourceAiRunId` é auxiliar de navegação — não é chave de correlação de drift.
- Q: Frontend consome drift via chamada separada ou bundled no payload do artefato? → A: Chamada separada e não-bloqueante após carregamento do artefato. Endpoints de drift são dedicados — payload do artefato (Bloco 14) não é alterado. Falha de drift não bloqueia visualização do artefato; UI exibe estado discreto em pt-BR. Sem polling neste bloco.
- Q: O que o backend retorna quando o cálculo de drift falha por erro técnico inesperado — 200 com campo `error`, 500 ou 503? → A: HTTP 500 com corpo genérico. Frontend trata qualquer não-2xx como erro não-bloqueante e exibe mensagem discreta em pt-BR. Casos de domínio esperados continuam retornando 200 com driftStatus específico. Backend loga o erro sem vazar dados sensíveis.
- Q: Índice de banco de dados para suportar cálculo de drift — criar neste bloco, adiar, ou apenas o índice genérico de org? → A: Criar neste bloco: índice composto `(organization_id, source_checkup_report_id)` em `workspace_artifacts` com `IF NOT EXISTS`. `organization_id` primeiro (todas as queries são org-scoped). Índice complementar `(organization_id, source_ai_run_id)` somente se plano de execução evidenciar necessidade.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE calcular o status de drift de um artefato derivado de Check-up sob demanda, sem chamar nenhum provedor de AI.
- **FR-002**: O sistema DEVE classificar o drift de cada artefato em um dos seguintes status: `SEM_DRIFT`, `POSSIVEL_DRIFT`, `RASTREABILIDADE_INCOMPLETA`, `RELATORIO_INDISPONIVEL`.
- **FR-003**: O sistema DEVE detectar o sinal `EDITED_AFTER_CREATION` quando o título ou descrição de um artefato foram alterados após sua criação. No MVP, a detecção usa `updatedAt > createdAt` como proxy determinístico — qualquer atualização no artefato (inclusive mudança de status) aciona este proxy, podendo coexistir com `STATUS_CHANGED` quando uma mudança de status também altera `updatedAt`. Refinamento por comparação campo-a-campo contra o conteúdo original do relatório fica para pós-MVP. Não criar snapshot de `title`/`description`; não usar audit log; não chamar AI.
- **FR-004**: O sistema DEVE detectar o sinal `STATUS_CHANGED` quando `artifact.status != DRAFT`. `RASCUNHO` é o rótulo pt-BR do estado inicial; no código Java, enum e banco o valor canônico é `DRAFT` (ex.: `ArtifactStatus.DRAFT`). Todos os artefatos derivados de Check-up nascem com status `DRAFT` por invariante de negócio — não há campo `originalStatus` nem leitura de audit log; a comparação direta `artifact.status != ArtifactStatus.DRAFT` é a implementação canônica neste bloco.
- **FR-005**: O sistema DEVE detectar o sinal `INCOMPLETE_TRACEABILITY` quando um artefato **possui** `source_checkup_report_id` (é derivado de Check-up) mas está sem `sourceItemIndex` (`source_item_index` ausente ou nulo). Artefatos sem `source_checkup_report_id` estão fora do escopo de drift e o endpoint retorna 404 — não disparam este sinal.
- **FR-006**: O sistema DEVE detectar o sinal `SOURCE_UNAVAILABLE` quando o `sourceCheckupReportId` de um artefato não resolve para um relatório acessível na organização atual.
- **FR-007**: O sistema DEVE detectar o sinal `MISSING_ARTIFACTS` no nível do relatório quando itens elegíveis do relatório de Check-up não geraram nenhum artefato. Um item é elegível quando satisfaz as mesmas regras de elegibilidade/mapeamento usadas pelo Bloco 13 na conversão. O FrankInDrift NÃO deve manter lista de tipos separada; deve reutilizar ou referenciar a regra centralizada do Bloco 13. A correlação usa `organizationId` + `sourceCheckupReportId` + `sourceSection` + `sourceItemIndex`. `sourceAiRunId` é coluna auxiliar de navegação e NÃO deve ser usada como chave de correlação no cálculo de MISSING_ARTIFACTS.
- **FR-008**: O sistema DEVE expor um endpoint **dedicado** para consultar o status de drift de um artefato individual, protegido por JWT e validação de `X-Organization-Id`. Este endpoint é separado do endpoint de detalhe do artefato (Bloco 14) — o payload do artefato NÃO deve ser alterado neste bloco.
- **FR-009**: O sistema DEVE expor um endpoint **dedicado** para consultar o resumo de drift de todos os artefatos derivados de um relatório de Check-up, protegido por JWT e validação de `X-Organization-Id`. Este endpoint é separado dos endpoints de relatório existentes.
- **FR-010**: O sistema DEVE aplicar isolamento de organização em todos os cálculos e respostas de drift — nenhum dado de outra organização pode ser exposto.
- **FR-011**: O frontend DEVE exibir o indicador de drift (label + razão) na tela de detalhe/revisão de artefatos derivados de Check-up. O status de drift DEVE ser buscado por chamada separada e não-bloqueante após o carregamento principal do artefato. Se a chamada de drift falhar, a UI continua exibindo o artefato normalmente e mostra estado discreto em pt-BR ("Não foi possível calcular drift agora"). Não implementar polling neste bloco — um refresh manual dispara nova chamada ao endpoint de drift.
- **FR-012**: O frontend DEVE exibir o resumo de drift na página de relatório de Check-up.
- **FR-013**: Todos os textos e labels de drift exibidos ao usuário DEVEM estar em pt-BR.
- **FR-014**: O sistema DEVE exibir estados vazios e mensagens de erro em pt-BR para todas as telas relacionadas ao drift.
- **FR-015**: O sistema DEVE preservar todos os fluxos existentes: histórico de Check-up, página de relatório, conversão de itens em artefatos, revisão de artefatos, edição de artefatos e links de rastreabilidade.
- **FR-016**: O sistema DEVE preservar as fronteiras de responsabilidade do FrankInTest: UX em `apps/web`; regras de negócio, persistência, permissões, isolamento de organização, auditoria e segurança em `services/api`.
- **FR-017**: O cálculo de drift DEVE ser apenas leitura — nenhuma mutação de dados de artefato ou relatório deve ocorrer durante o cálculo.
- **FR-018**: Nenhum crédito de AI deve ser consumido por operações de drift neste bloco.
- **FR-019**: Quando o cálculo de drift falhar por erro técnico inesperado (ex.: timeout de DB, exceção não tratada), o endpoint de drift DEVE retornar HTTP 500 com corpo genérico. O backend DEVE registrar o erro de forma segura, sem vazar dados sensíveis no response. Casos de domínio esperados (`RASTREABILIDADE_INCOMPLETA`, `RELATORIO_INDISPONIVEL`) DEVEM continuar retornando 200 com `driftStatus` específico — somente falhas técnicas retornam 500.
- **FR-020**: Este bloco DEVE criar um índice composto `(organization_id, source_checkup_report_id)` na tabela `workspace_artifacts` usando `IF NOT EXISTS` na migration. `organization_id` DEVE ser a primeira coluna pois todas as consultas de drift são org-scoped. Não depender apenas de índice genérico em `organization_id`. Se o plano de execução evidenciar necessidade, avaliar índice complementar `(organization_id, source_ai_run_id)`.

### Key Entities

- **DriftStatus**: Status computado de drift para um artefato. Calculado sob demanda, não persistido. Valores: `SEM_DRIFT`, `POSSIVEL_DRIFT`, `RASTREABILIDADE_INCOMPLETA`, `RELATORIO_INDISPONIVEL`.
- **DriftSignal**: Sinal individual que contribuiu para o DriftStatus. Contém um código de sinal (`EDITED_AFTER_CREATION`, `STATUS_CHANGED`, `INCOMPLETE_TRACEABILITY`, `SOURCE_UNAVAILABLE`) e uma mensagem de razão legível ao usuário.
- **DriftResult**: Resposta completa para um artefato — contém `DriftStatus` + lista de `DriftSignal` ativos + identificador do artefato.
- **DriftSummary**: Agregação de drift para um relatório de Check-up. Contém contagens por status de drift, lista de itens do relatório sem artefatos criados (`MISSING_ARTIFACTS`) e total de artefatos analisados.
- **Artifact** *(existente)*: Artefato de Workspace. Campos relevantes para drift: `sourceCheckupReportId`, `sourceItemIndex` (coluna DB: `source_item_index`, INTEGER — índice posicional do item no relatório), `createdAt`, `updatedAt`, `status`, `title`, `description`.
- **CheckupReport** *(existente)*: Relatório de Check-up. Campos relevantes: `id`, `organizationId`, `items`.

### QA Artifact Impact

- **Artifacts created/updated**: Nenhum artefato novo criado. A funcionalidade lê artefatos e relatórios existentes e retorna status computados. Pode-se considerar "drift finding" como tipo conceitual de artefato, mas não persiste neste bloco.
- **AI run tracking**: Não aplicável — nenhuma chamada a provedor de AI.
- **Credit impact**: Sem impacto de crédito — operação é exclusivamente de leitura e cálculo determinístico.
- **Audit events**: Consultas de drift não requerem eventos de auditoria adicionais neste bloco (são operações de leitura não sensíveis). Violações de acesso entre organizações devem ser logadas pelo filtro de autenticação existente.
- **Sensitive data handling**: Respostas de drift não devem vazar dados (título, descrição, itens) de artefatos ou relatórios de outras organizações. Recursos de outra organização retornam 404 (não revela existência). 403 é reservado para `X-Organization-Id` ausente ou inválido.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Usuários conseguem visualizar o status de drift de qualquer artefato derivado de Check-up em menos de 2 segundos após abrir a tela de detalhe do artefato. O índice composto `(organization_id, source_checkup_report_id)` na tabela `workspace_artifacts` é pré-requisito para atingir este target sem seq scan.
- **SC-002**: 100% dos cálculos de drift respeitam o isolamento de organização — nenhuma consulta retorna dados de uma organização diferente da do usuário autenticado.
- **SC-003**: Zero chamadas a provedores de AI são introduzidas por este bloco — confirmado por análise do código e testes de integração.
- **SC-004**: Todos os fluxos existentes (histórico de Check-up, página de relatório, conversão, revisão, edição e rastreabilidade de artefatos) continuam funcionando sem regressão após a entrega deste bloco.
- **SC-005**: Usuários conseguem visualizar o resumo de drift de um relatório de Check-up com todos os artefatos classificados por status em uma única tela.
- **SC-006**: 100% dos textos de status e razão de drift exibidos na UI estão em pt-BR, sem textos em inglês ou outros idiomas.
- **SC-007**: Os testes de backend cobrem os 5 sinais de drift definidos — 4 sinais de artefato (`EDITED_AFTER_CREATION`, `STATUS_CHANGED`, `INCOMPLETE_TRACEABILITY`, `SOURCE_UNAVAILABLE`) + 1 sinal de relatório (`MISSING_ARTIFACTS`) — o cálculo de hierarquia de severidade e o isolamento de organização.

---

## Assumptions

- O status de drift é calculado sob demanda (on-read) e não é persistido no banco de dados neste bloco. Persistência pode ser adicionada em blocos futuros se performance exigir.
- Qualquer alteração em `title` ou `description` após a criação do artefato conta como drift — não há período de graça (0 segundos).
- "Itens elegíveis" de um relatório de Check-up para o sinal `MISSING_ARTIFACTS` são os itens que satisfazem as mesmas regras de elegibilidade/mapeamento do Bloco 13 (conversão de itens em artefatos). O FrankInDrift não mantém lista de tipos separada — reutiliza ou referencia a regra centralizada do Bloco 13. Quando o Bloco 13 aceitar novos tipos no futuro, o FrankInDrift acompanha automaticamente sem alteração de código próprio. A elegibilidade não é inferida por histórico de conversões de outras organizações.
- Um artefato é "derivado de Check-up" se e somente se seu campo `sourceCheckupReportId` está preenchido. Artefatos sem `sourceCheckupReportId` estão fora do escopo de drift.
- O relatório de origem é considerado "indisponível" se o `sourceCheckupReportId` do artefato não retorna um relatório acessível para a organização do usuário autenticado — seja por inexistência, deleção ou pertencer a outra organização.
- A hierarquia de severidade dos sinais de drift é: `RELATORIO_INDISPONIVEL` > `RASTREABILIDADE_INCOMPLETA` > `POSSIVEL_DRIFT` > `SEM_DRIFT`.
- Quando múltiplos sinais de drift estão ativos, todos são listados como razões, mas o status exibido é o de maior severidade.
- Não há paginação para o resumo de drift de um relatório neste bloco; o volume de artefatos por relatório é limitado pelo tamanho do relatório de Check-up.
- O frontend consumirá os endpoints de drift por chamada separada e não-bloqueante, disparada após o carregamento principal do artefato ou da página. O payload do endpoint de detalhe do artefato (Bloco 14) não é alterado. Em caso de falha, o artefato continua exibido normalmente e o indicador de drift mostra estado discreto em pt-BR. Não há polling — após edição de artefato, um refresh manual dispara nova chamada de drift.
- Este bloco inclui a criação de índice composto `(organization_id, source_checkup_report_id)` em `workspace_artifacts` via migration com `IF NOT EXISTS`. `organization_id` é a primeira coluna pois todas as queries de drift são org-scoped. Índice complementar `(organization_id, source_ai_run_id)` será avaliado apenas se o plano de execução evidenciar necessidade real.
- Não há integração com sistemas externos (GitHub, Jira, etc.) neste bloco.
- A infraestrutura de JWT, `X-Organization-Id`, CORS, rate limiting e boundaries de LGPD existentes são preservadas sem alteração.
- Todo artefato derivado de Check-up nasce com status `DRAFT` (`RASCUNHO` em pt-BR) por invariante de negócio. O sinal `STATUS_CHANGED` é calculado comparando `artifact.status != ArtifactStatus.DRAFT`. Nenhum campo `originalStatus` deve ser criado neste bloco. Se futuros fluxos de criação admitirem status inicial diferente, isso será tratado em bloco dedicado.
