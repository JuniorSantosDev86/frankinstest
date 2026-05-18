# Research: Workspace Artifacts Review & Editing

**Phase 0 output** | **Branch**: `009-workspace-artifacts-review-editing` | **Date**: 2026-05-18

---

## Decisão 1 — Escopo dos endpoints de artefatos neste bloco

**Decision**: Três endpoints REST novos: `GET /api/workspace/artifacts` (list), `GET /api/workspace/artifacts/{id}` (read), `PATCH /api/workspace/artifacts/{id}` (update).

**Rationale**: O Bloco 13 criou o endpoint de conversão sob `/api/checkup/reports/{reportId}/conversion/`. Os endpoints de revisão e edição pertencem ao domínio Workspace, não ao domínio Check-up, portanto ficam sob `/api/workspace/artifacts`. Isso respeita o limite de módulo e prepara o namespace para futuras features do Workspace (ex.: criação manual de artefatos, deleção).

**Alternatives considered**:
- Aninhar sob `/api/checkup/reports/{reportId}/artifacts`: rejeitado — o loop de revisão não é específico a um único relatório de origem; o usuário revisa todos os artefatos da organização.
- Reutilizar o `WorkspaceArtifactRepository` do Bloco 13 sem novo controller: rejeitado — o Bloco 13 tem `ConversionController`; misturar operações de CRUD de revisão com lógica de conversão viola a responsabilidade única do módulo.

---

## Decisão 2 — Localização do módulo backend

**Decision**: Novo módulo `workspace/` em `services/api/src/main/java/com/frankintest/api/workspace/`, independente do módulo `conversion/` do Bloco 13. O repositório `WorkspaceArtifactRepository` do Bloco 13 é reutilizado ou expandido no mesmo pacote.

**Rationale**: O Bloco 13 já criou `WorkspaceArtifactRepository` no pacote `conversion/`. Para o Bloco 14 existem duas opções: (a) mover o repositório para um pacote compartilhado `workspace/` e referenciá-lo de ambos os módulos, ou (b) criar um segundo repositório em `workspace/` focado nas operações de leitura e atualização. A opção (a) é mais limpa para o MVP — um único repositório para `workspace_artifacts`, acessível pelos dois módulos, com métodos adicionados conforme necessário.

**Alternatives considered**:
- Criar `ArtifactReviewRepository` separado em `workspace/`: rejeitado no MVP — duplicaria o mapeamento JDBC sem ganho real; um único `WorkspaceArtifactRepository` com todos os métodos é suficiente.
- Usar o módulo `conversion/` para acomodar os novos endpoints: rejeitado — mistura responsabilidades distintas (conversão vs. revisão/edição).

---

## Decisão 3 — Novos métodos em `WorkspaceArtifactRepository`

**Decision**: Adicionar ao `WorkspaceArtifactRepository` existente três novos métodos:
- `findById(id, organizationId)` — busca por ID + validação de org (403 se org não bate)
- `findByOrganization(organizationId, filters, limit)` — listagem com filtros opcionais e hard cap de 200
- `updateEditableFields(id, organizationId, patch)` — atualização parcial de `title`, `description`, `status`, `details`, `updated_at`

**Rationale**: JdbcTemplate é a camada de persistência do monolito. Adicionar métodos ao repositório existente é a abordagem mais simples e consistente com o padrão do Bloco 13, sem introduzir nova abstração.

**Alternatives considered**:
- Spring Data JPA com entidade: rejeitado — o projeto usa JdbcTemplate consistentemente; introduzir JPA só para este bloco seria uma mudança de padrão não justificada no MVP.

---

## Decisão 4 — Validação de campos imutáveis no PATCH

**Decision**: O backend rejeita com 400 qualquer PATCH que contenha os campos `sourceCheckupReportId`, `sourceSection`, `sourceItemIndex`, `aiAssisted`, `createdBy` ou `createdAt`. A verificação é feita no service antes de qualquer persistência, retornando mensagem em pt-BR listando os campos inválidos recebidos.

**Rationale**: Clarificado na sessão de Q&A da spec (Q1). Hard reject protege rastreabilidade e evita ambiguidade no cliente sobre quais campos foram realmente aplicados.

**Alternatives considered**:
- Silent strip (ignorar silenciosamente campos imutáveis): rejeitado — o usuário/cliente pode assumir que o campo foi atualizado quando não foi.

---

