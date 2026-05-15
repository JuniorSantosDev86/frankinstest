# FrankInTest

FrankInTest é uma plataforma SaaS de QA assistida por IA para qualidade de software.

## Pilares do produto

- Check-up assistido por IA para landing pages, MVPs, fluxos SaaS, APIs e análise de risco de produto.
- Workspace de QA Lead para workflows profissionais de QA.
- FrankInDrift para detectar desalinhamento entre documentação, requisitos, testes e comportamento real do produto.

## Arquitetura

- Frontend: Next.js + TypeScript em `apps/web`.
- Backend core: Java 21+ com Spring Boot em `services/api`.
- Banco de dados: PostgreSQL (via Docker Compose em `infra/`).

## Como rodar localmente

### Backend

```bash
cd services/api
./mvnw spring-boot:run
```

### Frontend

```bash
cd apps/web
npm install
npm run dev
```

### Infraestrutura (banco de dados)

```bash
cd infra
docker-compose up -d
```

## Scripts do frontend

```bash
npm run dev
npm run lint
npm test
npm run build
```

## Scripts do backend

```bash
./mvnw test
./mvnw spring-boot:run
./mvnw package
```

## Variáveis de ambiente — Backend (AI Test Design)

O backend usa provedor simulado por padrão. Nenhuma chave de provedor real é necessária para desenvolvimento local ou testes automatizados.

```bash
# Provedor de IA (padrão: mock — sem chamadas externas)
AI_MOCK_ENABLED=true
ANTHROPIC_API_KEY=         # Deixar vazio em dev/test. Preencher apenas para uso com provedor real.
ANTHROPIC_MODEL=claude-sonnet-4-6
ANTHROPIC_MAX_TOKENS=1024

# Banco de dados
POSTGRES_URL=jdbc:postgresql://localhost:5432/frankintest_dev
POSTGRES_USER=frankintest
POSTGRES_PASSWORD=frankintest_dev
```

Nunca adicione `ANTHROPIC_API_KEY` ou qualquer chave de provedor a variáveis `NEXT_PUBLIC_*` ou ao frontend.

## Variáveis de ambiente — Frontend

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Status

FrankInTest está em desenvolvimento ativo. Interface em português brasileiro.
