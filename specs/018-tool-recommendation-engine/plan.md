# Implementation Plan: Tool Recommendation Engine — Bloco 18

**Branch**: `main` | **Date**: 2026-05-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/018-tool-recommendation-engine/spec.md`

---

## Summary

Implementar o **Tool Recommendation Engine** — primeira vertical: **Performance Planning Guidance com k6/JMeter**. O backend computa recomendações determinísticas de ferramentas de QA a partir dos dados reais de um relatório de Check-up (sem AI), retorna um `ToolRecommendationResult` estruturado e permite salvar o resultado como artefato `QA_ACTION` no Workspace. O frontend adiciona um painel na página de relatório existente com CTA explícito, exibição de categorias/ferramentas/próximos passos em pt-BR e botão de salvar.

---

## Technical Context

**Language/Version**: Java 21 + Spring Boot (`services/api`); Next.js 14 + TypeScript (`apps/web`)

**Primary Dependencies**: Spring Boot, PostgreSQL via JdbcTemplate, Jackson (já presentes); React, Tailwind, fetch API (já presentes no frontend)

**Storage**: PostgreSQL — tabela `workspace_artifacts` existente reutilizada para artefatos salvos. Nenhuma nova migração.

**Testing**: Testes unitários para `ToolRecommendationEngine`; testes de integração para controller (geração + save + auth); testes de componente para `ToolRecommendationPanel`

**Target Platform**: Linux server (Docker Compose local + deploy cloud)

**Performance Goals**: Resposta do endpoint de recomendação < 300ms (SC-001) — lógica determinística pura, sem I/O adicional exceto leitura do relatório no banco

**Constraints**: Zero chamadas a AI provider; sem nova rota no frontend; sem nova tabela no banco; sem alteração em endpoints existentes

**Scale/Scope**: MVP — uma categoria de ferramenta (`PERFORMANCE`), dois endpoints, um componente de UI

---

## Constitution Check

| Princípio | Status | Evidência |
|-----------|--------|-----------|
| **I. Arquitetura Oficial** — UI em `apps/web`, lógica em `services/api`, PostgreSQL como fonte de verdade | **PASS** | Backend em `toolrecommendation/`; frontend em `app/checkup/[runId]/`; sem nova tabela |
| **II. Fronteiras de Responsabilidade** — backend owna regras, persistência, permissões | **PASS** | Engine, validação de org e criação de artefato ficam todos no service |
| **III. Governança de IA** — resultado salvável como artefato estruturado; sem AI neste bloco | **PASS** | `QA_ACTION` com `details` estruturado; `FR-006` proíbe chamadas a AI; `SC-005` verifica por grep |
| **IV. Segurança/LGPD** — JWT + org validados; sem secrets no frontend | **PASS** | `WorkspaceAccessService.requireOrgAccess()` em ambos os endpoints; 404 para cross-org |
| **V. Idioma MVP** — toda nova UI em pt-BR | **PASS** | Labels, botões, mensagens e próximos passos todos em pt-BR |
| **Disciplina de Qualidade** — unit tests + integração backend; component test frontend | **PASS** | `ToolRecommendationEngineTest` (unit) + `ToolRecommendationControllerTest` (integração) |
| **Disciplina de Execução** — escopo pequeno, sem refactor não relacionado | **PASS** | Bloco entrega somente o módulo `toolrecommendation/` + painel de UI |

**Nenhuma violação. Nenhuma entrada na tabela de Complexity Tracking.**

---

## Project Structure

### Documentation (este bloco)

```text
specs/018-tool-recommendation-engine/
├── spec.md              # Feature spec (clarificada)
├── plan.md              # Este arquivo
├── research.md          # Decisões de design e pesquisa
├── data-model.md        # Entidades e campos
├── quickstart.md        # Guia de execução e validação
├── contracts/
│   └── api-contracts.md # Contratos dos dois endpoints
└── tasks.md             # Gerado por /speckit-tasks (não criado aqui)
```

### Source Code

```text
services/api/src/main/java/com/frankintest/api/
└── toolrecommendation/                         ← módulo novo
    ├── ToolRecommendationController.java       ← endpoints POST /{reportId} e POST /{reportId}/save
    ├── ToolRecommendationService.java          ← orquestra engine + repository
    ├── ToolRecommendationEngine.java           ← lógica determinística k6/JMeter
    └── ToolRecommendationModels.java           ← DTOs e enums

