# Research: FrankInTest Check-up MVP

**Date**: 2026-05-16
**Feature**: specs/004-checkup-mvp

---

## Findings

### 1. AiProviderPort — Interface existente (sem alteração necessária)

**Decision**: Usar `AiProviderPort.generate(String prompt)` sem modificação.

**Rationale**: A interface já suporta o contrato necessário — recebe prompt estruturado, retorna `AiProviderResponse` com `content`, `inputTokens`, `outputTokens`, `success`, `errorMessage`. O módulo `checkup` simplesmente a injeta e invoca via `AiProviderSelector`.

**Alternatives considered**: Criar método `generateStructured()` específico para Check-up. Rejeitado — a interface atual é suficiente; o parser de output fica no `CheckupService`, não no port.

---

### 2. AiRunModels — Extensão necessária

**Decision**: Adicionar `checkup` ao enum `AiRunFeature` e `checkup_report` ao enum `OutputArtifactType`. Adicionar campo `rawOutput: String` opcional ao `AiRun` para preservar output bruto para auditoria.

**Rationale**: O ciclo de vida PENDING→RUNNING→COMPLETED|FAILED já está modelado nos status existentes (`estimated`, `reserved`, `running`, `completed`, `failed`). O mapeamento é: PENDING = `reserved`, RUNNING = `running`, COMPLETED = `completed`, FAILED = `failed`.

**Alternatives considered**: Criar tabela separada de AI runs para Check-up. Rejeitado — o módulo `airuns` existente já oferece o rastreamento necessário; reutilizar mantém o modelo coerente.

---

### 3. CreditService — Sem alteração necessária

**Decision**: Usar `CreditService.reserve()`, `capture()`, `release()`, `hasEnoughCredits()` sem modificação.

**Rationale**: A API do serviço de créditos cobre exatamente o padrão pre-capture → final capture | release necessário para o Check-up.

---

### 4. AuditService — Novos eventos de Check-up

**Decision**: Registrar novos eventos no `AuditService` existente: `CHECK_UP_REQUESTED`, `CHECK_UP_CREDITS_RESERVED`, `CHECK_UP_RUNNING`, `CHECK_UP_COMPLETED`, `CHECK_UP_FAILED`, `CHECK_UP_CREDITS_RELEASED`.

**Rationale**: `JdbcAuditService` já implementa persistência de eventos. Apenas novos valores de `eventType` são necessários.

---

### 5. Estimativa de créditos — Lógica de cálculo

**Decision**: Cálculo baseado em `depth` e `outputMode`:
- Base: QUICK=10, STANDARD=20, DEEP=35 créditos
- Multiplicador de `outputMode`: REPORT_ONLY=1.0x, REPORT_WITH_SCENARIOS=1.5x
- Os valores são fixos no MVP — sem variação por tipo de alvo ou tamanho do contexto.

**Rationale**: Modelo simples e previsível para o MVP. O usuário consegue estimar o custo sem surpresas.

**Alternatives considered**: Cálculo dinâmico baseado em tokens estimados do contexto. Rejeitado para o MVP — adiciona complexidade de estimativa antes de termos dados reais de consumo.

---

### 6. Parser de output de IA — Estratégia de fallback

**Decision**: O `CheckupService` invoca a IA com prompt estruturado que exige JSON com as seções definidas. O parser tenta deserializar cada seção de forma independente. Se uma seção falha no parse, ela é substituída por lista vazia — a análise não é cancelada. O `rawAiOutput` é sempre persistido independente do resultado do parse.

**Rationale**: Resiliência parcial é preferível a falha total. Um relatório com algumas seções ausentes ainda tem valor para o usuário.

---

### 7. Polling de status no frontend

**Decision**: O frontend faz polling de `GET /api/checkup/runs/{aiRunId}` a cada 3 segundos, com timeout máximo de 5 minutos. Se o timeout for atingido, exibe mensagem de erro orientando o usuário a atualizar a página.

**Rationale**: Streaming de IA está fora de escopo neste bloco. Polling simples é suficiente para o MVP.

---

### 8. Estrutura de módulo no backend

**Decision**: Criar módulo `checkup` em `services/api/src/main/java/com/frankintest/api/checkup/` com os pacotes: `CheckupController`, `CheckupService`, `CheckupModels`, `CheckupRepository`, `CheckupPromptBuilder`, `CheckupReportParser`.

**Rationale**: Segue o padrão de módulos existentes (credits, airuns, audit, testdesign). Módulo autocontido com dependências explícitas nos serviços de infraestrutura compartilhada.

---

### 9. Rota de frontend

**Decision**: Rota `/checkup` em `apps/web/src/app/checkup/` com os arquivos: `page.tsx` (formulário), `[runId]/page.tsx` (relatório/status).

**Rationale**: Rota dedicada isola o Check-up do Workspace. Subrota com `[runId]` permite acesso direto ao resultado via URL — útil para o caso de fechamento de browser durante processamento.

---

### 10. Autenticação no MVP

**Decision**: Manter o auth mock do MVP existente. O `CheckupController` usa o mesmo mecanismo de resolução de `organizationId` e `userId` que os demais controllers.

**Rationale**: Auth real está fora de escopo neste bloco per `docs/BLOCO_10_SPEC.md` e spec.md.
