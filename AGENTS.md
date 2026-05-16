# AGENTS.md — FrankInTest Regras de Execução

Este arquivo instrui agentes de codificação por IA como Claude Code (CC) que trabalham neste repositório.

## Identidade do Produto

FrankInTest é um QA Lead SaaS com três pilares principais:

1. **Check-up mode**: teste assistido por IA para vibe coders, fundadores, landing pages, MVPs, protótipos SaaS, agências e usuários sem experiência em QA. Pago por créditos de IA / demanda.
2. **Workspace mode**: dashboard operacional completo de QA para profissionais e times, cobrindo QA manual, automação web, mobile, API, integração, carga/performance, checklists de segurança, release readiness, bugs, evidências e drift de documentação.
3. **FrankInDrift**: módulo para detectar e gerenciar drift entre requisitos, docs, testes, release notes, specs de API, promessas do produto e comportamento observado.

## Arquitetura Oficial

FrankInTest usa uma arquitetura separada de frontend/backend:

- Frontend: Next.js + TypeScript em `apps/web`.
- Backend core: Java 21+ com Spring Boot em `services/api`.
- Estilo do backend: monolito modular.
- Banco de dados: PostgreSQL.
- Infraestrutura local: Docker Compose em `infra/`.
- Contrato de API: REST com OpenAPI/Swagger.
- Workers futuros: serviços isolados para IA pesada, execução de testes, integrações, geração de relatórios, análise segura e imports.

Não implementar o FrankInTest como produto full-stack Next.js puro.

Next.js é dono da UI do produto. Spring Boot é dono da lógica de backend confiável, permissões, créditos, orquestração de IA, auditabilidade e persistência.

## Estrutura do Repositório

```
frankintest/
  apps/
    web/
      src/
      public/
      tests/
      package.json
      next.config.ts
      tsconfig.json
      (demais configs do Next.js)
  services/
    api/
      src/main/java/com/frankintest/api/
      src/test/java/com/frankintest/api/
      pom.xml
  infra/
    docker-compose.yml
  docs/
    (documentação local, não sobe para o repo — ver .gitignore)
  AGENTS.md
  README.md
  .gitignore
```

## Idioma da Interface

A interface do FrankInTest é implementada **somente em português brasileiro (PT-BR)** durante o MVP.

O i18n foi simplificado para somente `pt-BR`. O seletor de idioma foi removido da UI.

Não adicionar novos textos, telas, labels ou dicionários de tradução para en ou es durante o MVP.

A estrutura do arquivo `i18n.ts` está preservada — as traduções en e es poderão ser reintroduzidas em um bloco dedicado de hardening pós-MVP.

A internacionalização completa (en e es) será executada após o MVP estar estável e funcional.

## Regra do Produto Não-Negociável

Não construir um app de chat de IA genérico. A IA deve estar vinculada a artefatos de QA estruturados.

Sempre que a IA gerar algo, deve ser possível salvá-lo como um dos seguintes:

- Requisito
- Regra de negócio
- Cenário de teste
- Caso de teste
- Ciclo de teste
- Bug report
- Resumo de evidência
- Item de risco
- Relatório de release readiness
- Drift finding
- Sugestão de automação
- Recomendação de integração

## Documentos Fonte de Verdade

Antes de codar, ler:

- `docs/PRODUCT_VISION.md`
- `docs/PRODUCT_PILLARS.md`
- `docs/BUSINESS_RULES.md`
- `docs/ROADMAP.md`
- `docs/CURRENT_STATUS.md`
- `docs/ARCHITECTURE.md`
- `docs/TECH_STACK_DECISION.md`
- `docs/QA_STRATEGY.md`
- `docs/AI_USAGE_POLICY.md`
- `docs/SECURITY_LGPD.md`
- `docs/FRANKINTEST_CHECKUP_SPEC.md`
- `docs/QA_LEAD_WORKSPACE_SPEC.md`
- `docs/FRANKINDRIFT_SPEC.md`

