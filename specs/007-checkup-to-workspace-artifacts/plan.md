# Implementation Plan: Check-up to Workspace Artifacts

**Branch**: `007-checkup-to-workspace-artifacts` | **Date**: 2026-05-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/007-checkup-to-workspace-artifacts/spec.md`

---

## Summary

Permitir que usuários convertam itens selecionados de um relatório de Check-up concluído em artefatos do Workspace (Requisitos, Cenários de Teste, Casos de Teste, Itens de Risco, Ações de QA), com pré-visualização antes de confirmar. A conversão é determinística (sem IA), atômica, idempotente e rastreável. Dois novos endpoints REST no backend Spring Boot. UI de pré-visualização e confirmação integrada à página de relatório do Check-up existente.

---

## Technical Context

**Language/Version**: Java 21 + Spring Boot (services/api); Next.js 14 + TypeScript (apps/web)

**Primary Dependencies**: Spring Boot, JdbcTemplate, PostgreSQL, Jackson, Spring Security (JWT), Next.js, React

**Storage**: PostgreSQL — nova tabela `workspace_artifacts`; colunas adicionais em `test_scenarios` e `test_cases`

**Testing**: Backend — JUnit 5 + Spring Boot Test (unit para service, integration para controller e DB); Frontend — lint + build

**Target Platform**: Linux server (local dev via Docker Compose)

**Performance Goals**: Preview e confirm respondem em < 500ms para relatórios com até 30 itens (sem chamada de IA, apenas leitura + escrita em PostgreSQL local)

**Constraints**: Sem chamada ao provedor de IA; sem billing; sem integrações externas; UI em pt-BR; JWT + X-Organization-Id em todos os endpoints

**Scale/Scope**: MVP — um módulo backend (`conversion/`), dois endpoints, um componente frontend, dois arquivos de lib

---

## Constitution Check

- **Architecture boundary**: ✅ UI em `apps/web`, lógica de negócio em `services/api`, PostgreSQL como fonte de verdade, Docker Compose em `infra/`.
- **Modular monolith**: ✅ Novo módulo `conversion/` dentro do monolito Spring Boot existente. Sem microserviços.
- **Responsibility boundary**: ✅ Backend é a autoridade para permissões, persistência, guard de elegibilidade, atomicidade, idempotência e auditoria. Frontend não envia `projectId` nem decide sobre duplicatas.
- **AI governance**: ✅ Nenhuma chamada ao provedor de IA neste bloco. Sem `AiRunService` envolvido. Sem consumo de créditos.
- **Security/LGPD**: ✅ JWT + X-Organization-Id validados em todos os endpoints. Acesso ao relatório verificado por `organization_id`. Auditoria de conversão registrada em `audit_log`. Sem dados sensíveis no frontend.
- **Product language**: ✅ Toda UI em pt-BR. Nenhum texto em en/es.
- **Testing discipline**: ✅ `ConversionServiceTest` para regras de negócio. `ConversionControllerIntegrationTest` para auth, org validation, fluxo completo. Frontend: lint + build.
- **Execution discipline**: ✅ Escopo limitado ao módulo `conversion/`. Sem refactors não relacionados. Sem alterações no fluxo de Check-up existente.

---

## Project Structure

### Documentation (this feature)

```text
specs/007-checkup-to-workspace-artifacts/
├── plan.md              ← este arquivo
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── conversion-api.md   ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit-tasks)
```

### Source Code

```text
services/api/src/main/java/com/frankintest/api/
├── conversion/                                    ← NOVO MÓDULO
│   ├── ConversionModels.java                      ← DTOs: request, response, enums
│   ├── ConversionController.java                  ← endpoints /preview e /confirm
│   ├── ConversionService.java                     ← lógica de negócio, @Transactional
│   ├── WorkspaceArtifactRepository.java           ← JdbcTemplate para workspace_artifacts
│   └── ConversionTraceabilityHelper.java          ← detecção de alreadyConverted
├── checkup/                                       ← SEM ALTERAÇÃO
└── ...

services/api/src/main/resources/db/
└── schema.sql                                     ← ADD COLUMN + CREATE TABLE

services/api/src/test/java/com/frankintest/api/
└── conversion/                                    ← NOVOS TESTES
    ├── ConversionServiceTest.java
    └── ConversionControllerIntegrationTest.java

