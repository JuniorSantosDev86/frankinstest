# Implementation Plan: Workspace Artifact Navigation & Traceability Polish

**Branch**: `011-artifact-navigation-traceability` | **Date**: 2026-05-19 | **Spec**: [spec.md](spec.md)

## Summary

Melhorar a navegação e rastreabilidade entre relatórios de Check-up e artefatos de Workspace, adicionando: (1) link "Revisão de Artefatos" na navegação do Workspace, (2) seção de artefatos vinculados na página do relatório de Check-up, (3) apresentação amigável de metadados de origem no painel de detalhes do artefato com link correto para o relatório, e (4) filtro pré-populado via query param `sourceCheckupReportId` na página de artefatos.

**Mudança de backend mínima necessária (descoberta de análise)**: A rota `/checkup/[runId]` usa `aiRunId` (ID do `AiRun`), mas `sourceCheckupReportId` no artefato é o `reportId` do `CheckupReport` — IDs distintos. Para construir o link "Ver relatório de origem" corretamente, o campo `sourceAiRunId` deve ser adicionado ao `WorkspaceArtifact` e preenchido durante a conversão a partir de `CheckupReport.aiRunId`. Isso requer: (a) migration SQL adicionando coluna `source_ai_run_id` à tabela `workspace_artifacts`, (b) atualização do `ConversionService` para preencher o campo, (c) exposição pelo `ArtifactReviewController` e (d) atualização do tipo `WorkspaceArtifact` no frontend. Sem essa mudança, o link de navegação de volta ao relatório não pode ser implementado corretamente.

## Technical Context

**Language/Version**: Next.js 14+ / TypeScript em `apps/web`; Java 21 / Spring Boot em `services/api` (alteração mínima de backend para `sourceAiRunId`)

**Primary Dependencies**: Next.js, React, Tailwind CSS, `next/navigation` (`useSearchParams`, `Link`); backend: Flyway (migration SQL), Spring JDBC (consulta existente)

**Storage**: PostgreSQL — **1 migration necessária**: adicionar coluna `source_ai_run_id VARCHAR NULL` à tabela `workspace_artifacts`

**Testing**: Testes de componente React para novos componentes; testes de integração de backend para a migration e para o `ConversionService` preenchendo `sourceAiRunId`; testes backend existentes devem continuar passando

**Target Platform**: Web (desktop-first, responsivo)

**Performance Goals**: Sem alvo quantitativo novo; nova coluna não indexada (lida por artefato individual, não usada em filtros de listagem)

**Constraints**: Sem chamadas ao provedor de IA; `sourceAiRunId` é imutável como os demais campos de rastreabilidade; copy exclusivamente em pt-BR; nenhum redesign amplo do Workspace

**Scale/Scope**: MVP — até 200 artefatos por listagem (limite existente)

**Project Type**: FrankInTest vertical slice — `apps/web` (frontend) + `services/api` (migration + ConversionService + ArtifactReviewController + tipo frontend)

## Constitution Check

- **Architecture boundary**: ✅ UI em `apps/web`, backend em `services/api`. Este bloco toca apenas frontend. Nenhuma lógica de negócio migrada para o frontend.
- **Modular monolith**: ✅ Mudança de backend é cirúrgica — 1 coluna SQL, 1 campo no `ConversionService`, 1 campo exposto no `ArtifactReviewController`. Sem novo serviço, sem novo módulo.
- **Responsibility boundary**: ✅ Permissões, persistência e scoping de organização permanecem no backend. `sourceAiRunId` é preenchido e validado no backend; o frontend apenas lê e constrói a URL de navegação.
- **AI governance**: ✅ Nenhuma chamada ao provedor de IA introduzida. Sem AI runs, sem créditos consumidos.
- **Security/LGPD**: ✅ JWT e `X-Organization-Id` preservados em todas as chamadas de API. O filtro por `sourceCheckupReportId` é aplicado dentro do escopo da organização autenticada no backend.
- **Product language**: ✅ Todo o copy novo em pt-BR: "Revisão de Artefatos", "Artefatos criados a partir deste relatório", "Ver relatório de origem", "Seção de origem não informada", "Item de origem #N", "Ver todos os artefatos".
- **Testing discipline**: ✅ Migration de backend coberta por teste de integração. `ConversionService` preenchendo `sourceAiRunId` coberto por teste de unidade/integração. Novos componentes frontend cobertos por testes de componente quando aplicável. Lint e build de produção como gate obrigatório.
- **Execution discipline**: ✅ Escopo pequeno e rastreável. Sem refactors não relacionados. Sem mudanças de arquitetura.

## Project Structure

### Documentation (this feature)

```text
specs/011-artifact-navigation-traceability/
├── plan.md              ← este arquivo
├── spec.md              ← especificação funcional
├── research.md          ← decisões de pesquisa e design
├── data-model.md        ← modelo de dados e regras de apresentação
├── quickstart.md        ← guia de desenvolvimento e validação
├── contracts/
│   └── api-contracts.md ← contratos de API e navegação
└── tasks.md             ← gerado por /speckit-tasks (próximo passo)
```

### Source Code (repository root)

```text
apps/web/
├── src/
│   ├── app/
│   │   ├── checkup/
│   │   │   └── [runId]/
│   │   │       ├── page.tsx                    ← adicionar CheckupArtifactsSection
│   │   │       └── CheckupArtifactsSection.tsx ← NOVO componente
│   │   └── workspace/
│   │       ├── layout.tsx (ou equivalente)     ← adicionar link "Revisão de Artefatos"
│   │       └── artifacts/
│   │           └── page.tsx                    ← ler query param, exibir banner de filtro
│   └── components/
│       └── workspace/
│           └── WorkspaceArtifactDetailPanel.tsx ← melhorar apresentação de rastreabilidade

services/api/
├── src/main/java/com/frankintest/api/
│   ├── conversion/
│   │   └── ConversionService.java          ← preencher sourceAiRunId na conversão
│   └── workspace/
│       ├── ArtifactReviewController.java   ← expor sourceAiRunId nas respostas
│       ├── ArtifactReviewModels.java       ← adicionar sourceAiRunId ao modelo
│       └── ArtifactReviewService.java      ← mapear sourceAiRunId do banco
├── src/main/resources/db/migration/
│   └── VNNN__add_source_ai_run_id_to_workspace_artifacts.sql  ← NOVA migration
└── src/test/java/com/frankintest/api/
    ├── conversion/
    │   └── ConversionServiceTest.java      ← verificar preenchimento de sourceAiRunId
    └── workspace/
        └── ArtifactReviewServiceTest.java  ← verificar mapeamento de sourceAiRunId
```

**Structure Decision**: Mudança de backend mínima e cirúrgica (1 coluna, 3 arquivos Java, 1 migration) + frontend (3-4 arquivos existentes + 1 novo componente). O campo `sourceAiRunId` é imutável como os demais campos de rastreabilidade e não requer novo endpoint.

## Complexity Tracking

Sem violações da constituição. Nenhuma entrada necessária.
