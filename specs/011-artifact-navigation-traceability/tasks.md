# Tasks: Workspace Artifact Navigation & Traceability Polish

**Input**: Design documents from `specs/011-artifact-navigation-traceability/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Conforme constituição FrankInTest — regras de negócio de backend requerem testes unitários;
fronteiras de API, persistência e permissão requerem testes de integração quando aplicável; fluxos
críticos de frontend requerem cobertura de componente quando aplicável. Este bloco inclui uma mudança
mínima de backend (coluna `source_ai_run_id` + preenchimento na conversão); os testes de backend
existentes devem continuar passando e os novos comportamentos devem ser cobertos.

**Organization**: Tasks agrupadas por user story para implementação e teste independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências incompletas)
- **[Story]**: A qual user story esta tarefa pertence (US1–US5)

## Path Conventions

- **Frontend**: `apps/web/src/`, `apps/web/tests/`
- **Backend**: `services/api/src/main/java/com/frankintest/api/` (mudança mínima: conversão + modelo + migration)
- **Documentação**: `specs/011-artifact-navigation-traceability/`

---

## Phase 1: Setup (Verificação de ambiente)

**Purpose**: Garantir que o ambiente está funcional antes de qualquer alteração de código

- [X] T001 Verificar que o backend sobe e os testes existentes passam: `cd services/api && mvn test`
- [X] T002 Verificar que o frontend compila sem erros: `cd apps/web && npm run build`
- [X] T003 [P] Verificar que o lint do frontend passa: `cd apps/web && npm run lint`

---

## Phase 2: Foundational — Backend sourceAiRunId (Bloqueante para US2)

**Purpose**: Adicionar o campo `sourceAiRunId` ao `WorkspaceArtifact` no backend, necessário para
construir o link "Ver relatório de origem" com o `aiRunId` correto. US2 depende desta fase.
US1, US3, US4, US5 podem iniciar em paralelo com esta fase após T010–T013.

**⚠️ CRÍTICO**: US2 (link de volta ao relatório) depende de T004–T009. US1, US3, US4, US5 dependem de T010–T013.

### Testes para a mudança de backend

- [X] T004 [P] Escrever teste de integração em `services/api/src/test/java/com/frankintest/api/conversion/` verificando que após uma conversão o `WorkspaceArtifact` criado tem `sourceAiRunId` preenchido com o `aiRunId` do `CheckupReport` de origem — escrever antes de implementar T006/T007

### Migration e modelo

- [X] T005 Criar migration Flyway em `services/api/src/main/resources/db/migration/` com nome `VNNN__add_source_ai_run_id_to_workspace_artifacts.sql` adicionando coluna `source_ai_run_id VARCHAR(255) NULL` à tabela `workspace_artifacts`; usar o próximo número de versão disponível no diretório

- [X] T006 Atualizar `services/api/src/main/java/com/frankintest/api/workspace/ArtifactReviewModels.java`: adicionar campo `sourceAiRunId` ao record `WorkspaceArtifact` (ou equivalente); manter `sourceAiRunId` na lista de campos imutáveis do PATCH (junto com `sourceCheckupReportId`, `sourceSection`, etc.)

- [X] T007 Atualizar `services/api/src/main/java/com/frankintest/api/conversion/ConversionService.java` (método que cria o artefato durante a conversão): preencher `source_ai_run_id` com `report.aiRunId()` — o `CheckupReport` já contém `aiRunId` disponível no contexto de conversão

- [X] T008 Atualizar `services/api/src/main/java/com/frankintest/api/workspace/ArtifactReviewService.java` (ou Repository): incluir `source_ai_run_id` no SELECT e mapeamento para o modelo

- [X] T009 Atualizar `apps/web/src/lib/artifacts/artifactTypes.ts`: adicionar `sourceAiRunId: string | null` ao tipo `WorkspaceArtifact`; ajustar também `sourceCheckupReportId: string | null`, `sourceSection: string | null`, `sourceItemIndex: number | null` para precisão de tipos

### Localização de pontos de extensão (frontend)

- [X] T010 Identificar o componente de layout/sidebar do Workspace que engloba as rotas `/workspace/*` — inspecionar `apps/web/src/app/workspace/` e layout existente para localizar o ponto correto de inserção do link "Revisão de Artefatos"
- [X] T011 [P] Confirmar que `apps/web/src/app/checkup/[runId]/page.tsx` renderiza `CheckupConversionPanel`; confirmar que a página **não** tem `orgId`/`token` próprios — a integração de `CheckupArtifactsSection` precisará adotar `DEFAULT_ORG` (`process.env.NEXT_PUBLIC_DEFAULT_ORG_ID ?? 'org_demo_personal'`) e `getDevToken()` do mesmo padrão usado em `apps/web/src/app/workspace/artifacts/page.tsx`; identificar o ponto de inserção da seção (abaixo do `CheckupConversionPanel`)
- [X] T012 [P] Confirmar que `apps/web/src/components/workspace/WorkspaceArtifactDetailPanel.tsx` contém a seção "Rastreabilidade (somente leitura)" com `ReadOnlyField` existentes — linha de referência: `ReadOnlyField label="Relatório de origem"`
- [X] T013 [P] Confirmar que `apps/web/src/app/workspace/artifacts/page.tsx` usa `useEffect` com `filters` como dependência e aceita `sourceCheckupReportId` no estado de filtros

**Checkpoint**: `sourceAiRunId` disponível no backend e no tipo TypeScript (T004–T009 completos) — US2 pode iniciar. Pontos de extensão frontend mapeados (T010–T013 completos) — US1, US3, US4, US5 podem iniciar.

---

## Phase 3: User Story 1 — Navegar do relatório de Check-up para seus artefatos (Priority: P1) 🎯 MVP

**Goal**: Adicionar seção "Artefatos criados a partir deste relatório" na página do relatório de Check-up,
listando artefatos vinculados com link de navegação para a lista filtrada

**Independent Test**: Abrir `/checkup/[runId]` de um run com artefatos convertidos e verificar que a
seção aparece com a lista correta; abrir um run sem artefatos e verificar o estado vazio em pt-BR

**Depende de**: T011 (confirmação do ponto de inserção e padrão de orgId/token)

### Tests para User Story 1

- [X] T014 [P] [US1] Escrever teste de componente para `CheckupArtifactsSection` em `apps/web/tests/` (ou `apps/web/src/`) cobrindo: (a) renderização da lista quando `listArtifacts` retorna artefatos, (b) estado vazio quando retorna lista vazia, (c) presença do link para `/workspace/artifacts?sourceCheckupReportId=<id>` — mockar `listArtifacts`

### Implementation para User Story 1

- [X] T015 [US1] Criar componente `CheckupArtifactsSection` em `apps/web/src/app/checkup/[runId]/CheckupArtifactsSection.tsx` que: recebe props `reportId: string`, `orgId: string`, `token: string`; chama `listArtifacts(orgId, token, { sourceCheckupReportId: reportId })`; renderiza lista de artefatos com `title`, tipo (via `ARTIFACT_TYPE_LABELS`) e status (via `ARTIFACT_STATUS_LABELS`); cada item é um `<Link>` para `/workspace/artifacts?sourceCheckupReportId=${reportId}`; exibe estado vazio "Nenhum artefato criado a partir deste relatório ainda. Converta itens do relatório acima para criar artefatos." quando lista vazia
- [X] T016 [US1] Integrar `CheckupArtifactsSection` em `apps/web/src/app/checkup/[runId]/page.tsx`: (1) adicionar `const DEFAULT_ORG = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID ?? 'org_demo_personal'` e `const token = getDevToken() ?? ''` no componente (mesmo padrão de `workspace/artifacts/page.tsx`); (2) importar `CheckupArtifactsSection`; (3) renderizá-lo dentro do bloco `status.status === "completed"` abaixo do `CheckupConversionPanel`, passando `reportId={report.id}`, `orgId={DEFAULT_ORG}` e `token={token}`
- [X] T017 [US1] Garantir que todo o copy da seção está em pt-BR: título "Artefatos criados a partir deste relatório", estado vazio, rótulos de tipo e status

**Checkpoint**: User Story 1 funcional e testável de forma independente

---

## Phase 4: User Story 2 — Navegar de um artefato de volta ao relatório de origem (Priority: P1)

**Goal**: Adicionar lógica de três estados para o link de origem no painel de detalhes do artefato:
(1) link clicável "Ver relatório de origem" quando `sourceAiRunId` disponível;
(2) texto desabilitado "Relatório de origem não disponível" quando `sourceCheckupReportId` existe mas `sourceAiRunId` é nulo;
(3) nenhum elemento quando `sourceCheckupReportId` é nulo/vazio

**Independent Test**: Painel de artefato com `sourceAiRunId` → link presente apontando para `/checkup/${sourceAiRunId}`; com `sourceCheckupReportId` mas sem `sourceAiRunId` → texto desabilitado; sem nenhum → sem elemento de origem

**Depende de**: T004–T009 (backend `sourceAiRunId` + tipo TypeScript)

### Tests para User Story 2

- [X] T018 [P] [US2] Escrever teste de componente para `WorkspaceArtifactDetailPanel` em `apps/web/tests/` cobrindo: (a) presença do link "Ver relatório de origem" quando `sourceAiRunId` não-nulo — `href` aponta para `/checkup/${sourceAiRunId}`, (b) exibição de "Relatório de origem não disponível" como texto desabilitado quando `sourceCheckupReportId` preenchido mas `sourceAiRunId` nulo, (c) ausência de qualquer elemento de origem quando `sourceCheckupReportId` nulo/vazio

### Implementation para User Story 2

- [X] T019 [US2] Atualizar `apps/web/src/components/workspace/WorkspaceArtifactDetailPanel.tsx`: na seção "Rastreabilidade (somente leitura)", substituir o `ReadOnlyField label="Relatório de origem"` atual pela lógica de três estados: (1) `artifact.sourceAiRunId` presente → `<Link href={`/checkup/${artifact.sourceAiRunId}`} className="text-sm text-blue-600 underline hover:text-blue-800">Ver relatório de origem</Link>`; (2) `artifact.sourceCheckupReportId` presente mas `sourceAiRunId` nulo → `<span aria-disabled="true" className="text-xs text-gray-400 cursor-not-allowed">Relatório de origem não disponível</span>`; (3) `sourceCheckupReportId` nulo/vazio → não renderizar nada. Adicionar `import Link from 'next/link'` se não existir. **NÃO usar `sourceCheckupReportId` como `runId` na URL** — são IDs distintos.
- [X] T020 [US2] Garantir que o link "Ver relatório de origem" usa estilo de link (texto azul, underline), não um botão, e que o texto desabilitado não é clicável (sem `href`, sem `onClick`)
- [X] T021 [US2] Verificar que `sourceAiRunId` **não** aparece como campo bruto exibido no painel — ele é usado apenas para construir a URL do link, não como `ReadOnlyField` visível

**Checkpoint**: User Stories 1 e 2 funcionais — rastreabilidade bidirecional completa com URL correta

---

## Phase 5: User Story 3 — Ver metadados de origem em linguagem amigável (Priority: P2)

**Goal**: Substituir exibição crua de `sourceSection` (string) e `sourceItemIndex` (número 0-based)
por labels amigáveis em pt-BR no painel de detalhes do artefato

**Independent Test**: Painel com `sourceSection="Riscos de qualidade"` e `sourceItemIndex=0` → exibe "Riscos de qualidade" e "Item de origem #1"; `sourceSection=null` → "Seção de origem não informada"

**Depende de**: T012 (confirmação da seção de rastreabilidade existente); sequencial após T019 (US2 — mesmo arquivo)

### Tests para User Story 3

- [X] T022 [P] [US3] Estender teste de componente de `WorkspaceArtifactDetailPanel` cobrindo: (a) `sourceSection` não-nulo → exibido diretamente, (b) `sourceSection` nulo/vazio → "Seção de origem não informada", (c) `sourceItemIndex=0` → "Item de origem #1", (d) `sourceItemIndex=2` → "Item de origem #3", (e) `sourceItemIndex=null` → campo não renderizado, (f) `aiAssisted=true` → badge "Gerado com IA" presente

### Implementation para User Story 3

- [X] T023 [US3] Atualizar `apps/web/src/components/workspace/WorkspaceArtifactDetailPanel.tsx`: substituir `ReadOnlyField label="Seção" value={artifact.sourceSection}` por: `const sectionLabel = artifact.sourceSection?.trim() || "Seção de origem não informada"` e renderizar `<ReadOnlyField label="Seção de origem" value={sectionLabel} />`
- [X] T024 [US3] Atualizar `apps/web/src/components/workspace/WorkspaceArtifactDetailPanel.tsx`: substituir `ReadOnlyField label="Índice do item" value={String(artifact.sourceItemIndex)}` por lógica condicional: se `artifact.sourceItemIndex != null`, renderizar `<ReadOnlyField label="Posição no relatório" value={`Item de origem #${artifact.sourceItemIndex + 1}`} />`; caso contrário, não renderizar o campo
- [X] T025 [US3] Verificar que o badge "Assistido por IA" no header do painel (`artifact.aiAssisted && <span>Assistido por IA</span>`) já existe e está correto em pt-BR — preservar sem alteração

**Checkpoint**: User Stories 1, 2 e 3 funcionais — painel de detalhes com rastreabilidade amigável completa

---

## Phase 6: User Story 4 — Acessar área de revisão de artefatos pela navegação do Workspace (Priority: P2)

**Goal**: Adicionar link "Revisão de Artefatos" visível na navegação principal do Workspace,
apontando para `/workspace/artifacts`

**Independent Test**: Navegar para qualquer rota autenticada do Workspace e verificar que o link
"Revisão de Artefatos" está visível e leva para `/workspace/artifacts`

**Depende de**: T010 (localização do componente de layout/nav do Workspace)

### Tests para User Story 4

- [X] T026 [P] [US4] Escrever teste de componente para o componente de navegação/layout do Workspace cobrindo: (a) presença de link "Revisão de Artefatos", (b) `href` aponta para `/workspace/artifacts`

### Implementation para User Story 4

- [X] T027 [US4] Localizar o componente de layout/sidebar/nav do Workspace (identificado em T010) e adicionar `<Link href="/workspace/artifacts">Revisão de Artefatos</Link>` como item de navegação, posicionado no grupo adequado (ex.: "QA" ou após "Control Tower"), com estilo consistente com os outros links de navegação existentes
- [X] T028 [US4] Garantir que o link é visível em todas as rotas autenticadas do Workspace (não apenas na home do workspace); verificar que não requer estado ativo especial para aparecer

**Checkpoint**: User Stories 1, 2, 3 e 4 funcionais — navegação completa

---

## Phase 7: User Story 5 — Filtrar artefatos por relatório de origem via URL query param (Priority: P2)

**Goal**: A página `/workspace/artifacts` lê `sourceCheckupReportId` da URL na montagem e
pré-popula o filtro, exibindo banner de contexto com ação "Ver todos os artefatos"

**Independent Test**: Acessar `/workspace/artifacts?sourceCheckupReportId=rpt_test` → banner "Exibindo artefatos do relatório: rpt_test" + lista filtrada; clicar "Ver todos os artefatos" → filtro limpo

**Depende de**: T013 (confirmação da page de artefatos)

### Tests para User Story 5

- [X] T029 [P] [US5] Escrever teste de componente para `WorkspaceArtifactsPage` em `apps/web/tests/` cobrindo: (a) quando `searchParams` contém `sourceCheckupReportId`, o filtro é inicializado com esse valor, (b) banner de filtro ativo aparece com o ID do relatório, (c) botão "Ver todos os artefatos" limpa o filtro e oculta o banner — mockar `listArtifacts` e `useSearchParams`

### Implementation para User Story 5

- [X] T030 [US5] Atualizar `apps/web/src/app/workspace/artifacts/page.tsx`: adicionar `import { useSearchParams } from 'next/navigation'`; ler `const searchParams = useSearchParams()`; extrair `const initialReportId = searchParams.get('sourceCheckupReportId') ?? undefined`; inicializar `useState<filters>` com `{ sourceCheckupReportId: initialReportId }` em vez de `{}`
- [X] T031 [US5] Adicionar banner de filtro ativo em `apps/web/src/app/workspace/artifacts/page.tsx`: renderizar abaixo do `<h1>` quando `filters.sourceCheckupReportId` estiver definido: `<div className="..."><span>Exibindo artefatos do relatório: {filters.sourceCheckupReportId}</span><button onClick={clearReportFilter}>Ver todos os artefatos</button></div>`
- [X] T032 [US5] Implementar `clearReportFilter` em `apps/web/src/app/workspace/artifacts/page.tsx`: (a) `setFilters({})` para limpar o estado da page; (b) passar prop `onClearReportFilter: () => void` para `WorkspaceArtifactList` — quando chamada, executa `setReportFilter('')` no filho; (c) se o reset interno do filho não for suficiente, aplicar `key={JSON.stringify(filters)}` no `WorkspaceArtifactList` como fallback para forçar re-montagem limpa. Usar a abordagem de prop como primeira opção.
- [X] T033 [US5] Adicionar a prop `onClearReportFilter?: () => void` à interface `Props` de `apps/web/src/components/workspace/WorkspaceArtifactList.tsx`: quando chamada, executar `setReportFilter('')`. Garantir que o filtro via input de texto e o filtro inicial via query param coexistem sem conflito.

**Checkpoint**: Todas as 5 user stories funcionais — feature completa

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Garantia de qualidade transversal e preparação do run report

- [X] T034 [P] Confirmar que `apps/web/src/lib/artifacts/artifactTypes.ts` foi atualizado em T009 com `sourceAiRunId: string | null`, `sourceCheckupReportId: string | null`, `sourceSection: string | null`, `sourceItemIndex: number | null`; se T009 ainda não foi executado, executá-lo aqui
- [X] T035 [P] Verificar que todos os textos introduzidos estão em pt-BR: "Artefatos criados a partir deste relatório", "Nenhum artefato criado a partir deste relatório ainda.", "Ver relatório de origem", "Relatório de origem não disponível", "Seção de origem não informada", "Item de origem #N", "Revisão de Artefatos", "Exibindo artefatos do relatório:", "Ver todos os artefatos"
- [X] T036 [P] Verificar que nenhum campo de rastreabilidade (`sourceCheckupReportId`, `sourceAiRunId`, `sourceSection`, `sourceItemIndex`, `aiAssisted`) foi tornado editável — confirmar ausência de `<input>`, `<select>` ou `<textarea>` para esses campos no painel de detalhes; confirmar que `sourceAiRunId` está na lista de campos imutáveis do PATCH em `ArtifactReviewModels.java`
- [X] T037 [P] Verificar que artefatos pré-migration (com `sourceAiRunId = null` e `sourceCheckupReportId` não-nulo) exibem "Relatório de origem não disponível" como texto desabilitado — não link clicável — conforme edge case da spec
- [X] T038 [P] Executar `cd apps/web && npm run lint` e corrigir todos os erros de lint introduzidos pelas mudanças deste bloco
- [X] T039 [P] Executar `cd apps/web && npm run build` e confirmar build de produção sem erros
- [X] T040 [P] Executar `cd services/api && mvn test` e confirmar que: (a) todos os testes de backend existentes continuam passando; (b) o novo teste de integração T004 passa — `ConversionService` preenche `sourceAiRunId` corretamente; (c) o filtro por `sourceCheckupReportId` retorna apenas artefatos da organização autenticada — verificar nas queries do `WorkspaceArtifactRepository` que `organization_id` é sempre parte das condições WHERE
- [X] T041 Executar o fluxo completo de validação manual descrito em `specs/011-artifact-navigation-traceability/quickstart.md` (10 passos do fluxo end-to-end)
- [X] T042 Produzir run report com: arquivos alterados/criados, funcionalidades implementadas, regras de negócio preservadas, testes adicionados, comandos de validação executados, limitações conhecidas, atualizações de roadmap/status, mensagem de commit sugerida

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — iniciar imediatamente
- **Foundational/Backend (Phase 2)**: Depende da Phase 1 — T004–T009 bloqueiam US2; T010–T013 bloqueiam US1, US3, US4, US5
- **US1 (Phase 3)**: Depende de T011 — independente de T004–T009
- **US2 (Phase 4)**: Depende de T004–T009 (`sourceAiRunId` no backend + tipo TS) e de T012
- **US3 (Phase 5)**: Depende de T012; **sequencial após T019** (mesmo arquivo `WorkspaceArtifactDetailPanel.tsx`)
- **US4 (Phase 6)**: Depende de T010 — independente de US1, US2, US3
- **US5 (Phase 7)**: Depende de T013 — independente de US1, US2, US3, US4
- **Polish (Phase 8)**: Depende de todas as user stories desejadas

### User Story Dependencies

- **US1 (P1)**: `CheckupArtifactsSection.tsx` (novo) + `checkup/[runId]/page.tsx` — independente do backend `sourceAiRunId`
- **US2 (P1)**: `WorkspaceArtifactDetailPanel.tsx` — **depende de T004–T009** (requer `sourceAiRunId` no tipo e no backend)
- **US3 (P2)**: `WorkspaceArtifactDetailPanel.tsx` — **sequencial após US2** (mesmo arquivo, implementar após T019)
- **US4 (P2)**: layout/nav do Workspace — independente de US1, US2, US3
- **US5 (P2)**: `workspace/artifacts/page.tsx` + `WorkspaceArtifactList.tsx` — independente de US1, US2, US3, US4

### Within Each User Story

- Testes antes da implementação quando viável (TDD para componentes novos)
- US2 e US3 editam o mesmo arquivo — implementar US2 (T018–T021) antes de US3 (T022–T025) para evitar conflito de merge

### Parallel Opportunities

- T001, T002, T003 (Setup): paralelos entre si
- T004, T005 (Foundational backend início): paralelos entre si
- T006, T007, T008 dependem de T005 (migration primeiro) — sequenciais após T005
- T010, T011, T012, T013 (localização de pontos de extensão): paralelos entre si
- US1 (T014–T017), US4 (T026–T028), US5 (T029–T033): paralelos entre si após T010–T013
- US2 (T018–T021): paralelo com US1/US4/US5 após T004–T009

---

## Parallel Example: Após Phase 2 (com dois desenvolvedores)

```bash
# Developer A — Backend sourceAiRunId (bloqueia US2)
Task T005: Migration SQL source_ai_run_id
Task T006: ArtifactReviewModels.java — adicionar campo
Task T007: ConversionService.java — preencher sourceAiRunId
Task T008: ArtifactReviewService.java — mapear sourceAiRunId no SELECT
Task T009: artifactTypes.ts — adicionar sourceAiRunId ao tipo

# Developer B (em paralelo com Dev A) — US1 + US5
Task T011: Confirmar ponto de inserção + padrão orgId/token em checkup/[runId]/page.tsx
Task T015: Criar CheckupArtifactsSection.tsx
Task T016: Integrar na page de checkup com DEFAULT_ORG e getDevToken()
Task T030: Ler sourceCheckupReportId de useSearchParams em workspace/artifacts/page.tsx

# Após Phase 2 completa — Developer A assume US2 + US3
Task T018: Escrever teste US2 (WorkspaceArtifactDetailPanel — 3 estados)
Task T019: Implementar lógica de 3 estados com sourceAiRunId em WorkspaceArtifactDetailPanel.tsx
Task T022: Estender teste US3 (sourceSection, sourceItemIndex amigáveis)
Task T023: Implementar sectionLabel em WorkspaceArtifactDetailPanel.tsx

# Developer B continua com US4
Task T026: Escrever teste US4 (nav link "Revisão de Artefatos")
Task T027: Adicionar link no layout do Workspace
```

---

## Implementation Strategy

### MVP First (User Stories 1 e 2 — rastreabilidade bidirecional core)

1. Completar Phase 1: Setup
2. Completar Phase 2: T004–T009 (backend `sourceAiRunId`) + T010–T013 (localização de pontos de extensão)
3. Completar Phase 3 (US1): Seção de artefatos no relatório de Check-up (T014–T017)
4. Completar Phase 4 (US2): Link "Ver relatório de origem" com `sourceAiRunId` correto (T018–T021)
5. **PARAR e VALIDAR**: rastreabilidade bidirecional funcionando de ponta a ponta com URL correta
6. Continuar com US3 (T022–T025), US4 (T026–T028), US5 (T029–T033) para polimento

### Incremental Delivery

1. Setup + Phase 2 backend → `sourceAiRunId` disponível no artefato
2. US1 (T014–T017) + US2 (T018–T021) → rastreabilidade bidirecional core (MVP deste bloco)
3. US3 (T022–T025) → metadados amigáveis no painel
4. US4 (T026–T028) → navegação principal do Workspace
5. US5 (T029–T033) → filtro por query param
6. Polish (T034–T042) → lint, build, run report

---

## Notes

- `[P]` = arquivos diferentes, sem dependências incompletas — pode rodar em paralelo
- US2 e US3 editam o mesmo arquivo (`WorkspaceArtifactDetailPanel.tsx`) — implementar sequencialmente
- `sourceCheckupReportId` ≠ `aiRunId` — **não usar `sourceCheckupReportId` como `runId` na URL** — sempre usar `sourceAiRunId`
- Backend tem mudança mínima (1 coluna + ConversionService + Controller) — testes existentes devem passar; novos testes cobrem `sourceAiRunId`
- Artefatos pré-migration com `sourceAiRunId = null` exibem "Relatório de origem não disponível" — comportamento correto
- Nenhum provedor de IA é chamado — sem necessidade de mocks de IA
- Não commitar automaticamente — o desenvolvedor humano commita manualmente
- Parar em qualquer checkpoint para validar a user story de forma independente
- Evitar: tarefas vagas, conflito no mesmo arquivo em paralelo, dependências cruzadas que quebrem independência