## Decisão 5 — Validação de `details` no PATCH

**Decision**: Quando `details` é incluído no PATCH, o backend valida o JSON contra o mesmo esquema mínimo por `artifactType` usado na criação (Bloco 13). REQUIREMENT exige `severity` e `originalText`; RISK_ITEM exige `severity`, `riskCategory` e `originalText`; QA_ACTION exige `priority`, `action`, `rationale` e `originalText`. `details` inválido retorna 400 com descrição do problema em pt-BR.

**Rationale**: Clarificado na sessão de Q&A da spec (Q2). Consistência do esquema entre criação e edição protege consumidores downstream que dependem da estrutura tipada de `details`.

**Alternatives considered**:
- Aceitar qualquer JSON válido no PATCH: rejeitado — permite degradação estrutural do artefato.
- Tornar `details` somente leitura neste bloco: rejeitado — o refinamento do conteúdo gerado pela IA é o objetivo central do bloco.

---

## Decisão 6 — Hard cap de 200 artefatos na listagem

**Decision**: O endpoint de listagem aplica `LIMIT 200` com `ORDER BY created_at DESC`. Se mais de 200 artefatos existirem, apenas os 200 mais recentes são retornados. A resposta inclui um campo booleano `limitReached: true` quando o total excede 200. O frontend exibe aviso em pt-BR quando `limitReached` for `true`.

**Rationale**: Clarificado na sessão de Q&A da spec (Q3). Previne queries sem limite em organizações com alto volume de artefatos. 200 cobre todos os casos realistas de MVP.

**Alternatives considered**:
- Sem limite (retornar tudo): rejeitado — risco de timeout e resposta muito grande em produção.
- Paginação cursor-based: rejeitado no MVP — adiciona complexidade de UI desnecessária.

---

## Decisão 7 — Evento de auditoria para edições

**Decision**: A cada PATCH bem-sucedido, o service registra um evento de auditoria na tabela `audit_log` existente com: `action = ARTIFACT_UPDATED`, `entityId = artifactId`, `organizationId`, `userId` (do JWT), `timestamp`, `details = JSON({changedFields, previousStatus?, newStatus?})`.

**Rationale**: Consistente com o padrão de auditoria do Bloco 11 e do Bloco 13. Reutiliza o `AuditLogRepository` / serviço de auditoria existente sem nova infraestrutura.

**Alternatives considered**:
- Auditoria somente para mudanças de status: rejeitado — a spec requer auditoria para qualquer atualização de campo.

---

## Decisão 8 — Componente de frontend

**Decision**: Nova rota `/workspace/artifacts` no Next.js com um componente de listagem (`WorkspaceArtifactList.tsx`) e um painel de detalhes/edição (`WorkspaceArtifactDetailPanel.tsx`). Nova lib `apps/web/src/lib/artifacts/` com `artifactsApi.ts` (fetch wrappers) e `artifactTypes.ts` (tipos TypeScript).

**Rationale**: Segue o padrão estabelecido no Bloco 13 (`lib/conversion/`). Rota dedicada é mais limpa que embutir na página de Check-up — a revisão de artefatos é um ponto de entrada independente do Workspace.

**Alternatives considered**:
- Embutir na página de relatório do Check-up: rejeitado — o loop de revisão cobre artefatos de múltiplos relatórios; uma página global no Workspace é o modelo correto.
- Painel modal sem rota dedicada: rejeitado — URL navegável melhora UX e permite link direto para revisão.

---

## Decisão 9 — Sem novas colunas de banco neste bloco

**Decision**: Nenhuma alteração de schema de banco de dados neste bloco. O campo `updated_at` já existe em `workspace_artifacts` (Bloco 13). O campo `status` já existe com valor `DRAFT`.

**Rationale**: O Bloco 13 criou a tabela completa com todos os campos necessários para este bloco. A única adição necessária é um índice adicional para a query de listagem filtrada.

**Alternatives considered**:
- Adicionar coluna `reviewed_at`: rejeitado no MVP — escopo pós-MVP.

---

## Índice adicional necessário

```sql
-- Suporte eficiente a filtros combinados por org + status + type na listagem
CREATE INDEX IF NOT EXISTS idx_workspace_artifacts_org_status_type
  ON workspace_artifacts(organization_id, status, artifact_type);
```

Este índice não existia no Bloco 13 e é necessário para a query de listagem com filtros múltiplos.
