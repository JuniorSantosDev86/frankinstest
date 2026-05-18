# Tasks: Check-up to Workspace Artifacts

**Input**: Design documents from `specs/007-checkup-to-workspace-artifacts/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅

**Tests**: Backend business rules requerem unit tests. API, persistência, permissões e auditoria requerem integration tests. Frontend: lint + build. AI provider NÃO é chamado neste bloco — sem mock necessário.

**Organization**: Tasks agrupadas por user story para implementação e teste independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências incompletas)
- **[Story]**: User story correspondente (US1, US2, US3)
- Paths absolutos de repositório incluídos nas descrições

---

## Phase 1: Setup (Estrutura do módulo)

**Purpose**: Criar o esqueleto do módulo `conversion/` no backend e a lib no frontend. Sem lógica de negócio ainda.

- [X] T001 Criar estrutura do módulo backend `services/api/src/main/java/com/frankintest/api/conversion/` com arquivos vazios: `ConversionModels.java`, `ConversionController.java`, `ConversionService.java`, `WorkspaceArtifactRepository.java`, `ConversionTraceabilityHelper.java`
- [X] T002 [P] Criar estrutura da lib frontend `apps/web/src/lib/conversion/` com arquivos vazios: `conversionApi.ts`, `conversionTypes.ts`
- [X] T003 [P] Criar estrutura de testes backend `services/api/src/test/java/com/frankintest/api/conversion/` com arquivos vazios: `ConversionServiceTest.java`, `ConversionControllerIntegrationTest.java`

---

## Phase 2: Foundational (Pré-requisitos bloqueantes)

**Purpose**: Schema de banco, DTOs e repositório de workspace_artifacts. Tudo que as user stories dependem.

**⚠️ CRÍTICO**: Nenhuma user story pode iniciar antes desta fase estar completa.

- [X] T004 Aplicar alterações de schema em `services/api/src/main/resources/db/schema.sql`: adicionar colunas `source_checkup_report_id VARCHAR(120)`, `source_section VARCHAR(100)`, `source_item_index INTEGER` nas tabelas `test_scenarios` e `test_cases` (usando `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`); adicionar índices correspondentes
- [X] T005 [P] Criar tabela `workspace_artifacts` em `services/api/src/main/resources/db/schema.sql` conforme `data-model.md`: colunas `id`, `organization_id`, `project_id`, `artifact_type`, `title`, `description`, `status`, `ai_assisted`, `source_checkup_report_id`, `source_section`, `source_item_index`, `details`, `created_by`, `created_at`, `updated_at`; índices em `organization_id`, `(source_checkup_report_id, source_section, source_item_index)`, `artifact_type`
- [X] T006 [P] Definir enums, DTOs e records em `services/api/src/main/java/com/frankintest/api/conversion/ConversionModels.java`: enum `ArtifactType` (REQUIREMENT, TEST_SCENARIO, TEST_CASE, RISK_ITEM, QA_ACTION), enum `ConversionIntent` (CREATE_NEW, SKIP), records `ConversionPreviewRequest`, `ConversionPreviewItem`, `ConversionPreviewResponse`, `ConversionConfirmRequest`, `ConversionConfirmItem`, `ConversionResult`, `CreatedArtifact`; incluir obrigatoriamente o record `WorkspaceArtifactRow` com campos: `id`, `organizationId`, `projectId`, `artifactType`, `title`, `description`, `status`, `aiAssisted`, `sourceCheckupReportId`, `sourceSection`, `sourceItemIndex` (int, 0-based), `details`, `createdBy`, `createdAt`, `updatedAt` — conforme `data-model.md`
- [X] T007 [P] Definir tipos TypeScript em `apps/web/src/lib/conversion/conversionTypes.ts`: interfaces `ConversionSelectedItem`, `ConversionPreviewItem`, `ConversionPreviewResponse`, `ConversionConfirmItem`, `ConversionConfirmRequest`, `ConversionResult`, `CreatedArtifact`; tipo `ConversionIntent = 'CREATE_NEW' | 'SKIP'`
- [X] T008 Implementar `WorkspaceArtifactRepository` em `services/api/src/main/java/com/frankintest/api/conversion/WorkspaceArtifactRepository.java` usando JdbcTemplate: métodos `save(WorkspaceArtifactRow)`, `findBySource(reportId, section, itemIndex)` retornando `Optional<String>` (id existente); seguir padrão de `CheckupRepository.java`
- [X] T009 [P] Implementar `ConversionTraceabilityHelper` em `services/api/src/main/java/com/frankintest/api/conversion/ConversionTraceabilityHelper.java`: método `findExistingArtifact(reportId, section, itemIndex)` que verifica existência de artefato anterior pela tripla `(source_checkup_report_id, source_section, source_item_index)`; para `workspace_artifacts` DEVE delegar a `WorkspaceArtifactRepository.findBySource(reportId, section, itemIndex)` — sem JdbcTemplate direto para essa tabela; para `test_scenarios` e `test_cases` pode usar JdbcTemplate direto; retorna `Optional<ExistingArtifactRef>` com `artifactId` e `tableName`

**Checkpoint**: Schema aplicado, DTOs definidos, repositório implementado — user stories podem iniciar.

---

## Phase 3: User Story 3 — Acesso protegido por autenticação e organização (Priority: P1)

**Goal**: Garantir que todos os endpoints de conversão rejeitem corretamente requisições sem auth ou com org incorreta. Implementar antes da US1 para que os guards estejam em vigor desde o início.

**Independent Test**: Enviar POST sem JWT → esperar 401. Enviar POST com JWT válido mas `X-Organization-Id` incorreto → esperar 403.

### Testes para US3

- [X] T010 [P] [US3] Implementar `ConversionControllerIntegrationTest` em `services/api/src/test/java/com/frankintest/api/conversion/ConversionControllerIntegrationTest.java`: casos `givenNoJwt_whenPreview_then401`, `givenNoJwt_whenConfirm_then401`, `givenWrongOrgId_whenPreview_then403`, `givenWrongOrgId_whenConfirm_then403`, `givenReportFromAnotherOrg_whenPreview_then403`; usar `@SpringBootTest` + `TestRestTemplate` ou `MockMvc`; NÃO chamar AI provider

### Implementação de US3

- [X] T011 [US3] Implementar `ConversionController` (thin) em `services/api/src/main/java/com/frankintest/api/conversion/ConversionController.java`: mapear `POST /api/checkup/reports/{reportId}/conversion/preview` e `POST /api/checkup/reports/{reportId}/conversion/confirm`; extrair `organizationId` do header `X-Organization-Id` e `userId` do `AuthenticatedPrincipal`; delegar 100% para `ConversionService`; retornar `ResponseEntity` tipado; sem lógica de negócio no controller
- [X] T012 [US3] Implementar guard de autenticação e org em `ConversionService` em `services/api/src/main/java/com/frankintest/api/conversion/ConversionService.java`: método `validateAccess(reportId, organizationId)` que busca o `CheckupReport` via `CheckupRepository.findById(reportId)` → lança `ResourceNotFoundException` (404) se não encontrar; verifica `report.organizationId().equals(organizationId)` → lança `AccessDeniedException` (403) se diferente; estes guards são chamados no início de `preview()` e `confirm()`
- [X] T013 [US3] Garantir que `ConversionController` está registrado no `SecurityConfig` existente em `services/api/src/main/java/com/frankintest/api/system/security/SecurityConfig.java`: paths `/api/checkup/reports/*/conversion/**` devem exigir autenticação; verificar se já coberto pelo padrão existente; ajustar se necessário

**Checkpoint**: Endpoints respondem 401/403 corretamente. Testes de US3 passam.

---

## Phase 4: User Story 1 — Selecionar e converter itens do relatório (Priority: P1) 🎯 MVP

**Goal**: Fluxo completo de pré-visualização → confirmação → criação de artefatos. Backend e frontend integrados.

**Independent Test**: Abrir relatório de Check-up concluído, selecionar itens de múltiplas seções, fazer preview, confirmar e verificar artefatos em `workspace_artifacts`, `test_scenarios` e `test_cases` com campos de rastreabilidade preenchidos.

### Testes para US1

- [X] T014 [P] [US1] Implementar `ConversionServiceTest` em `services/api/src/test/java/com/frankintest/api/conversion/ConversionServiceTest.java`: casos `givenCompletedAiRun_whenPreview_thenReturnsMappedItems`, `givenIncompleteAiRun_whenPreview_then422`, `givenEmptySelectedItems_whenPreview_then400`, `givenValidItems_whenConfirm_thenArtifactsCreatedWithTraceability`, `givenAllSkip_whenConfirm_then400`, `givenMixedIntents_whenConfirm_thenOnlyCreateNewAreCreated`; usar mocks para `CheckupRepository`, `AiRunRepository`, `WorkspaceArtifactRepository`, `JdbcTemplate`
- [X] T015 [P] [US1] Adicionar casos de integração em `ConversionControllerIntegrationTest.java`: `givenCompletedReport_whenPreview_then200WithItems`, `givenValidPayload_whenConfirm_then200WithCreatedArtifacts`, `givenEmptyItems_whenConfirm_then400`, `givenAllSkip_whenConfirm_then400`; usar banco H2 ou PostgreSQL de teste; verificar dados persistidos

### Implementação de US1 — Backend

- [X] T016 [US1] Implementar guard de elegibilidade em `ConversionService`: método `validateEligibility(report)` que busca `ai_run` via `AiRunRepository` usando `report.aiRunId()`; verifica `aiRun.status() == AiRunStatus.completed` → lança `CheckupNotEligibleException` (422) com mensagem pt-BR se não completado; este guard é chamado após `validateAccess()`
- [X] T017 [US1] Implementar resolução de `projectId` em `ConversionService`: método `resolveProjectId(report)` que busca o `ai_run` via `AiRunRepository` usando `report.aiRunId()` e lê `aiRun.projectId`; retorna `null` se `projectId` for nulo, vazio ou `'default'` (artefato fica no escopo da organização); NÃO acessar `checkupReport.projectId` — esse campo não existe na tabela `checkup_reports`
- [X] T018 [US1] Implementar lógica de derivação de artefato em `ConversionService`: método `deriveArtifact(section, itemIndex, report)` que extrai o item correto da lista correspondente no relatório (ex.: `report.missingOrUnclearRequirements().get(index)`) e mapeia para `ConversionPreviewItem` conforme tabela de mapeamento em `data-model.md`; valida que `itemIndex` está dentro do range → 400 se inválido
- [X] T019 [US1] Implementar método `preview(reportId, orgId, request)` em `ConversionService`: executa `validateAccess` → `validateEligibility` → valida `selectedItems` não vazio → para cada item chama `deriveArtifact` + `ConversionTraceabilityHelper.findExistingArtifact` → monta `ConversionPreviewResponse`; sem persistência
- [X] T020 [US1] Implementar método `confirm(reportId, orgId, userId, request)` em `ConversionService` com `@Transactional`: executa `validateAccess` → `validateEligibility` → filtra itens com `intent == CREATE_NEW` → valida que lista não está vazia → para cada item CREATE_NEW: chama `deriveArtifact`, persiste em `workspace_artifacts` (para REQUIREMENT, RISK_ITEM, QA_ACTION via `WorkspaceArtifactRepository`) ou em `test_scenarios`/`test_cases` (via JdbcTemplate direto) com colunas `source_checkup_report_id`, `source_section`, `source_item_index`, `ai_assisted=true`, `status='DRAFT'` → chama `AuditService.audit(orgId, userId, "CHECKUP_ARTIFACTS_CONVERTED", ...)` → retorna `ConversionResult`
- [X] T021 [US1] Implementar persistência de `test_scenarios` e `test_cases` no `confirm()`: INSERT em `test_scenarios` com campos `id, organization_id, project_id, title, description, scenario_type, priority='MEDIUM', status='draft', ai_assisted=true, source_checkup_report_id, source_section, source_item_index`; INSERT em `test_cases` com `id, organization_id, project_id, title, preconditions, steps, expected_result, status='draft', ai_assisted=true, source_checkup_report_id, source_section, source_item_index`; seguir padrão de `TestDesignRepository`

### Implementação de US1 — Frontend

- [X] T022 [P] [US1] Implementar `conversionApi.ts` em `apps/web/src/lib/conversion/conversionApi.ts`: funções `previewConversion(reportId, orgId, token, selectedItems)` e `confirmConversion(reportId, orgId, token, items)` fazendo fetch para os endpoints do backend; incluir headers `Authorization` e `X-Organization-Id`; tratar erros HTTP com mensagens em pt-BR
- [X] T023 [US1] Implementar componente `CheckupConversionPanel` em `apps/web/src/app/checkup/[runId]/CheckupConversionPanel.tsx`: exibir itens do relatório agrupados por seção com checkboxes individuais; botão "Pré-visualizar artefatos" desabilitado se nenhum item selecionado; ao clicar em preview, chamar `previewConversion` e exibir lista de artefatos a serem criados; para itens com `alreadyConverted: true`, mostrar aviso em pt-BR "Este item já foi convertido anteriormente" e sugerir SKIP por padrão mas permitir CREATE_NEW; botão "Confirmar conversão" chama `confirmConversion`; exibir mensagem de sucesso com contagem de artefatos criados; desabilitar botão de confirmação após primeiro envio; todos os textos em pt-BR
- [X] T024 [US1] Integrar `CheckupConversionPanel` na página de relatório `apps/web/src/app/checkup/[runId]/page.tsx`: renderizar o painel abaixo do relatório existente apenas quando o relatório estiver com AI run completado; passar `reportId`, `orgId` e token para o componente; sem alteração na lógica existente de exibição do relatório

**Checkpoint**: Fluxo completo preview → confirm funciona. Artefatos criados com rastreabilidade. Testes passam. US1 e US3 independentemente testáveis.

---

## Phase 5: User Story 2 — Rastreabilidade dos artefatos criados (Priority: P2)

**Goal**: Garantir que os campos de rastreabilidade estão presentes e corretos nas respostas de API e visíveis ao usuário no Workspace.

**Independent Test**: Consultar artefato criado via conversão (tanto em `workspace_artifacts` quanto em `test_scenarios`/`test_cases`) e verificar `sourceCheckupReportId`, `sourceSection`, `sourceItemIndex`, `aiAssisted: true`, `status: DRAFT` presentes e corretos.

### Testes para US2

- [X] T025 [P] [US2] Adicionar casos em `ConversionServiceTest.java`: `givenCreatedArtifact_thenTraceabilityFieldsPresent` verificando que `source_checkup_report_id`, `source_section`, `source_item_index` estão corretos no retorno; `givenCreatedTestScenario_thenTraceabilityFieldsStoredInDb` consultando DB diretamente

### Implementação de US2

- [X] T026 [P] [US2] Garantir que a resposta `ConversionResult.createdArtifacts` inclui `sourceSection` e `sourceItemIndex` para cada artefato criado em `ConversionModels.java` e `ConversionService.java`; adicionar ao `CreatedArtifact` record se ainda não presente
- [X] T027 [US2] Verificar que `WorkspaceArtifactRepository.findBySource()` retorna dados suficientes para exibição de rastreabilidade; implementar método `findById(id)` retornando `WorkspaceArtifactRow` completa com todos os campos de rastreabilidade, se necessário para futura consulta
- [X] T028 [US2] Exibir confirmação de rastreabilidade no `CheckupConversionPanel` após conversão bem-sucedida em `apps/web/src/app/checkup/[runId]/CheckupConversionPanel.tsx`: mostrar lista de artefatos criados com tipo e seção de origem; texto em pt-BR como "Requisito criado a partir de: Requisitos ausentes/incompletos"

**Checkpoint**: Artefatos consultados retornam todos os campos de rastreabilidade corretos. US2 independentemente verificável.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validação final, lint, build e run report.

- [X] T029 [P] Rodar `./mvnw test` em `services/api/` e garantir todos os testes passam sem erros; verificar cobertura de `ConversionServiceTest` e `ConversionControllerIntegrationTest`
- [X] T030 [P] Rodar `npm run lint && npm run build` em `apps/web/` e garantir zero erros
- [X] T031 [P] Verificar no banco que `ALTER TABLE test_scenarios ADD COLUMN IF NOT EXISTS source_checkup_report_id` e demais colunas foram aplicados corretamente; verificar `workspace_artifacts` criada; usando query SQL do `quickstart.md`
- [X] T032 Executar teste manual do fluxo completo com curl conforme `quickstart.md`: preview com itens válidos → confirmar → verificar artefatos no DB; testar 401 e 403; testar double-submit (idempotência)
- [X] T033 Verificar que `CLAUDE.md` aponta para `specs/007-checkup-to-workspace-artifacts/plan.md` entre os marcadores `<!-- SPECKIT START -->` e `<!-- SPECKIT END -->`
- [X] T034 Verificar que fluxo existente de Check-up continua sem regressões: rodar testes existentes de `CheckupService`, `CheckupController` e `CheckupRepository`; verificar especificamente que queries em `test_scenarios` e `test_cases` ainda funcionam após o `ADD COLUMN IF NOT EXISTS` das colunas de rastreabilidade — as novas colunas são nullable e não quebram SELECTs/INSERTs existentes
- [X] T035 [P] Verificar que os endpoints `/api/checkup/reports/{reportId}/conversion/preview` e `/api/checkup/reports/{reportId}/conversion/confirm` estão cobertos pelo `RateLimitFilter` existente em `services/api/src/main/java/com/frankintest/api/system/ratelimit/RateLimitFilter.java`; se o filtro aplica a `/api/**` globalmente, documentar isso no run report; se não, adicionar os paths explicitamente
- [X] T036 Produzir run report com: arquivos alterados/criados, funcionalidades implementadas, regras de negócio preservadas, testes adicionados, comandos de validação executados, limitações conhecidas, atualizações de roadmap/status, mensagem de commit sugerida

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Sem dependências — pode iniciar imediatamente
- **Phase 2 (Foundational)**: Depende de Phase 1 — bloqueia todas as user stories
- **Phase 3 (US3 — Auth)**: Depende de Phase 2 — recomendado implementar antes de US1 para garantir guards
- **Phase 4 (US1 — MVP)**: Depende de Phase 2 e Phase 3 — fluxo principal
- **Phase 5 (US2 — Rastreabilidade)**: Depende de Phase 4 — valida e estende o que US1 criou
- **Phase 6 (Polish)**: Depende de todas as fases anteriores

### User Story Dependencies

- **US3 (Auth)**: Pode iniciar após Phase 2. Independente de US1 e US2.
- **US1 (Conversão MVP)**: Pode iniciar após Phase 2. Depende de US3 para guards de segurança.
- **US2 (Rastreabilidade)**: Depende de US1 para artefatos existentes. Pode ser parcialmente desenvolvida em paralelo (campos já incluídos desde US1).

### Within Each User Story

- Testes DEVEM ser escritos antes ou junto com a implementação
- DTOs/Models antes de Services
- Services antes de Controllers
- Backend antes de Frontend (contrato define o que o frontend consome)

### Parallel Opportunities

- T001, T002, T003 podem rodar em paralelo (arquivos diferentes)
- T004, T005, T006, T007, T008, T009 — T004 e T005 em paralelo; T006 e T007 em paralelo após; T008 e T009 em paralelo após T004/T005
- T010 e T011 podem rodar em paralelo (test vs implementação de controller)
- T014 e T015 podem rodar em paralelo com T016, T017, T018 (testes vs implementação)
- T022 pode rodar em paralelo com T016–T021 (frontend independente do backend durante desenvolvimento)
- T025 pode rodar em paralelo com T026, T027

---

## Parallel Example: Phase 4 — User Story 1

```bash
# Backend e Frontend em paralelo:
Task T016: Implementar guard de elegibilidade em ConversionService
Task T022: Implementar conversionApi.ts (frontend pode ser mockado localmente)

# Testes e implementação em paralelo:
Task T014: ConversionServiceTest (unit tests)
Task T018: Implementar preview() em ConversionService
```

---

## Implementation Strategy

### MVP First (US3 + US1)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (schema + DTOs + repositório)
3. Completar Phase 3: US3 (auth guards)
4. Completar Phase 4: US1 (fluxo principal)
5. **PARAR e VALIDAR**: Testar US1 + US3 independentemente
6. Demo se pronto

### Incremental Delivery

1. Setup + Foundational → base pronta
2. US3 → segurança garantida
3. US1 → MVP funcional (preview + confirm + artefatos)
4. US2 → rastreabilidade verificável na UI
5. Polish → validação final e run report

---

## Notes

- [P] = tarefas com arquivos diferentes, sem dependências — podem rodar em paralelo
- [Story] = rastreabilidade para a user story correspondente
- NÃO commitar automaticamente — o desenvolvedor humano commita manualmente
- Parar em cada checkpoint para validar a story independentemente
- Nenhuma chamada ao provedor de IA Anthropic neste bloco
- Nenhum texto en/es na UI — apenas pt-BR
- Seguir padrão de `CheckupRepository` e `CheckupService` para o novo módulo
