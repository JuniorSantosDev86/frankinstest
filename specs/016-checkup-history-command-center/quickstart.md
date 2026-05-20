# Quickstart: Check-up History & Project Command Center

**Feature**: 016-checkup-history-command-center
**Date**: 2026-05-19

---

## Pré-requisitos

1. Docker rodando com `docker compose up -d` em `infra/`
2. Banco PostgreSQL acessível (verificar `services/api/src/main/resources/application.properties`)
3. `cd services/api && ./mvnw test` passando (baseline limpo)
4. `cd apps/web && npm run build` passando (baseline limpo)
5. Blocos anteriores executados:
   - Bloco 11 (Security/Auth): JWT, X-Organization-Id, rate limiting
   - Bloco 13 (Conversion): `workspace_artifacts` com coluna `source_ai_run_id`

---

## Validar que `source_ai_run_id` existe

```bash
# Verificar se coluna já existe na tabela workspace_artifacts
docker exec -it <postgres_container> psql -U <user> -d <db> \
  -c "\d workspace_artifacts" | grep source_ai_run_id
```

Se a coluna não existir, a migration do Bloco 15 deve ser executada primeiro.

---

## Rodar o backend

```bash
cd services/api
./mvnw spring-boot:run
```

Testar os novos endpoints (substituir `{token}` e `{orgId}` com valores reais):

```bash
# Lista de runs (página 0, tamanho 5)
curl -H "Authorization: Bearer {token}" \
     -H "X-Organization-Id: {orgId}" \
     "http://localhost:8080/api/checkup/runs?page=0&size=5"

# Summary do Command Center
curl -H "Authorization: Bearer {token}" \
     -H "X-Organization-Id: {orgId}" \
     "http://localhost:8080/api/checkup/runs/summary"
```

---

## Rodar os testes de backend

```bash
cd services/api
./mvnw test
```

Testes relevantes para este bloco:
- `CheckupControllerTest` — `GET /api/checkup/runs` e `GET /api/checkup/runs/summary`

---

## Rodar o frontend

```bash
cd apps/web
npm run dev
```

Acessar: `http://localhost:3000/checkup/history`

Verificar:
- Command Center carrega com totais corretos
- Lista de Check-ups exibida em ordem decrescente
- Botão "Atualizar" recarrega ambos
- Clicar em run "Concluído" abre `/checkup/{aiRunId}`
- Runs "Em andamento" e "Falhou" não têm link de relatório
- Item de navegação "Histórico de Check-ups" visível no menu lateral

---

## Rodar lint e build de frontend

```bash
cd apps/web
npm run lint
npm run build
```

---

## Fluxo de teste manual mínimo

1. Autenticar e obter JWT
2. Criar um Check-up completo (POST `/api/checkup/estimate` + POST `/api/checkup/run`)
3. Aguardar conclusão
4. Acessar `/checkup/history`
5. Verificar que o Check-up aparece na lista com status "Concluído"
6. Clicar → report abre corretamente
7. Converter itens do report em artefatos
8. Voltar ao histórico → verificar que `artifactCount` foi atualizado
9. Verificar totais do Command Center
10. Testar com org diferente → garantir zero vazamento de dados
