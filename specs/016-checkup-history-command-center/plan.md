# Implementation Plan: Check-up History & Project Command Center

**Branch**: `012-checkup-history-command-center` | **Date**: 2026-05-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/016-checkup-history-command-center/spec.md`

## Summary

Adicionar dois endpoints de leitura ao backend (`GET /api/checkup/runs` e `GET /api/checkup/runs/summary`) e uma nova página de histórico ao frontend (`/checkup/history`) com Command Center no topo e lista paginada de execuções abaixo. Nenhum schema novo, nenhuma chamada ao provedor de IA, nenhuma alteração de lógica de créditos.

## Technical Context

**Language/Version**: Java 21+ Spring Boot (`services/api`) + Next.js/TypeScript (`apps/web`)

**Primary Dependencies**: Spring Boot, JdbcTemplate, PostgreSQL, Next.js, Tailwind CSS

**Storage**: PostgreSQL — tabelas existentes `ai_runs`, `checkup_reports`, `workspace_artifacts`

**Testing**: Testes de integração no backend (`CheckupControllerTest`); componentes e lint no frontend

**Target Platform**: Linux server (backend), browser (frontend)

**Project Type**: FrankInTest vertical slice — `services/api` (backend) + `apps/web` (frontend)

**Performance Goals**: Lista carrega em < 2 segundos para organizações com até 100 Check-ups (SC-002)

**Constraints**: Sem novas tabelas, sem chamadas de IA, sem alteração de endpoints existentes, sem auto-refresh

**Scale/Scope**: MVP — volume pequeno por organização; paginação simples offset/limit

## Constitution Check

- **Architecture boundary** ✅ — UX em `apps/web`, lógica de negócio/persistência/permissões em `services/api`, PostgreSQL como fonte de verdade, sem novos serviços isolados.
- **Modular monolith** ✅ — Todos os novos endpoints ficam dentro do módulo `checkup` do Spring Boot existente. Nenhum microserviço.
- **Responsibility boundary** ✅ — Filtro por `organizationId` validado no backend. Frontend apenas renderiza. Nenhuma decisão de permissão no cliente.
- **AI governance** ✅ — Nenhuma chamada ao provedor de IA. Nenhum novo AI run. Sem impacto em créditos.
- **Security/LGPD** ✅ — Todos os endpoints exigem JWT + `X-Organization-Id`. Dados isolados por organização. Sem dados de outras orgs expostos.
- **Product language** ✅ — Todo novo copy na UI em pt-BR. Nenhum texto em en/es.
- **Testing discipline** ✅ — Novos métodos de repository e service cobertos por testes de integração. Frontend com lint + build.
- **Execution discipline** ✅ — Sem refactors não solicitados. Sem alterações em endpoints existentes. Escopo traceable.

## Project Structure

### Documentation (this feature)

```text
specs/016-checkup-history-command-center/
├── plan.md              # Este arquivo
├── research.md          # Pesquisa da codebase existente
├── data-model.md        # Modelo de dados e queries
├── quickstart.md        # Comandos de validação
├── contracts/
│   └── api.md           # Contratos dos dois endpoints
└── tasks.md             # Gerado pelo /speckit-tasks
```

### Source Code

```text
services/api/
├── src/main/java/com/frankintest/api/
│   ├── airuns/
│   │   ├── AiRunModels.java          # Adicionar novos records de resposta
│   │   └── AiRunRepository.java      # Adicionar findByOrganizationAndFeature, count
│   └── checkup/
│       ├── CheckupModels.java         # Adicionar CheckupRunListItem, CheckupRunsPage, CheckupRunsSummary
│       ├── CheckupService.java        # Adicionar listRuns, getRunsSummary
│       └── CheckupController.java     # Adicionar GET /runs e GET /runs/summary
└── src/test/java/com/frankintest/api/
    └── checkup/
        └── CheckupControllerTest.java  # Testes dos novos endpoints

apps/web/
├── src/
│   ├── app/
│   │   ├── checkup/
│   │   │   └── history/
│   │   │       ├── page.tsx                      # Página principal (Command Center + Lista)
│   │   │       └── components/
│   │   │           ├── CommandCenterPanel.tsx     # Bloco de resumo no topo
│   │   │           ├── CheckupHistoryList.tsx     # Tabela/lista paginada
│   │   │           └── CheckupHistoryItem.tsx     # Linha individual (opcional)
│   │   └── components/
│   │       └── WorkspaceDashboard.tsx             # Adicionar link "Histórico de Check-ups"
│   └── lib/
│       └── checkup/
│           ├── checkupApi.ts          # Adicionar listCheckupRuns, getCheckupRunsSummary
│           └── checkupTypes.ts        # Adicionar CheckupRunListItem, CheckupRunsPage, CheckupRunsSummary
└── src/app/workspaceNavigation.ts     # Adicionar entrada "Histórico de Check-ups"
```

**Structure Decision**: Extensão do módulo `checkup` existente no backend e nova subpasta `history/` sob `app/checkup/` no frontend. Nenhum novo módulo raiz. Nenhuma migração de schema.

## Complexity Tracking

> Nenhuma violação da Constitution detectada. Tabela não aplicável.

---

## Referências

- [spec.md](./spec.md) — Especificação funcional completa com clarificações
- [research.md](./research.md) — Pesquisa da codebase: entidades, controllers, repositories existentes
- [data-model.md](./data-model.md) — Records Java novos, queries, mapeamento de status
- [contracts/api.md](./contracts/api.md) — Contratos dos endpoints e tipos TypeScript
- [quickstart.md](./quickstart.md) — Comandos de validação e fluxo de teste manual
