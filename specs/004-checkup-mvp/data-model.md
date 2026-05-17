# Data Model: FrankInTest Check-up MVP

**Date**: 2026-05-16
**Feature**: specs/004-checkup-mvp

---

## Entidades

### CheckupRequest (input — não persistido diretamente)

Representa os dados submetidos pelo usuário ao iniciar um Check-up. Usado como payload dos endpoints de estimativa e execução.

| Campo | Tipo | Obrigatoriedade | Descrição |
|-------|------|----------------|-----------|
| `targetType` | `TargetType` (enum) | Obrigatório | URL, FEATURE_DESCRIPTION, API_DESCRIPTION, DOCUMENT, MOBILE_FLOW, OTHER |
| `targetValue` | `String` | Obrigatório | URL ou texto descritivo do alvo |
| `userAuthorizationConfirmed` | `boolean` | Obrigatório | Deve ser `true`. Rejeita com HTTP 422 se `false`. |
| `context` | `String` | Obrigatório | O que o produto/página faz |
| `goal` | `String` | Obrigatório | O que o usuário quer validar |
| `depth` | `CheckupDepth` (enum) | Obrigatório | QUICK, STANDARD, DEEP |
| `outputMode` | `OutputMode` (enum) | Obrigatório | REPORT_ONLY, REPORT_WITH_SCENARIOS |
| `targetAudience` | `String` | Opcional | Público-alvo |
| `criticalFlows` | `String` | Opcional | Fluxos críticos do produto |
| `knownRisks` | `String` | Opcional | Riscos já conhecidos |
| `technologies` | `String` | Opcional | Stack tecnológica |

**Validações**:
- `targetValue` não pode ser nulo ou vazio quando `targetType != OTHER`
- `context` mínimo de 20 caracteres (evitar submissões vazias)
- `goal` mínimo de 10 caracteres

---

### CheckupReport (persistido)

Relatório estruturado gerado pela IA. Sempre criado com `status = DRAFT`.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `UUID` | Identificador único |
| `aiRunId` | `UUID` | Referência ao AIRun que gerou o relatório |
| `organizationId` | `String` | Organização dona do relatório |
| `userId` | `String` | Usuário que solicitou o Check-up |
| `status` | `ReportStatus` (enum) | DRAFT, REVIEWED |
| `targetType` | `TargetType` (enum) | Tipo do alvo analisado |
| `targetValue` | `String` | Valor do alvo (URL ou texto) |
| `context` | `String` | Contexto fornecido pelo usuário |
| `goal` | `String` | Objetivo de validação |
| `depth` | `CheckupDepth` (enum) | Profundidade da análise |
| `qualityRisks` | `List<FindingItem>` | Riscos de qualidade identificados |
| `missingOrUnclearRequirements` | `List<FindingItem>` | Requisitos ausentes ou ambíguos |
| `suggestedTestScenarios` | `List<ScenarioItem>` | Cenários de teste sugeridos |
| `suggestedTestCases` | `List<TestCaseItem>` | Casos de teste sugeridos |
| `uxProductRisks` | `List<FindingItem>` | Riscos de UX e produto |
| `releaseReadinessNotes` | `List<FindingItem>` | Notas de release readiness |
| `recommendedNextActions` | `List<ActionItem>` | Próximas ações recomendadas |
| `rawAiOutput` | `String` | Output bruto da IA — preservado para auditoria, não exibido ao usuário |
| `createdAt` | `Instant` | Timestamp de criação |
| `updatedAt` | `Instant` | Timestamp da última atualização |

**Tabela**: `checkup_reports`

---

### FindingItem (embedded em CheckupReport)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `title` | `String` | Título do achado |
| `description` | `String` | Descrição detalhada |
| `severity` | `Severity` (enum) | LOW, MEDIUM, HIGH, CRITICAL |

**Persistência**: JSON column ou tabela `checkup_findings` com FK para `checkup_reports`.

---