services/api/src/test/java/com/frankintest/api/
└── toolrecommendation/
    ├── ToolRecommendationEngineTest.java       ← unit tests do engine
    └── ToolRecommendationControllerTest.java   ← integração: endpoints, auth, save

apps/web/src/
├── app/checkup/[runId]/
│   ├── page.tsx                                ← adicionar <ToolRecommendationPanel>
│   └── ToolRecommendationPanel.tsx             ← componente novo
└── lib/toolrecommendations/
    ├── toolRecommendationsApi.ts               ← fetch para POST /{reportId} e POST /{reportId}/save
    └── toolRecommendationsTypes.ts             ← tipos TypeScript
```

**Sem alterações em**: `checkup/`, `conversion/`, `workspace/`, `drift/`, rotas de frontend existentes.

---

## Architecture Decisions

### AD-01: Módulo `toolrecommendation/` independente no monolito

O módulo é irmão de `drift/`, `workspace/`, `conversion/`. Nenhuma dependência bidirecional — consome `CheckupRepository` e `WorkspaceArtifactRepository` (injeção de dependência). Segue o padrão modular estabelecido.

### AD-02: `ToolRecommendationEngine` como classe de serviço pura (sem estado, sem I/O)

O engine recebe um `CheckupReport` e retorna um `ToolRecommendationResult`. Testável em isolamento sem banco, sem mocks de infra. O service orquestra: busca relatório → chama engine → retorna resultado.

### AD-03: Validação de org inline no service (não nova query no repositório)

`CheckupRepository.findById(reportId)` retorna o relatório com `organizationId`. O service valida `report.organizationId().equals(organizationId)` — se não bater, lança `ReportNotFoundException` (→ 404). Padrão idêntico ao `DriftService`.

### AD-04: `/save` regenera o resultado no momento do save (não recebe body)

O endpoint `/save` chama o engine novamente com os dados do banco — não armazena estado entre chamadas. Garante consistência: o artefato salvo sempre reflete os dados reais, não um resultado intermediário do cliente.

### AD-05: Painel de UI sem nova rota

`ToolRecommendationPanel` é adicionado à `page.tsx` existente do relatório — após `DriftSummaryPanel`. Estado local: `idle | loading | loaded | error`. O botão "Gerar recomendações" aciona `POST /api/tool-recommendations/{reportId}`; o botão "Salvar como artefato" aciona `POST /api/tool-recommendations/{reportId}/save`.

---

## Modelo de Dados

Ver [data-model.md](data-model.md) para detalhes completos.

**Resumo**:
- `ToolRecommendationResult` — em memória, retornado pelo endpoint, não persistido
- `ToolRecommendationCategory` — PERFORMANCE (único neste bloco)
- `RecommendedTool` — k6 (PRIMARY por padrão) + JMeter (SECONDARY por padrão, PRIMARY em contexto enterprise/Java)
- `WorkspaceArtifact` (QA_ACTION) — tabela existente, artefato salvo explicitamente pelo usuário

---

## Contratos de API

Ver [contracts/api-contracts.md](contracts/api-contracts.md) para detalhes completos.

**Endpoints**:
- `POST /api/tool-recommendations/{reportId}` → `200 ToolRecommendationResult`
- `POST /api/tool-recommendations/{reportId}/save` → `201 { artifactId, artifactType, title, status, createdAt }`

**Auth em ambos**: 401 (sem JWT), 403 (org inválida), 404 (relatório inexistente ou cross-org), 422 (relatório não concluído)

---

## Estratégia de Testes — Backend

### `ToolRecommendationEngineTest` (unit)

| Cenário | Verificação |
|---------|-------------|
| Relatório com `qualityRisks` contendo "performance" | Categoria PERFORMANCE presente; k6 = PRIMARY |
| Relatório com keywords enterprise ("jmeter", "java", "legado") | JMeter = PRIMARY, k6 = SECONDARY |
| Relatório sem sinais de performance | `categories` vazia — PERFORMANCE ausente |
| `targetType = URL` sem keywords | k6 = PRIMARY como default |
| Keywords case-insensitive ("PERFORMANCE", "Latência") | Detecção funciona corretamente |
| `qualityRisks` vazia + `suggestedTestScenarios` com keywords | Categoria presente (ambos campos inspecionados) |

### `ToolRecommendationControllerTest` (integração com banco)

| Cenário | Verificação |
|---------|-------------|
| `POST /api/tool-recommendations/{reportId}` com relatório válido da org | 200 + categories não vazias |
| `POST /api/tool-recommendations/{reportId}` sem JWT | 401 |
| `POST /api/tool-recommendations/{reportId}` sem `X-Organization-Id` | 403 |
| `POST /api/tool-recommendations/{reportId}` com relatório de outra org | 404 |
| `POST /api/tool-recommendations/{reportId}` com reportId inexistente | 404 |
| `POST /api/tool-recommendations/{reportId}/save` com relatório válido | 201 + artefato `QA_ACTION` no banco com `details` não nulo |
| `POST /api/tool-recommendations/{reportId}/save` duas vezes para o mesmo relatório | 2 artefatos distintos no banco (sem sobrescrita) |
| `POST /api/tool-recommendations/{reportId}/save` sem JWT | 401 |
| Verificação de ausência de chamadas a AI provider | grep no código confirma SC-005 (ver T-15) |

---

## Estratégia de Testes — Frontend

### `ToolRecommendationPanel` (component test)

| Cenário | Verificação |
|---------|-------------|
| Estado inicial (sem recomendações) | Botão "Gerar recomendações de ferramentas" visível |
| Loading após clique | Indicador de carregamento exibido |
| Resposta de sucesso | Categorias, ferramentas e próximos passos renderizados em pt-BR |
| Clique em "Salvar como artefato" | Chama `POST /save`; exibe confirmação em pt-BR |
| Erro na geração | Mensagem de erro discreta; restante da página intacto |
| Erro no save | Mensagem de erro discreta; resultado ainda visível |

---

## Riscos de Regressão

| Risco | Mitigação |
|-------|-----------|
| Alteração acidental em `CheckupController` ou `CheckupRepository` | Novos arquivos em `toolrecommendation/`; `CheckupRepository` consumido somente via injeção; SC-007 verifica regressões |
| `WorkspaceArtifactRepository.save()` afetado por novo uso | Método existente usado sem alteração; teste de integração valida o artefato salvo |
| Página `[runId]/page.tsx` quebrada por novo componente | `ToolRecommendationPanel` é adicionado como seção independente; erro interno exibe mensagem discreta |
| Rate limiting bloqueando testes de integração | Testes usam perfil de teste com rate limit desabilitado (padrão existente via `BaseIntegrationTest`) |

---

## Fora de Escopo

- Execução real de k6 ou JMeter
- Runner, worker ou disparo de carga contra URLs
- Chamadas a AI provider
- Categorias além de `PERFORMANCE` (WEB_AUTOMATION, API_TESTING, etc. são pós-MVP)
- Nova rota de frontend dedicada a recomendações
- Paginação ou listagem de recomendações históricas
- Billing ou consumo de créditos
- Restrições de transição de status do artefato salvo (herdadas do Bloco 14 — livres no MVP)

---

## Critérios de Aceite

Mapeados diretamente dos Success Criteria da spec:

| Critério | Como verificar |
|----------|----------------|
| SC-001: endpoint retorna em < 300ms | Teste de integração mede tempo de resposta; lógica determinística sem AI garante isso |
| SC-002: categoria PERFORMANCE presente/ausente conforme contexto | `ToolRecommendationEngineTest` cobre presença e ausência |
| SC-003: artefato salvo aparece na listagem com tipo `QA_ACTION` | `ToolRecommendationControllerTest` verifica artefato no banco; UI mostra na listagem de artefatos |
| SC-004: 401/403/404 corretos | `ToolRecommendationControllerTest` cobre todos os cenários de auth/org |
| SC-005: zero chamadas a AI provider | `grep -r "AnthropicAiProvider\|AiProviderPort" toolrecommendation/` sem resultado |
| SC-006: testes backend passam; lint + build frontend passam | `./mvnw test`; `npm run lint && npm run build` |
| SC-007: endpoints existentes não regridem | Suite de testes existente passa sem alterações |

---

## Próximo Passo

Executar `/speckit-tasks` para gerar `tasks.md` com tarefas ordenadas por dependência, prontas para implementação.
