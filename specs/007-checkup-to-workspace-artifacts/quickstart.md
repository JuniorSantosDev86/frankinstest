# Quickstart: Check-up to Workspace Artifacts

**Branch**: `007-checkup-to-workspace-artifacts` | **Date**: 2026-05-18

---

## Pré-requisitos

```bash
# Infraestrutura rodando
docker compose -f infra/docker-compose.yml up -d

# Backend compilando
cd services/api && ./mvnw compile

# Frontend compilando
cd apps/web && npm run build
```

---

## Fluxo de desenvolvimento

### 1. Aplicar alterações de schema

As migrações são executadas automaticamente ao subir o Spring Boot via `schema.sql`. Verificar se as novas colunas e tabela foram criadas:

```sql
-- Verificar novas colunas em test_scenarios
SELECT column_name FROM information_schema.columns
WHERE table_name = 'test_scenarios'
  AND column_name LIKE 'source_%';

-- Verificar novas colunas em test_cases
SELECT column_name FROM information_schema.columns
WHERE table_name = 'test_cases'
  AND column_name LIKE 'source_%';

-- Verificar nova tabela
SELECT column_name FROM information_schema.columns
WHERE table_name = 'workspace_artifacts';
```

### 2. Rodar testes do backend

```bash
cd services/api
./mvnw test
```

Deve cobrir:
- `ConversionServiceTest` — lógica de negócio (preview, confirm, guard de elegibilidade)
- `ConversionControllerIntegrationTest` — endpoints, auth, org validation
- Testes de regressão do fluxo de Check-up existente

### 3. Rodar testes do frontend

```bash
cd apps/web
npm run lint
npm run build
npm test   # se houver testes configurados
```

### 4. Testar o fluxo manualmente

**Pré-requisito**: ter um Check-up com AI run `status = completed`.

```bash
# 1. Preview
curl -X POST http://localhost:8080/api/checkup/reports/{reportId}/conversion/preview \
  -H "Authorization: Bearer <token>" \
  -H "X-Organization-Id: <orgId>" \
  -H "Content-Type: application/json" \
  -d '{
    "selectedItems": [
      {"sourceSection": "missing_or_unclear_requirements", "sourceItemIndex": 0},
      {"sourceSection": "quality_risks", "sourceItemIndex": 0}
    ]
  }'

# 2. Confirmar
curl -X POST http://localhost:8080/api/checkup/reports/{reportId}/conversion/confirm \
  -H "Authorization: Bearer <token>" \
  -H "X-Organization-Id: <orgId>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"sourceSection": "missing_or_unclear_requirements", "sourceItemIndex": 0, "intent": "CREATE_NEW"},
      {"sourceSection": "quality_risks", "sourceItemIndex": 0, "intent": "CREATE_NEW"}
    ]
  }'

# 3. Verificar artefatos criados
psql -U postgres -d frankintest -c "SELECT id, artifact_type, title, source_checkup_report_id, source_section FROM workspace_artifacts;"
```

### 5. Testar proteções de segurança

```bash
# Deve retornar 401
curl -X POST http://localhost:8080/api/checkup/reports/{reportId}/conversion/preview \
  -H "Content-Type: application/json" \
  -d '{"selectedItems": []}'

# Deve retornar 403
curl -X POST http://localhost:8080/api/checkup/reports/{reportId}/conversion/preview \
  -H "Authorization: Bearer <token>" \
  -H "X-Organization-Id: org_errada" \
  -H "Content-Type: application/json" \
  -d '{"selectedItems": [{"sourceSection": "quality_risks", "sourceItemIndex": 0}]}'
```

---

## Estrutura de arquivos criados neste bloco

### Backend

```
services/api/src/main/java/com/frankintest/api/
└── conversion/
    ├── ConversionModels.java
    ├── ConversionController.java
    ├── ConversionService.java
    ├── WorkspaceArtifactRepository.java
    └── ConversionTraceabilityHelper.java

services/api/src/main/resources/db/
└── schema.sql   (ALTER TABLE + CREATE TABLE adicionados)

services/api/src/test/java/com/frankintest/api/
└── conversion/
    ├── ConversionServiceTest.java
    └── ConversionControllerIntegrationTest.java
```

### Frontend

```
apps/web/src/
├── lib/conversion/
│   ├── conversionApi.ts
│   └── conversionTypes.ts
└── app/checkup/[runId]/
    └── CheckupConversionPanel.tsx   (integrado à página existente)
```