### ScenarioItem (embedded em CheckupReport)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `title` | `String` | Título do cenário |
| `description` | `String` | Descrição do cenário |
| `type` | `ScenarioType` (enum) | POSITIVE, NEGATIVE, EDGE_CASE |

---

### TestCaseItem (embedded em CheckupReport)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `title` | `String` | Título do caso de teste |
| `preconditions` | `String` | Pré-condições |
| `steps` | `List<String>` | Passos do caso de teste |
| `expectedResult` | `String` | Resultado esperado |

---

### ActionItem (embedded em CheckupReport)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `action` | `String` | Ação recomendada |
| `rationale` | `String` | Justificativa |
| `priority` | `Priority` (enum) | LOW, MEDIUM, HIGH |

---

### AiRun — extensão do módulo existente

O módulo `airuns` existente é reutilizado. Extensões necessárias:

- Adicionar `checkup` ao enum `AiRunFeature`
- Adicionar `checkup_report` ao enum `OutputArtifactType`

Mapeamento de status para o contexto Check-up:

| Status existente | Significado no Check-up |
|-----------------|------------------------|
| `reserved` | Créditos reservados, ainda não chamou provider |
| `running` | Provider sendo chamado |
| `completed` | Relatório gerado e persistido, créditos capturados |
| `failed` | Falha no provider ou parse, créditos liberados |

---

## Schema SQL

```sql
CREATE TABLE checkup_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ai_run_id UUID NOT NULL REFERENCES ai_runs(id),
    organization_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    target_type VARCHAR(50) NOT NULL,
    target_value TEXT NOT NULL,
    context TEXT NOT NULL,
    goal TEXT NOT NULL,
    depth VARCHAR(20) NOT NULL,
    quality_risks JSONB NOT NULL DEFAULT '[]',
    missing_or_unclear_requirements JSONB NOT NULL DEFAULT '[]',
    suggested_test_scenarios JSONB NOT NULL DEFAULT '[]',
    suggested_test_cases JSONB NOT NULL DEFAULT '[]',
    ux_product_risks JSONB NOT NULL DEFAULT '[]',
    release_readiness_notes JSONB NOT NULL DEFAULT '[]',
    recommended_next_actions JSONB NOT NULL DEFAULT '[]',
    raw_ai_output TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_checkup_reports_org ON checkup_reports(organization_id);
CREATE INDEX idx_checkup_reports_ai_run ON checkup_reports(ai_run_id);
```

**Decisão de persistência**: Usar JSONB columns para as listas de items. Simplifica o schema do MVP sem impedir queries estruturadas se necessário. Promoção para tabelas normalizadas pode ser feita em bloco posterior quando houver integração com Workspace.

---

## Enums

```java
// Em CheckupModels.java
enum TargetType { URL, FEATURE_DESCRIPTION, API_DESCRIPTION, DOCUMENT, MOBILE_FLOW, OTHER }
enum CheckupDepth { QUICK, STANDARD, DEEP }
enum OutputMode { REPORT_ONLY, REPORT_WITH_SCENARIOS }
enum ReportStatus { DRAFT, REVIEWED }
enum Severity { LOW, MEDIUM, HIGH, CRITICAL }
enum ScenarioType { POSITIVE, NEGATIVE, EDGE_CASE }
enum Priority { LOW, MEDIUM, HIGH }
```

---

## Lógica de Estimativa de Créditos

```
baseCredits = QUICK → 10 | STANDARD → 20 | DEEP → 35
outputMultiplier = REPORT_ONLY → 1.0 | REPORT_WITH_SCENARIOS → 1.5
estimatedCredits = ceil(baseCredits * outputMultiplier)

Exemplos:
  QUICK + REPORT_ONLY = 10 créditos
  QUICK + REPORT_WITH_SCENARIOS = 15 créditos
  STANDARD + REPORT_ONLY = 20 créditos
  STANDARD + REPORT_WITH_SCENARIOS = 30 créditos
  DEEP + REPORT_ONLY = 35 créditos
  DEEP + REPORT_WITH_SCENARIOS = 53 créditos (ceil(52.5))
```
