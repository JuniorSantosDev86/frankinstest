# Implementation Plan: Workspace Artifacts Review & Editing

**Branch**: `009-workspace-artifacts-review-editing` | **Date**: 2026-05-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/009-workspace-artifacts-review-editing/spec.md`

---

## Summary

Permitir que usuários listem, revisem, editem e organizem artefatos do Workspace criados pela conversão de Check-up (Bloco 13). Três novos endpoints REST no backend Spring Boot: `GET /api/workspace/artifacts` (listagem com filtros e cap de 200), `GET /api/workspace/artifacts/{id}` (detalhe), `PATCH /api/workspace/artifacts/{id}` (edição de campos editáveis com rejeição de imutáveis). Novo módulo `workspace/` no backend. Nova rota `/workspace/artifacts` no frontend com lista e painel de detalhes/edição. Sem chamada ao provedor de IA. Sem alteração de schema além de um índice adicional.

---

## Technical Context

**Language/Version**: Java 21 + Spring Boot (services/api); Next.js 14 + TypeScript (apps/web)

**Primary Dependencies**: Spring Boot, JdbcTemplate, PostgreSQL, Jackson, Spring Security (JWT), Next.js, React, Tailwind

**Storage**: PostgreSQL — tabela `workspace_artifacts` existente (Bloco 13); novo índice `idx_workspace_artifacts_org_status_type`

**Testing**: Backend — JUnit 5 + Spring Boot Test (unit para service, integration para controller e DB); Frontend — lint + build + testes de componente quando aplicável

**Target Platform**: Linux server (local dev via Docker Compose)

**Performance Goals**: `GET /api/workspace/artifacts` responde em < 300ms para até 200 artefatos com filtros (query simples com índice em PostgreSQL local). `PATCH` responde em < 200ms (UPDATE por PK + INSERT em audit_log).

**Constraints**: Sem chamada ao provedor de IA; sem billing; sem integrações externas; UI em pt-BR; JWT + X-Organization-Id em todos os endpoints; hard cap de 200 artefatos na listagem; campos imutáveis nunca alterados.

**Scale/Scope**: MVP — um módulo backend (`workspace/`), três endpoints, dois componentes frontend, uma lib de tipos e fetch.

---

## Constitution Check

- **Architecture boundary**: ✅ UI em `apps/web`, lógica de negócio e persistência em `services/api`, PostgreSQL como fonte de verdade. Nenhuma alteração em `infra/`.
- **Modular monolith**: ✅ Novo módulo `workspace/` dentro do monolito Spring Boot existente. Sem microserviços.
- **Responsibility boundary**: ✅ Backend é a autoridade para validação de imutáveis, validação de `details`, status válidos, cap de listagem, persistência e auditoria. Frontend não envia campos imutáveis nem decide sobre limites.
- **AI governance**: ✅ Nenhuma chamada ao provedor de IA. Sem `AiRunService` envolvido. Sem consumo de créditos.
- **Security/LGPD**: ✅ JWT + X-Organization-Id validados em todos os endpoints. Acesso ao artefato verificado por `organization_id` antes de qualquer leitura ou escrita. Auditoria de edição registrada em `audit_log`. Sem dados sensíveis no frontend.
- **Product language**: ✅ Toda UI em pt-BR. Nenhum texto em en/es.
- **Testing discipline**: ✅ `ArtifactReviewServiceTest` para regras de negócio (validação de imutáveis, status, details, cap). `ArtifactReviewControllerIntegrationTest` para auth, org validation, listagem, leitura, edição. Frontend: lint + build + testes de componente.
- **Execution discipline**: ✅ Escopo limitado ao módulo `workspace/` e lib frontend `artifacts/`. Sem refactors não relacionados. Sem alterações no fluxo de Check-up ou conversão existentes.

---

## Project Structure

### Documentation (this feature)

```text
specs/009-workspace-artifacts-review-editing/
├── plan.md              ← este arquivo
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── artifacts-api.md    ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit-tasks)
```

### Source Code

```text
services/api/src/main/java/com/frankintest/api/
├── workspace/                                         ← NOVO MÓDULO
│   ├── ArtifactReviewModels.java                      ← DTOs: ArtifactPatch, ArtifactListFilters, ArtifactListResponse
│   ├── ArtifactReviewController.java                  ← GET list, GET by id, PATCH
│   └── ArtifactReviewService.java                     ← validação de imutáveis, status, details, auditoria
├── conversion/                                        ← SEM ALTERAÇÃO (Bloco 13)
│   └── WorkspaceArtifactRepository.java               ← 3 novos métodos: findById, findByOrganization, updateEditableFields
├── checkup/                                           ← SEM ALTERAÇÃO
└── ...

services/api/src/main/resources/db/
└── schema.sql                                         ← novo índice idx_workspace_artifacts_org_status_type

services/api/src/test/java/com/frankintest/api/
└── workspace/                                         ← NOVOS TESTES
    ├── ArtifactReviewServiceTest.java
    └── ArtifactReviewControllerIntegrationTest.java

