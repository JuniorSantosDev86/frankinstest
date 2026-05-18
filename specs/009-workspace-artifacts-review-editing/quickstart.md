# Quickstart: Workspace Artifacts Review & Editing

**Branch**: `009-workspace-artifacts-review-editing` | **Date**: 2026-05-18

---

## Pré-requisitos

```bash
# Bloco 13 implementado e banco com tabela workspace_artifacts existente
# Infraestrutura rodando
docker compose -f infra/docker-compose.yml up -d

# Backend compilando
cd services/api && ./mvnw compile

# Frontend compilando
cd apps/web && npm run build
```

---

## Novo índice de banco (aplicado automaticamente via schema.sql)

```sql
-- Verificar se o índice foi criado
SELECT indexname FROM pg_indexes
WHERE tablename = 'workspace_artifacts'
  AND indexname = 'idx_workspace_artifacts_org_status_type';
```

---

## Fluxo de desenvolvimento

### 1. Rodar testes do backend

```bash
cd services/api
./mvnw test
```

Deve cobrir:
- `ArtifactReviewServiceTest` — regras de negócio (validação de imutáveis, status, details, cap de 200)
- `ArtifactReviewControllerIntegrationTest` — auth, org validation, listagem, leitura, edição
- Testes de regressão dos Blocos 10–13 (sem regressões)

### 2. Rodar testes do frontend

```bash
cd apps/web
npm run lint
npm run build
npm test   # se houver testes configurados
```

### 3. Testar a listagem

```bash
# Listar todos os artefatos da organização
curl -X GET "http://localhost:8080/api/workspace/artifacts" \
  -H "Authorization: Bearer <token>" \
  -H "X-Organization-Id: <orgId>"

# Filtrar por tipo e status
curl -X GET "http://localhost:8080/api/workspace/artifacts?artifactType=REQUIREMENT&status=DRAFT" \
  -H "Authorization: Bearer <token>" \
  -H "X-Organization-Id: <orgId>"

# Filtrar por relatório de origem
curl -X GET "http://localhost:8080/api/workspace/artifacts?sourceCheckupReportId=rpt_abc123" \
  -H "Authorization: Bearer <token>" \
  -H "X-Organization-Id: <orgId>"
```

### 4. Testar a leitura de um artefato

```bash
curl -X GET "http://localhost:8080/api/workspace/artifacts/<artifactId>" \
  -H "Authorization: Bearer <token>" \
  -H "X-Organization-Id: <orgId>"
```

### 5. Testar a edição de um artefato

```bash
# Atualizar título e status
curl -X PATCH "http://localhost:8080/api/workspace/artifacts/<artifactId>" \
  -H "Authorization: Bearer <token>" \
  -H "X-Organization-Id: <orgId>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Novo título refinado",
    "status": "REVIEWED"
  }'

# Atualizar details de REQUIREMENT
curl -X PATCH "http://localhost:8080/api/workspace/artifacts/<artifactId>" \
  -H "Authorization: Bearer <token>" \
  -H "X-Organization-Id: <orgId>" \
  -H "Content-Type: application/json" \
  -d '{
    "details": {
      "severity": "MEDIUM",
      "originalText": "Email validation is missing"
    }
  }'
```

### 6. Testar rejeição de campos imutáveis

```bash
# Deve retornar 400 com mensagem em pt-BR listando os campos inválidos
curl -X PATCH "http://localhost:8080/api/workspace/artifacts/<artifactId>" \
  -H "Authorization: Bearer <token>" \
  -H "X-Organization-Id: <orgId>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Título ok",
    "sourceCheckupReportId": "tentativa_de_alteracao"
  }'
```

### 7. Testar proteções de segurança

```bash
# Deve retornar 401
curl -X GET "http://localhost:8080/api/workspace/artifacts"

# Deve retornar 403
curl -X GET "http://localhost:8080/api/workspace/artifacts" \
  -H "Authorization: Bearer <token>" \
  -H "X-Organization-Id: org_errada"

# PATCH em artefato de outra organização — deve retornar 403
curl -X PATCH "http://localhost:8080/api/workspace/artifacts/<artifactId>" \
  -H "Authorization: Bearer <token>" \
  -H "X-Organization-Id: org_errada" \
  -H "Content-Type: application/json" \
  -d '{"title": "Tentativa"}'
```

### 8. Verificar evento de auditoria

```bash
psql -U postgres -d frankintest -c \
  "SELECT action, entity_id, user_id, details FROM audit_log WHERE action = 'ARTIFACT_UPDATED' ORDER BY created_at DESC LIMIT 5;"
```

---

## Estrutura de arquivos criados neste bloco

### Backend

```
services/api/src/main/java/com/frankintest/api/
└── workspace/
    ├── ArtifactReviewModels.java          ← DTOs: ArtifactPatch, ArtifactListFilters, ArtifactListResponse
    ├── ArtifactReviewController.java      ← GET list, GET by id, PATCH
    └── ArtifactReviewService.java         ← validação de imutáveis, status, details, auditoria

(WorkspaceArtifactRepository do Bloco 13 recebe 3 novos métodos)

services/api/src/main/resources/db/
└── schema.sql   (novo índice idx_workspace_artifacts_org_status_type)

services/api/src/test/java/com/frankintest/api/
└── workspace/
    ├── ArtifactReviewServiceTest.java
    └── ArtifactReviewControllerIntegrationTest.java
```

### Frontend

```
apps/web/src/
├── app/workspace/artifacts/
│   └── page.tsx                           ← rota /workspace/artifacts
├── components/workspace/
│   ├── WorkspaceArtifactList.tsx          ← listagem com filtros e aviso de limite
│   └── WorkspaceArtifactDetailPanel.tsx   ← painel de detalhes e edição inline
└── lib/artifacts/
    ├── artifactsApi.ts                    ← fetch wrappers para os 3 endpoints
    └── artifactTypes.ts                   ← tipos TypeScript do contrato
```
