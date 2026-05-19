# Research: Workspace Artifact Navigation & Traceability Polish

**Feature**: 011-artifact-navigation-traceability
**Date**: 2026-05-19

---

## Decision 1: Navegação principal do Workspace — ponto de entrada para `/workspace/artifacts`

**Decision**: Adicionar um link direto "Revisão de Artefatos" na navegação do Workspace Dashboard (sidebar/top-nav existente), apontando para a rota `/workspace/artifacts` já existente.

**Rationale**: O arquivo `workspaceNavigation.ts` define `workspaceNavigationTargets[]` com 16 entradas para rotas do tipo hash (`#workspace-...`), mas `/workspace/artifacts` é uma rota Next.js separada — não um hash anchor. O padrão correto é adicionar um link externo independente do sistema de hashes, semelhante ao menu lateral. A navegação por hash serve ao workspace de seção única; artefatos são uma página distinta e já têm rota própria.

**Alternatives considered**:
- Adicionar entrada no `workspaceNavigationTargets[]` com hash falso → rejeitado: o sistema de hashes serve a anchorings no workspace dashboard, não a rotas Next.js separadas. Misturar os dois quebraria o modelo de navegação.
- Criar uma rota hash dentro do workspace dashboard para artefatos → rejeitado: a página de artefatos já existe em `/workspace/artifacts` (Bloco 14); duplicar o conteúdo como seção hash seria retrabalho desnecessário.

---

## Decision 2: Seção "Artefatos criados a partir deste relatório" na página do Check-up

**Decision**: Adicionar um componente `CheckupArtifactsSection` na página `/checkup/[runId]/page.tsx`, renderizado abaixo do `CheckupConversionPanel`, que chama `listArtifacts` com `sourceCheckupReportId=report.id` e exibe a lista filtrada ou estado vazio.

**Rationale**: O `report.id` já está disponível no estado da página (via `status.report`). O endpoint `GET /api/workspace/artifacts?sourceCheckupReportId=...` já existe e suporta esse filtro. Não é necessário novo endpoint — apenas um novo componente de frontend consumindo a infraestrutura existente.

**Alternatives considered**:
- Novo endpoint `GET /api/checkup/{reportId}/artifacts` → rejeitado: infraestrutura duplicada. O endpoint de listagem com filtro já cobre o caso; criar um endpoint dedicado agrega complexidade sem ganho real no MVP.
- Mostrar a contagem apenas (sem lista) → rejeitado: o usuário precisa ver o nome/tipo/status dos artefatos para navegar até eles diretamente.

---

## Decision 3: Metadados de origem e link "Ver relatório de origem" no painel de detalhes

**Decision**: Substituir os `ReadOnlyField` atuais com valores crus por apresentação amigável com três estados para o link de origem:

1. `sourceCheckupReportId` não-nulo **e** `aiRunId` resolvível → link clicável "Ver relatório de origem" apontando para `/checkup/${aiRunId}`
2. `sourceCheckupReportId` não-nulo **mas** `aiRunId` não resolvível (relatório excluído/inacessível) → texto desabilitado "Relatório de origem não disponível"
3. `sourceCheckupReportId` nulo/vazio → nenhum elemento de origem exibido

- `sourceSection`: exibir diretamente (string livre pt-BR); se nulo/vazio → "Seção de origem não informada"
- `sourceItemIndex`: converter 0-based → 1-based, exibir como "Item de origem #N"
- `aiAssisted`: badge "Gerado com IA" (já existe, preservado)

**Rationale**: A clarificação Q2 definiu explicitamente o comportamento de texto desabilitado para relatório inacessível — não silenciar nem criar link quebrado.

**Descoberta crítica — IDs distintos**: A rota `/checkup/[runId]` usa `aiRunId` (ID do `AiRun`). O campo `sourceCheckupReportId` no artefato é o `id` do `CheckupReport` — um UUID diferente. Não é possível construir o link `/checkup/[runId]` usando apenas `sourceCheckupReportId` sem primeiro resolver o `aiRunId` correspondente. O `CheckupRepository` possui `findByAiRunId` e `findById(reportId)` — este último retorna o `CheckupReport` que contém o `aiRunId`. O `CheckupController` expõe apenas `GET /api/checkup/runs/{aiRunId}` — não há endpoint para resolver `reportId → aiRunId` atualmente.

**Solução planejada**: Adicionar endpoint `GET /api/checkup/reports/{reportId}/run-id` no backend (ou incluir `aiRunId` na resposta de listagem de artefatos) para que o frontend possa resolver o `aiRunId` a partir do `sourceCheckupReportId` antes de renderizar o link. O endpoint deve validar autenticação e escopo de organização. Alternativamente, o `WorkspaceArtifact` pode incluir um campo `sourceAiRunId` preenchido no momento da conversão — isso elimina a necessidade de round-trip adicional e é a solução preferida para MVP.

