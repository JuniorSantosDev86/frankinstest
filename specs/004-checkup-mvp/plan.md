# Implementation Plan: FrankInTest Check-up MVP

**Branch**: `004-checkup-mvp` | **Date**: 2026-05-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/004-checkup-mvp/spec.md`

---

## Summary

Implementar o primeiro fluxo vendável do FrankInTest Check-up — da submissão de contexto ao relatório estruturado de QA gerado por IA, com controle de créditos e rastreabilidade de execução. O backend expõe três endpoints REST (`/estimate`, `/run`, `/runs/{id}`), orquestra créditos via `CreditService` existente, chama a IA via `AiProviderPort` canônico, persiste o relatório como rascunho com fallback por seção, e registra eventos de auditoria. O frontend entrega formulário, estimativa, polling e exibição do relatório — tudo em pt-BR, sem chamadas diretas a providers.

---

## Technical Context

**Language/Version**: Next.js 14 + TypeScript em `apps/web`; Java 21 + Spring Boot em `services/api`

**Primary Dependencies**:
- Frontend: Next.js, Tailwind CSS, React hooks para polling
- Backend: Spring Boot, Spring JDBC, Jackson (JSONB), AiProviderPort (existente), CreditService (existente), AuditService (existente), AiRunService (existente)

**Storage**: PostgreSQL — nova tabela `checkup_reports` com colunas JSONB para as seções do relatório

**Testing**:
- Backend: JUnit 5 + Spring Boot Test + MockAiProvider determinístico
- Frontend: Jest + React Testing Library; `npm run lint`, `npm test`, `npm run build`

**Target Platform**: Linux server (Docker Compose local), Next.js em Vercel (produção futura)

**Project Type**: FrankInTest vertical slice — `services/api` (módulo `checkup`) + `apps/web` (rota `/checkup`)

**Performance Goals**: Relatório QUICK em < 60s; STANDARD em < 120s; DEEP em < 180s (incluindo tempo de resposta do provider)

**Constraints**: Nenhuma API key de provider no frontend. Sem crawling/scanning de URL. Auth mock do MVP mantido. Sem streaming de IA. Sem promoção para Workspace neste bloco.

**Scale/Scope**: MVP — usuário único por execução, sem concorrência de múltiplos runs simultâneos do mesmo usuário como gate de negócio neste bloco.

---

## Constitution Check

| Princípio | Status | Observação |
|-----------|--------|-----------|
| Arquitetura boundary (apps/web + services/api + PostgreSQL) | ✅ PASS | Módulo `checkup` em `services/api`; UI em `apps/web`; PostgreSQL via tabela `checkup_reports` |
| Monolito modular (sem microserviços) | ✅ PASS | `checkup` é um módulo dentro do Spring Boot existente |
| Fronteiras de responsabilidade | ✅ PASS | Credits, AI orchestration, audit, persistence — todos no backend |
| Governança de IA e créditos | ✅ PASS | AI run rastreado server-side; estimativa antes da execução; créditos liberados em falha; MockAiProvider nos testes |
| Segurança / LGPD / auditoria | ✅ PASS | Sem API key no frontend; sem crawling; `userAuthorizationConfirmed` obrigatório; 6 eventos de auditoria |
| Idioma pt-BR | ✅ PASS | Todos os textos de UI novos em pt-BR |
| Disciplina de testes | ✅ PASS | Unit + integration tests no backend; component tests no frontend |
| Escopo pequeno e rastreável | ✅ PASS | Vertical slice focado; sem refactors não relacionados |

**Resultado**: Sem violações. Pode prosseguir para implementação.

---

## Project Structure

### Documentation (this feature)

```text
specs/004-checkup-mvp/
├── plan.md              # Este arquivo
├── spec.md              # Especificação funcional
├── research.md          # Decisões e fundamentos técnicos
├── data-model.md        # Entidades, schema SQL, enums
├── quickstart.md        # Guia de execução local e validação
├── contracts/
│   └── api.md           # Contratos REST dos 3 endpoints
└── tasks.md             # Gerado por /speckit-tasks (próxima etapa)
```

### Source Code (repository root)

```text
services/api/
├── src/main/java/com/frankintest/api/
│   ├── checkup/
│   │   ├── CheckupController.java
│   │   ├── CheckupService.java
│   │   ├── CheckupModels.java
│   │   ├── CheckupRepository.java
│   │   ├── CheckupPromptBuilder.java
│   │   ├── CheckupReportParser.java
│   │   └── CheckupCreditEstimator.java
│   └── airuns/
│       └── AiRunModels.java         (extensão: enum checkup, enum checkup_report, campo rawOutput: String no record AiRun)
└── src/test/java/com/frankintest/api/
    └── checkup/
        ├── CheckupEstimateControllerTest.java
        ├── CheckupRunControllerTest.java
        ├── CheckupCreditFlowTest.java
        ├── CheckupAuditEventTest.java
        └── CheckupReportParserTest.java

apps/web/
└── src/
    ├── app/
    │   └── checkup/
    │       ├── page.tsx                  (formulário + estimativa + confirmação)
    │       └── [runId]/
    │           └── page.tsx              (loading + relatório + erro)
    └── lib/
        └── checkup/
            ├── checkupApi.ts             (funções de chamada ao backend)
            ├── checkupTypes.ts           (tipos TypeScript do domínio)
            └── useCheckupPolling.ts      (hook de polling do status)

infra/
└── docker-compose.yml                   (sem alteração — PostgreSQL já presente)

services/api/src/main/resources/db/migration/
└── V004__checkup_reports.sql            (nova migration)
```

---

## Complexity Tracking

> Sem violações de constituição — seção não aplicável.
