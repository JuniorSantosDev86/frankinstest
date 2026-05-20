# Quickstart: Tool Recommendation Engine — Bloco 18

**Feature**: `018-tool-recommendation-engine`
**Date**: 2026-05-20

---

## Pré-requisitos

- Docker Compose rodando (`infra/docker-compose.yml`)
- Backend compilado (`services/api`)
- Frontend rodando (`apps/web`)
- Um relatório de Check-up concluído no banco (status `DRAFT` ou `REVIEWED`, `aiRun` concluído)

---

## 1. Subir o ambiente

```bash
cd infra
docker compose up -d

cd ../services/api
./mvnw spring-boot:run

cd ../apps/web
npm run dev
```

---

## 2. Gerar recomendações via API

Substitua `<reportId>` por um ID de relatório existente e `<token>` por um JWT demo.

```bash
curl -s -X POST \
  http://localhost:8080/api/tool-recommendations/<reportId> \
  -H "Authorization: Bearer <token>" \
  -H "X-Organization-Id: org_demo_personal" \
  | jq .
```

**Resposta esperada**: JSON com `categories[0].categoryCode = "PERFORMANCE"`, ferramentas k6 e JMeter.

---

## 3. Salvar como artefato QA_ACTION

```bash
curl -s -X POST \
  http://localhost:8080/api/tool-recommendations/<reportId>/save \
  -H "Authorization: Bearer <token>" \
  -H "X-Organization-Id: org_demo_personal" \
  | jq .
```

**Resposta esperada**: `201 Created` com `artifactType: "QA_ACTION"` e `status: "DRAFT"`.

---

## 4. Verificar artefato salvo no Workspace

```bash
curl -s \
  "http://localhost:8080/api/workspace/artifacts?artifactType=QA_ACTION" \
  -H "Authorization: Bearer <token>" \
  -H "X-Organization-Id: org_demo_personal" \
  | jq '.artifacts[] | {id, title, artifactType, status}'
```

---

## 5. Testar via UI

1. Abrir `http://localhost:3000/checkup/<runId>` (uma página de relatório existente)
2. Rolar até a seção **"Recomendações de ferramentas"**
3. Clicar no botão **"Gerar recomendações de ferramentas"**
4. Verificar que categorias, ferramentas e próximos passos aparecem em pt-BR
5. Clicar em **"Salvar como artefato"**
6. Navegar para `/workspace/artifacts` e verificar artefato `QA_ACTION` criado

---

## 6. Executar testes backend

```bash
cd services/api
./mvnw test -pl . -Dtest="ToolRecommendation*"
```

---

## 7. Verificar ausência de chamadas a AI provider

```bash
grep -r "AnthropicAiProvider\|AiProviderPort\|openai" \
  services/api/src/main/java/com/frankintest/api/toolrecommendation/ \
  && echo "FALHOU — chamada de AI encontrada" \
  || echo "OK — sem chamadas a AI provider"
```

---

## Campos-chave que ativam categoria PERFORMANCE

O engine ativa a categoria PERFORMANCE quando detecta nos campos `qualityRisks` ou `suggestedTestScenarios` do relatório qualquer uma das seguintes palavras-chave (case-insensitive):

`performance`, `latência`, `latencia`, `carga`, `load`, `stress`, `throughput`, `rps`, `tempo de resposta`, `response time`, `escalabilidade`, `escalabilidade`, `concorrência`, `concurrent`

**Promoção JMeter para PRIMARY** quando também presente:

`jmeter`, `enterprise`, `java`, `legado`, `legacy`, `soap`, `wsdl`, `ftp`, `jdbc`, `distribuída`, `distributed`, `corporativo`, `corporate`
