# Quickstart: FrankInDrift — Drift Detection Foundation

**Branch**: `017-frankindrift-foundation`

---

## Pré-requisitos

- Docker e Docker Compose instalados
- Java 21+ e Maven configurados
- Node.js 20+ e npm/yarn configurados
- Blocos 13, 14, 15 e 16 implementados (workspace_artifacts, conversão, revisão e histórico)

---

## 1. Subir infraestrutura local

```bash
cd infra/
docker compose up -d
```

Aguardar PostgreSQL disponível em `localhost:5432`.

---

## 2. Aplicar schema (inclui o novo índice do Bloco 17)

O `schema.sql` do projeto usa `IF NOT EXISTS` em todas as definições. O Spring Boot aplica automaticamente ao subir, mas para aplicar manualmente:

```bash
cd services/api/
./mvnw spring-boot:run
# Ou via psql:
psql -U frankintest -d frankintest -f src/main/resources/db/schema.sql
```

**Índice adicionado pelo Bloco 17**:
```sql
CREATE INDEX IF NOT EXISTS idx_workspace_artifacts_org_source_report
    ON workspace_artifacts(organization_id, source_checkup_report_id);
```

Verificar que o índice foi criado:
```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'workspace_artifacts'
  AND indexname = 'idx_workspace_artifacts_org_source_report';
```

---

## 3. Subir o backend

```bash
cd services/api/
./mvnw spring-boot:run
```

API disponível em `http://localhost:8080`.

**Novos endpoints de drift**:
- `GET /api/drift/artifacts/{artifactId}` — Status de drift de um artefato
- `GET /api/drift/reports/{reportId}` — Resumo de drift de um relatório

Testar autenticação (sem JWT deve retornar 401):
```bash
curl -s http://localhost:8080/api/drift/artifacts/qualquer-id | jq .
# Esperado: 401
```

---

## 4. Subir o frontend

```bash
cd apps/web/
npm install
npm run dev
```

Frontend disponível em `http://localhost:3000`.

**Verificar integração de drift**:
1. Acessar uma tela de detalhe de artefato derivado de Check-up
2. O indicador de drift deve aparecer após o carregamento do artefato (chamada separada)
3. Editar título ou status do artefato → recarregar → indicador deve mostrar "Possível drift"

---

## 5. Rodar testes

```bash
# Backend — todos os testes incluindo drift
cd services/api/
./mvnw test

# Testes específicos do módulo drift
./mvnw test -pl . -Dtest="DriftServiceTest,DriftControllerTest"

# Frontend — lint + build
cd apps/web/
npm run lint
npm run build
```

---

## 6. Smoke test manual

### 6a. Verificar drift em artefato sem edição (SEM_DRIFT)

```bash
# Obter JWT (usar endpoint de auth existente)
JWT="Bearer <seu-token>"
ORG_ID="<sua-org-id>"
ARTIFACT_ID="<id-de-artefato-sem-edicao>"

curl -H "Authorization: $JWT" \
     -H "X-Organization-Id: $ORG_ID" \
     http://localhost:8080/api/drift/artifacts/$ARTIFACT_ID | jq .

# Esperado: { "driftStatus": "SEM_DRIFT", "signals": [] }
```

### 6b. Verificar drift em artefato editado (POSSIVEL_DRIFT)

1. Editar título de um artefato via `PATCH /api/workspace/artifacts/{id}`
2. Chamar `GET /api/drift/artifacts/{id}`
3. Esperado: `driftStatus: "POSSIVEL_DRIFT"` com sinal `EDITED_AFTER_CREATION`

### 6c. Verificar resumo de drift de relatório

```bash
REPORT_ID="<id-de-run-de-checkup>"

curl -H "Authorization: $JWT" \
     -H "X-Organization-Id: $ORG_ID" \
     http://localhost:8080/api/drift/reports/$REPORT_ID | jq .

# Esperado: countByStatus com totais por status, missingSections se houver
```

### 6d. Verificar isolamento de organização

```bash
# Usar X-Organization-Id de uma organização diferente da dona do artefato
curl -H "Authorization: $JWT" \
     -H "X-Organization-Id: outra-org-id" \
     http://localhost:8080/api/drift/artifacts/$ARTIFACT_ID | jq .

# Esperado: 404 (não revela existência do artefato em outra org)
```