apps/web/src/
├── app/workspace/artifacts/
│   └── page.tsx                                       ← NOVA ROTA /workspace/artifacts
├── components/workspace/
│   ├── WorkspaceArtifactList.tsx                      ← NOVO COMPONENTE (lista + filtros)
│   └── WorkspaceArtifactDetailPanel.tsx               ← NOVO COMPONENTE (painel detalhe + edição)
└── lib/artifacts/
    ├── artifactsApi.ts                                ← NOVA LIB (fetch wrappers)
    └── artifactTypes.ts                               ← NOVA LIB (tipos TypeScript)
```

**Structure Decision**: módulo `workspace/` no backend segue o padrão dos módulos existentes (thin controller, service com lógica, repository JdbcTemplate). O `WorkspaceArtifactRepository` do módulo `conversion/` recebe novos métodos em vez de criar um segundo repositório — uma única classe para operações em `workspace_artifacts`. Frontend adiciona rota dedicada `/workspace/artifacts` e lib sem modificar páginas existentes.

---

## Complexity Tracking

Sem violações de constitution. Sem complexity tracking necessário.

---

## Phase 0: Research

Concluído. Ver [research.md](research.md).

Decisões-chave:
1. Três novos endpoints sob `/api/workspace/artifacts` (namespace Workspace, não Check-up)
2. Novo módulo `workspace/` no backend; `WorkspaceArtifactRepository` do Bloco 13 recebe novos métodos
3. Hard reject para campos imutáveis no PATCH (não silent strip) — retorna 400 com lista dos campos inválidos
4. Validação de `details` no PATCH usa o mesmo esquema mínimo por `artifactType` da criação (Bloco 13)
5. Hard cap de 200 artefatos na listagem com `ORDER BY created_at DESC`; campo `limitReached` na resposta
6. Evento de auditoria `ARTIFACT_UPDATED` em toda edição bem-sucedida
7. Novo índice `idx_workspace_artifacts_org_status_type` para performance da listagem filtrada
8. Rota `/workspace/artifacts` no frontend com componentes de lista e painel de detalhe/edição

---

## Phase 1: Design & Contracts

### Data Model

Ver [data-model.md](data-model.md).

Resumo:
- **Sem novas tabelas** — `workspace_artifacts` do Bloco 13 é suficiente
- **Novo índice**: `idx_workspace_artifacts_org_status_type ON workspace_artifacts(organization_id, status, artifact_type)`
- **3 novos métodos** em `WorkspaceArtifactRepository`: `findById`, `findByOrganization`, `updateEditableFields(id, orgId, title, description, status, details)` — sem dependência de `ArtifactPatch`
- **3 novos records Java** no pacote `workspace/`: `ArtifactPatch`, `ArtifactListFilters`, `ArtifactListResponse`

### API Contracts

Ver [contracts/artifacts-api.md](contracts/artifacts-api.md).

Endpoints:
- `GET /api/workspace/artifacts` → listagem com filtros opcionais, cap de 200, campo `limitReached`
- `GET /api/workspace/artifacts/{id}` → detalhe completo com rastreabilidade
- `PATCH /api/workspace/artifacts/{id}` → edição de campos editáveis; rejeita imutáveis; valida `details`

### Lógica de negócio chave em `ArtifactReviewService`

```
listArtifacts(organizationId, filters):
  1. validar artifactType e status quando presentes → 400 se inválidos
  2. chamar repository.findByOrganization(filters, 200)
  3. verificar se limitReached (COUNT sem LIMIT > 200)
  4. retornar ArtifactListResponse

getArtifact(id, organizationId):
  1. chamar repository.findById(id, organizationId)
     — query inclui AND organization_id = :organizationId
  2. se empty → 404 (não revela existência de artefatos de outras orgs)
  3. retornar artifact
  (403 não é lançado por org-mismatch de artefato — somente por X-Organization-Id ausente/inválido no filtro de segurança)

updateArtifact(id, organizationId, userId, rawPatch, patch):
  rawPatch = Map<String,Object> lido do corpo bruto (antes de mapear para ArtifactPatch)
  patch    = ArtifactPatch com apenas campos editáveis mapeados
  1. verificar se rawPatch.keySet() contém campos imutáveis → 400 com lista em pt-BR
     (rawPatch detecta chaves proibidas que seriam silenciosamente ignoradas pelo DTO)
  2. chamar repository.findById(id, organizationId) → 404 se não encontrado (inclui cross-org)
  3. validar patch.title não vazio quando presente → 400
  4. validar patch.status contra enum ArtifactStatus quando presente → 400
  5. validar patch.details contra esquema mínimo do artifactType quando presente → 400
  6. calcular changedFields (comparar valores atuais do artefato vs patch — incluir somente campos com valor diferente)
  7. chamar repository.updateEditableFields(id, organizationId, patch.title, patch.description, patch.status, patch.details)
  8. registrar evento de auditoria ARTIFACT_UPDATED:
     - changedFields: lista de campos efetivamente alterados
     - previousStatus / newStatus: incluídos SOMENTE se status está em changedFields
     - se nenhum campo mudou: changedFields = [] (ainda registra auditoria)
  9. retornar artefato atualizado (nova leitura via getArtifact)
```
