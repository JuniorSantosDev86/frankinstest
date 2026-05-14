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

## Status

FrankInTest está em desenvolvimento ativo. Interface em português brasileiro.