**Alternativas consideradas**:
- Link sempre clicável usando `sourceCheckupReportId` diretamente como `runId` → rejeitado: `sourceCheckupReportId` é o `reportId`, não o `aiRunId`; link resultaria em 404 garantido ou comportamento incorreto.
- Tratar 404 na página de destino → rejeitado: o problema não é o relatório inexistente, é que o ID errado seria usado na URL mesmo quando o relatório existe.
- Ocultar completamente o link → rejeitado pela clarificação Q2.
- Incluir `aiRunId` no campo `sourceAiRunId` do artefato (preenchido na conversão) → preferido: elimina round-trip, reutiliza dado já disponível na conversão.

**Implementação nota**: O `ConversionService` já tem acesso ao `aiRunId` via `report.aiRunId()` durante a conversão (`CheckupReport` contém `aiRunId`). A solução mais simples é incluir `sourceAiRunId` no `WorkspaceArtifact` preenchido na conversão — sem novo endpoint, sem round-trip. Isso requer: (1) adição de coluna `source_ai_run_id` na tabela `workspace_artifacts`, (2) preenchimento no `ConversionService`, (3) exposição no `ArtifactReviewController`. **Esta é uma mudança de backend mínima e cirúrgica.**

**Alternatives considered**:
- Novo endpoint `GET /api/checkup/reports/{reportId}/run-id` → possível, mas adiciona endpoint extra quando a informação já pode vir com o artefato.
- Chamar `GET /api/workspace/artifacts` com `sourceCheckupReportId` e extrair `sourceAiRunId` da resposta → preferido via campo no modelo.

---

## Decision 4: Filtro de artefatos por relatório de origem via URL query param

**Decision**: A página `/workspace/artifacts` deve ler o query param `sourceCheckupReportId` da URL na montagem inicial e pré-popular o filtro correspondente, exibindo um banner de contexto "Exibindo artefatos do relatório [ID curto]" quando o filtro estiver ativo, com botão "Ver todos" para limpar.

**Rationale**: O endpoint backend já suporta `?sourceCheckupReportId=`. O frontend `listArtifacts()` já constrói o parâmetro. O que falta é: (1) ler o query param na inicialização da página, (2) exibir contexto visual do filtro ativo, (3) fornecer ação para removê-lo. A implementação usa `useSearchParams()` do Next.js no componente de página.

**Alternatives considered**:
- Estado global / Context API para passar o filtro entre páginas → rejeitado: query param na URL é a abordagem correta para filtros persistentes e compartilháveis (bookmarkable, navegável com back/forward).
- Filtro por relatório como dropdown em vez de input de texto → não alterado: o campo de texto existente já funciona; a melhoria é apenas inicializá-lo a partir do query param.

---

## Decision 5: Localização do link para `/workspace/artifacts` na navegação

**Decision**: Adicionar o link no componente de layout do Workspace (que renderiza a sidebar/nav), não no arquivo `workspaceNavigation.ts`. O link deve ser visível em todas as rotas autenticadas do Workspace.

**Rationale**: `workspaceNavigation.ts` serve ao sistema de navegação por hash dentro do Workspace Dashboard. O link para `/workspace/artifacts` é uma rota Next.js separada e deve usar `<Link href="/workspace/artifacts">` convencional. O local correto é no componente de layout que engloba as rotas do Workspace.

**Alternatives considered**:
- Adicionar link apenas na Control Tower do workspace dashboard → rejeitado: não satisfaz FR-001 ("visível em todas as rotas autenticadas do Workspace").

---

## Unknowns Resolved

| Unknown | Resolution |
|---|---|
| Onde fica o layout/sidebar do Workspace? | Precisa ser verificado em `apps/web/src/app/workspace/` ou layout raiz |
| `sourceSection` é enum ou string? | String livre pt-BR (clarificação Q1) |
| Relatório deletado: ocultar ou mostrar mensagem? | Texto desabilitado "Relatório de origem não disponível" quando inacessível (clarificação Q2); link clicável apenas quando `sourceAiRunId` presente e relatório acessível |
| Verificação de acessibilidade do relatório precisa de round-trip? | Não — desde que `sourceAiRunId` seja armazenado no artefato na conversão; o link é construído diretamente de `/checkup/${sourceAiRunId}` sem chamada extra |
| `sourceCheckupReportId` pode ser usado diretamente como `runId` na URL? | **Não** — são IDs distintos. `sourceCheckupReportId` = `CheckupReport.id`; rota `/checkup/[runId]` usa `AiRun.id` (`aiRunId`). Solução: adicionar `sourceAiRunId` ao `WorkspaceArtifact` |
