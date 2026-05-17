# Quickstart: FrankInTest Check-up MVP

**Date**: 2026-05-16
**Feature**: specs/004-checkup-mvp

Guia rápido para rodar e validar o Check-up MVP localmente.

---

## Pré-requisitos

- Docker e Docker Compose instalados
- Java 21+ e Maven
- Node.js 20+ e npm
- Variável `ANTHROPIC_API_KEY` configurada (para execução real; mock não precisa)

---

## 1. Subir infraestrutura local

```bash
cd infra/
docker compose up -d
```

Verificar que PostgreSQL está rodando:

```bash
docker compose ps
```

---

## 2. Rodar migrations do banco

```bash
cd services/api/
./mvnw flyway:migrate
```

A migration `V004__checkup_reports.sql` cria a tabela `checkup_reports`.

---

## 3. Rodar o backend

```bash
cd services/api/
./mvnw spring-boot:run
```

Backend disponível em `http://localhost:8080`.

---

## 4. Testar os endpoints de Check-up

### Estimar créditos

```bash
curl -X POST http://localhost:8080/api/checkup/estimate \
  -H "Content-Type: application/json" \
  -d '{
    "targetType": "FEATURE_DESCRIPTION",
    "targetValue": "Sistema de login com email e senha",
    "userAuthorizationConfirmed": true,
    "context": "Módulo de autenticação de um SaaS de gestão de projetos",
    "goal": "Identificar riscos de segurança e edge cases de validação",
    "depth": "STANDARD",
    "outputMode": "REPORT_WITH_SCENARIOS"
  }'
```

Resposta esperada: `{ "estimatedCredits": 30, ... }`

### Executar Check-up

```bash
curl -X POST http://localhost:8080/api/checkup/run \
  -H "Content-Type: application/json" \
  -d '{
    "targetType": "FEATURE_DESCRIPTION",
    "targetValue": "Sistema de login com email e senha",
    "userAuthorizationConfirmed": true,
    "context": "Módulo de autenticação de um SaaS de gestão de projetos",
    "goal": "Identificar riscos de segurança e edge cases de validação",
    "depth": "STANDARD",
    "outputMode": "REPORT_WITH_SCENARIOS"
  }'
```

Resposta esperada: `{ "aiRunId": "...", "reportId": "...", "status": "running", ... }`

### Consultar resultado

```bash
curl http://localhost:8080/api/checkup/runs/{aiRunId}
```

---

## 5. Rodar testes do backend

```bash
cd services/api/
./mvnw test
```

Todos os testes de Check-up usam `MockAiProvider` — sem necessidade de API key real.

Testes relevantes:
- `CheckupEstimateControllerTest`
- `CheckupRunControllerTest`
- `CheckupCreditFlowTest`
- `CheckupAuditEventTest`
- `CheckupReportParserTest`

---

## 6. Rodar o frontend

```bash
cd apps/web/
npm install
npm run dev
```

Frontend disponível em `http://localhost:3000`.

Navegar para `http://localhost:3000/checkup` para acessar o formulário de Check-up.

---

## 7. Validações de qualidade do frontend

```bash
cd apps/web/
npm run lint
npm test
npm run build
```

Todos devem passar sem erros.

---

## 8. Verificações de segurança

```bash
# Confirmar ausência de API keys no frontend
grep -r "ANTHROPIC\|sk-ant\|api_key" apps/web/src/ && echo "FALHOU" || echo "OK"

# Confirmar ausência de chamadas diretas a providers no frontend
grep -r "anthropic.com\|api.openai.com" apps/web/src/ && echo "FALHOU" || echo "OK"
```

---

## Perfis de Spring Boot

| Perfil | Provider de IA | Uso |
|--------|---------------|-----|
| `default` / `test` | `MockAiProvider` | Testes automatizados e desenvolvimento local sem API key |
| `prod` | `AnthropicAiProvider` | Produção com `ANTHROPIC_API_KEY` configurada |

Ativar perfil mock explicitamente:

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=test
```