## Princípios de Engenharia

- Preferir arquitetura simples, explícita e manutenível.
- Construir por fatias verticais, não sistemas abstratos amplos.
- Manter workflows determinísticos como centro.
- Usar IA apenas onde ela gera alavancagem real.
- Manter créditos, controle de custo e limites de billing explícitos.
- Evitar jobs de background com alto consumo de token sem ação de usuário clara e evento de billing claro.
- Manter o data model pronto para organizações, projetos, módulos, requisitos, testes, bugs, evidências, relatórios, integrações e AI runs.
- Não implementar ações destrutivas sem confirmação ou trilha de auditoria.
- Não colocar lógica de negócio crítica em componentes de frontend.
- Manter módulos do backend explícitos e testáveis.
- Não criar microserviços antes do monolito modular estar estável.

## Princípios do Backend

- Java/Spring Boot é o backend core confiável.
- PostgreSQL é a fonte de verdade.
- Toda mutação deve validar autenticação, acesso à organização, acesso ao projeto, schema de input, entitlement quando aplicável, e requisitos de auditoria quando aplicável.
- Respostas de API devem ser estruturadas, previsíveis e documentadas.
- Regras de negócio devem viver em services, não em controllers.
- Controllers devem ser thin.
- Testes devem cobrir services, fronteiras de API e regras sensíveis de segurança.

## Princípios do Frontend

- Next.js é a camada de experiência do produto.
- O frontend deve ser limpo, profissional, responsivo e amigável para iniciantes sem perder credibilidade de QA.
- Não armazenar secrets no frontend.
- Não chamar provedores de IA diretamente do frontend.
- Não calcular consumo final de créditos no frontend.
- Não confiar apenas em verificações client-side para permissões.

## Princípios de Segurança

- Nunca executar scans de segurança invasivos sem autorização explícita do usuário.
- Realizar apenas verificações seguras e não-destrutivas nas versões iniciais.
- Respeitar rate limits e robots/políticas onde aplicável.
- Manter secrets fora do código cliente.
- Não armazenar tokens de API em texto plano.
- Construir audit logs para AI runs, integrações, geração de relatórios e ações destrutivas.
- Seguir princípios LGPD desde o início.
- Workers futuros de execução de testes devem ser isolados e limitados.

## Requisitos de QA para Cada Bloco

Cada bloco deve incluir, quando aplicável:

- Testes unitários para lógica de negócio pura.
- Testes de service/API no backend Spring Boot.
- Testes de integração para banco de dados e comportamento de permissões quando aplicável.
- Testes E2E para fluxos críticos quando aplicável.
- Checklist de QA manual para revisão visual, responsividade e UX.
- Run report claro explicando o que mudou, o que não mudou e como foi validado.

## Fora de Escopo Salvo Solicitação Explícita

- Redesign visual amplo.
- Integração real com provedor de billing antes da fundação de entitlement.
- Pentesting invasivo real.
- Infraestrutura de browser farm / device farm.
- Autonomia total de agente de IA sem gates de aprovação.
- Complexidade multi-tenant enterprise antes do core MVP estar estável.
- Microserviços antes do monolito modular estar validado.
- Execução real de test runner antes de worker boundaries seguros existirem.
- Novos textos de UI em en ou es durante o MVP.

## Formato Obrigatório de Run Report

Ao final de cada bloco, reportar:

1. Arquivos alterados ou criados.
2. Funcionalidades implementadas.
3. Regras de negócio preservadas.
4. Testes adicionados/atualizados.
5. Comandos de validação executados.
6. Limitações conhecidas.
7. Atualizações de roadmap/status atual.
8. Mensagem de commit sugerida.

<!-- SPECKIT START -->
Current Spec Kit plan:
- `specs/003-workspace-navigation-fix/plan.md`

For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan above.
<!-- SPECKIT END -->
