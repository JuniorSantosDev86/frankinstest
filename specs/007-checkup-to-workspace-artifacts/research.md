# Research: Check-up to Workspace Artifacts

**Phase 0 output** | **Branch**: `007-checkup-to-workspace-artifacts` | **Date**: 2026-05-18

---

## Decision 1: Definição de "relatório concluído" para autorizar conversão

**Decision**: Um relatório de Check-up é considerado elegível para conversão quando o `ai_run` associado tem `status = 'completed'`. Não é necessário adicionar um novo valor de status em `checkup_reports`.

**Rationale**: A tabela `checkup_reports` usa `status DRAFT/REVIEWED` para controle editorial (revisão humana), não para controle de conclusão de execução de IA. A conclusão da execução de IA já está capturada em `ai_runs.status`. O `CheckupService.getRunStatus()` já checa o AI run status para retornar o relatório — o mesmo critério deve ser usado para autorizar conversão. Adicionar `COMPLETED` em `checkup_reports.status` criaria confusão semântica.

**Alternatives considered**:
- Adicionar `COMPLETED` como novo valor em `checkup_reports.status` — rejeitado porque `DRAFT/REVIEWED` é um status editorial, e a conclusão de IA já tem campo próprio.
- Exigir `status = REVIEWED` — rejeitado porque o usuário não precisa ter revisado o relatório para converter; a conversão com pré-visualização é a própria revisão.

**Impact on spec**: A validação de elegibilidade no backend será: buscar o `ai_run` via `checkup_reports.ai_run_id` e verificar `ai_run.status = 'completed'`.

---

## Decision 2: Destino do projeto para artefatos convertidos

**Decision**: O `project_id` de destino é resolvido a partir de `ai_runs.project_id` (usando `checkup_reports.ai_run_id`). Se `ai_runs.project_id` for `'default'` ou vazio, os artefatos ficam com `project_id = null` (escopo de organização).

**Rationale**: `checkup_reports` não possui coluna `project_id`. O `ai_runs` associado ao Check-up tem `project_id`. Essa é a fonte correta de contexto de projeto. O Check-up foi executado no contexto daquele projeto — os artefatos devem herdar esse contexto.

**Alternatives considered**:
- Adicionar `project_id` em `checkup_reports` — rejeitado porque a informação já existe em `ai_runs` e duplicar cria risco de inconsistência.
- Sempre usar `project_id = null` (escopo de org) — rejeitado porque perde rastreabilidade com o projeto de origem.

---

## Decision 3: Modelo de persistência dos artefatos

**Decision**: Criar tabela nova `workspace_artifacts` para REQUIREMENT, RISK_ITEM e QA_ACTION. Reutilizar tabelas `test_scenarios` e `test_cases` existentes para TEST_SCENARIO e TEST_CASE, adicionando colunas de rastreabilidade (`source_checkup_report_id`, `source_section`, `source_item_index`).

**Rationale**: `test_scenarios` e `test_cases` já existem com estrutura adequada (`ai_assisted`, `status`, `organization_id`, `project_id`). Criar duplicatas seria desperdício. Para REQUIREMENT, RISK_ITEM e QA_ACTION não existem tabelas — `workspace_artifacts` com discriminador `artifact_type` cobre os 3 com custo mínimo no MVP.

**Alternatives considered**:
- Tudo em `workspace_artifacts` unificada — rejeitado porque duplicaria os dados de `test_scenarios` e `test_cases` já existentes e criaria ambiguidade sobre qual é a fonte de verdade.
- Tabelas separadas para cada tipo — rejeitado pelo custo de implementação no MVP (5 tabelas + 5 repositories).

**Impact on schema**:
- ALTER `test_scenarios`: adicionar `source_checkup_report_id`, `source_section`, `source_item_index`
- ALTER `test_cases`: adicionar `source_checkup_report_id`, `source_section`, `source_item_index`
- CREATE `workspace_artifacts`: tabela nova para REQUIREMENT, RISK_ITEM, QA_ACTION

---

## Decision 4: Chave de idempotência e detecção de "já convertido"

**Decision**: Detecção de conversão anterior por combinação de `source_checkup_report_id + source_section + source_item_index`. Essa tripla identifica unicamente um item de relatório. Não há hash de payload — a tripla é suficiente e mais legível.

**Rationale**: Os itens do relatório são listas ordenadas por seção. O índice dentro da lista (`source_item_index`) + seção (`source_section`) + ID do relatório formam a chave natural. Não é necessário gerar UUID de idempotência externo.

**Alternatives considered**:
- Hash MD5 do conteúdo do item — rejeitado porque conteúdo pode mudar se o relatório for re-gerado; o índice posicional é mais estável dentro de um mesmo relatório.
- UUID externo de idempotência passado pelo frontend — rejeitado porque o backend deve ser a autoridade; o frontend não deve gerar chaves de deduplicação.

---

## Decision 5: Atomicidade via transação Spring @Transactional

**Decision**: O método de serviço de confirmação de conversão será anotado com `@Transactional`. A exceção em qualquer artefato reverte toda a operação automaticamente via Spring.

**Rationale**: Padrão mais simples e direto no Spring Boot com JdbcTemplate. Sem necessidade de savepoints ou lógica manual de rollback.

**Alternatives considered**:
- Lógica manual de rollback — rejeitado por complexidade desnecessária.
- Saga pattern — rejeitado como overengineering para MVP local.

---

## Decision 6: Estrutura do módulo backend

**Decision**: Criar módulo `conversion` em `services/api/src/main/java/com/frankintest/api/conversion/` com:
- `ConversionModels.java` — DTOs de request/response
- `ConversionService.java` — lógica de negócio
- `ConversionController.java` — endpoints REST
- `WorkspaceArtifactRepository.java` — persistência para workspace_artifacts
- `ConversionTraceabilityHelper.java` — lógica de detecção alreadyConverted

**Rationale**: Seguindo o padrão de módulos existentes (checkup/, airuns/, audit/). Controller thin, service com lógica de negócio, repository com JdbcTemplate.

---

## Decision 7: Endpoints REST

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/checkup/reports/{reportId}/conversion/preview` | POST | Retorna preview sem persistir |
| `/api/checkup/reports/{reportId}/conversion/confirm` | POST | Persiste artefatos (transacional) |

**Rationale**: Dois endpoints distintos (preview vs confirm) reforça a separação entre pré-visualização e confirmação, e permite que o frontend desabilite o botão após o confirm sem ambiguidade. Preview é POST porque recebe payload de itens selecionados.

---

## Decision 8: Estrutura do frontend

**Decision**: Adicionar componente `CheckupConversionPanel` na página de relatório `apps/web/src/app/checkup/[runId]/page.tsx` e biblioteca `apps/web/src/lib/conversion/`.

**Rationale**: A conversão é parte da experiência do relatório de Check-up. Faz sentido estar na mesma página, como painel colapsável ou seção abaixo do relatório. Não exige nova rota.
