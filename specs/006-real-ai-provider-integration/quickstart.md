# Quickstart: Testando o Provedor Real Anthropic Localmente

Este guia explica como configurar e testar a integração real com a Anthropic API no FrankInTest sem commitar segredos. Tempo estimado: menos de 10 minutos (SC-008).

---

## Pré-requisitos

- Docker Compose rodando (`infra/docker-compose.yml`)
- Backend compilado (`./mvnw package -DskipTests` em `services/api/`)
- Uma chave de API Anthropic válida ([console.anthropic.com](https://console.anthropic.com))

---

## Passo 1: Configurar variáveis de ambiente

Crie um arquivo `.env.local` em `services/api/` (não commitado — já no `.gitignore`):

```bash
# services/api/.env.local
ANTHROPIC_API_KEY=sk-ant-...
AI_MOCK_ENABLED=false

# Opcional — padrão já é haiku
ANTHROPIC_MODEL=claude-haiku-4-5-20251001

# Opcional — padrão é 30 segundos
AI_PROVIDER_TIMEOUT_SECONDS=30

# Opcional — padrão é 4096
ANTHROPIC_MAX_TOKENS=4096
```

**Nunca commite este arquivo.** Verifique que `.env.local` está no `.gitignore`.

---

## Passo 2: Iniciar o backend com a configuração real

```bash
cd services/api
source .env.local  # exporta as variáveis para o shell atual
./mvnw spring-boot:run
```

Ou com export explícito:

```bash
ANTHROPIC_API_KEY=sk-ant-... AI_MOCK_ENABLED=false ./mvnw spring-boot:run
```

---

## Passo 3: Obter um token JWT de desenvolvimento

```bash
curl -s -X POST http://localhost:8080/api/auth/demo \
  -H "Content-Type: application/json" \
  -d '{"userId":"dev-user","organizationId":"org-test"}' | jq .token
```

---

## Passo 4: Executar um Check-up real

```bash
TOKEN="<token do passo 3>"

curl -s -X POST http://localhost:8080/api/checkup/run \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Organization-Id: org-test" \
  -H "Content-Type: application/json" \
  -d '{
    "targetType": "FEATURE_DESCRIPTION",
    "targetValue": "Sistema de login com e-mail e senha",
    "userAuthorizationConfirmed": true,
    "context": "MVP de um SaaS B2B",
    "goal": "Identificar riscos de QA antes do release",
    "depth": "STANDARD",
    "outputMode": "REPORT_WITH_SCENARIOS",
    "targetAudience": "Times de desenvolvimento e QA",
    "criticalFlows": "Login, recuperação de senha",
    "knownRisks": "Brute force, sessão não expirada",
    "technologies": "Next.js, Spring Boot, PostgreSQL"
  }' | jq .
```

Resposta esperada:
```json
{
  "aiRunId": "...",
  "reportId": "...",
  "status": "running",
  "estimatedCredits": 30
}
```

---

## Passo 5: Consultar o resultado

```bash
AI_RUN_ID="<aiRunId do passo 4>"

curl -s http://localhost:8080/api/checkup/run/$AI_RUN_ID/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Organization-Id: org-test" | jq .
```

Resultado esperado: `"status": "completed"` com as 7 seções do relatório preenchidas com conteúdo real gerado pelo Haiku, e `"aiAssisted": true` no objeto `report`.

---

## Verificações de segurança

- Confirme que `ANTHROPIC_API_KEY` não aparece nos logs do backend (nível INFO ou abaixo).
- Confirme que a resposta de erro em caso de falha não contém internals do provider.
- Confirme que o arquivo `.env.local` não está staged no git: `git status services/api/.env.local` deve mostrar "untracked" ou não aparecer.

---

## Testando falha de timeout

Para simular timeout, configure um endpoint inexistente:

```bash
ANTHROPIC_API_KEY=sk-ant-fake \
AI_MOCK_ENABLED=false \
ANTHROPIC_BASE_URL=http://localhost:9999 \
AI_PROVIDER_TIMEOUT_SECONDS=5 \
./mvnw spring-boot:run
```

Dispare um Check-up e verifique: o status do AI run deve ser `failed`, a mensagem retornada deve ser em pt-BR, e nenhum crédito deve ter sido consumido.

---

## Alternando para Sonnet

Para usar um modelo mais capaz sem mudança de código:

```bash
ANTHROPIC_MODEL=claude-sonnet-4-6 AI_MOCK_ENABLED=false ANTHROPIC_API_KEY=sk-ant-... ./mvnw spring-boot:run
```

---

## Testando chave ausente (US5 — fail-fast)

Para verificar que a ausência de chave falha na primeira chamada ao provider (não no startup):

```bash
AI_MOCK_ENABLED=false ./mvnw spring-boot:run
```

O backend deve iniciar normalmente. Ao disparar um Check-up run, a resposta deve ser um erro de configuração seguro em pt-BR, sem nenhuma tentativa de chamada HTTP à Anthropic nos logs.

---

## Rodando os testes automatizados (sem chave real)

```bash
cd services/api
./mvnw test
```

Todos os testes usam `MockAiProvider` (`AI_MOCK_ENABLED=true` por padrão nos testes). Nenhuma chave Anthropic é necessária. Todos devem passar.

Todos os testes usam `MockAiProvider`. Nenhuma chave Anthropic é necessária. Todos devem passar.