apps/web/src/
├── lib/conversion/                                ← NOVA LIB
│   ├── conversionApi.ts                           ← fetch wrapper para os 2 endpoints
│   └── conversionTypes.ts                         ← tipos TypeScript do contrato
└── app/checkup/[runId]/
    └── CheckupConversionPanel.tsx                 ← NOVO COMPONENTE integrado à página
```

**Structure Decision**: módulo `conversion/` no backend segue o padrão dos módulos existentes (thin controller, service com lógica, repository JdbcTemplate). Frontend adiciona lib e componente sem nova rota.

---

## Complexity Tracking

Sem violações de constitution. Sem complexity tracking necessário.

---

## Phase 0: Research

Concluído. Ver [research.md](research.md).

Decisões-chave:
1. Guard de elegibilidade via `ai_runs.status = 'completed'` (não `checkup_reports.status`)
2. Projeto de destino via `ai_runs.project_id` (checkup_reports não tem project_id)
3. Artefatos TEST_SCENARIO e TEST_CASE vão para tabelas existentes com colunas de rastreabilidade adicionais; REQUIREMENT, RISK_ITEM, QA_ACTION vão para `workspace_artifacts`
4. Chave de idempotência: `source_checkup_report_id + source_section + source_item_index`
5. Atomicidade via `@Transactional` no Spring

---

## Phase 1: Design & Contracts

### Data Model

Ver [data-model.md](data-model.md).

Resumo das alterações de schema:
- **ALTER** `test_scenarios`: + `source_checkup_report_id`, `source_section`, `source_item_index`
- **ALTER** `test_cases`: + `source_checkup_report_id`, `source_section`, `source_item_index`
- **CREATE** `workspace_artifacts`: nova tabela para REQUIREMENT, RISK_ITEM, QA_ACTION

### API Contracts

Ver [contracts/conversion-api.md](contracts/conversion-api.md).

Endpoints:
- `POST /api/checkup/reports/{reportId}/conversion/preview` → preview sem persistência
- `POST /api/checkup/reports/{reportId}/conversion/confirm` → persistência atômica

### Lógica de negócio chave no ConversionService

```
preview(reportId, orgId, selectedItems):
  1. buscar checkup_report por reportId → 404 se não existir
  2. verificar report.organizationId == orgId → 403
  3. buscar ai_run por report.aiRunId → verificar status == 'completed' → 422 se não
  4. resolver projectId via ai_run.projectId
  5. para cada selectedItem:
     a. validar sourceSection válida e sourceItemIndex in range → 400
     b. extrair item do relatório
     c. derivar título e descrição do artefato
     d. verificar alreadyConverted (buscar por source_checkup_report_id + section + index)
     e. montar ConversionPreviewItem
  6. retornar ConversionPreviewResponse

confirm(reportId, orgId, userId, items):  @Transactional
  1. mesmo guard: existência, org, ai_run completado
  2. resolver projectId
  3. filtrar items com intent == CREATE_NEW
  4. se nenhum CREATE_NEW → 400
  5. para cada CREATE_NEW:
     a. extrair item do relatório
     b. derivar artefato
     c. persistir (test_scenarios, test_cases ou workspace_artifacts)
  6. registrar evento de auditoria (CHECKUP_ARTIFACTS_CONVERTED)
  7. retornar ConversionResult
```

### Derivação de artefatos por seção

| sourceSection | Tabela | Campos derivados |
|---|---|---|
| `missing_or_unclear_requirements` | `workspace_artifacts` (REQUIREMENT) | title = FindingItem.title; description = FindingItem.description |
| `suggested_test_scenarios` | `test_scenarios` | title = ScenarioItem.title; description = ScenarioItem.description; scenario_type = ScenarioItem.type |
| `suggested_test_cases` | `test_cases` | title = TestCaseItem.title; preconditions = TestCaseItem.preconditions; steps = JSON(steps); expected_result = TestCaseItem.expectedResult |
| `quality_risks` | `workspace_artifacts` (RISK_ITEM) | riskCategory = QUALITY; severity = FindingItem.severity |
| `ux_product_risks` | `workspace_artifacts` (RISK_ITEM) | riskCategory = UX_PRODUCT; severity = FindingItem.severity |
| `release_readiness_notes` | `workspace_artifacts` (QA_ACTION) | action = FindingItem.title; rationale = FindingItem.description; priority = mapeado de severity |
