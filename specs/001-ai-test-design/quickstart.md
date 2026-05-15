# Quickstart: AI Test Design Assistance

## Preconditions

- PostgreSQL is available through `infra/docker-compose.yml`.
- Backend runs from `services/api`.
- Frontend runs from `apps/web`.
- Automated tests use the mock AI provider.
- Real provider use is optional and configured only on the backend.

## Environment

Backend local defaults:

```bash
POSTGRES_URL=jdbc:postgresql://localhost:5432/frankintest_dev
POSTGRES_USER=frankintest
POSTGRES_PASSWORD=frankintest_dev
AI_MOCK_ENABLED=true
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-4-6
ANTHROPIC_MAX_TOKENS=1024
```

Frontend local defaults:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Do not add provider API keys to `apps/web` or any `NEXT_PUBLIC_*` variable.

## Run Locally

1. Start local infrastructure:

   ```bash
   docker compose -f infra/docker-compose.yml up -d
   ```

2. Start backend:

   ```bash
   cd services/api
   ./mvnw spring-boot:run
   ```

3. Start frontend:

   ```bash
   cd apps/web
   npm run dev
   ```

4. Open the Workspace and use AI assistance inside test design:

   - Select a business rule and request scenario generation.
   - Confirm the displayed credit estimate.
   - Verify generated scenarios appear as `rascunho` and `assistido por IA`.
   - Select a scenario and generate test cases when the UI supports safe persistence.

## Validation Commands

Backend:

```bash
cd services/api
./mvnw test
```

Frontend:

```bash
cd apps/web
npm run lint
npm test
npm run build
```

## Manual QA Checklist

- Estimate is shown before generation.
- Loading, success, error, and empty states are in pt-BR.
- Generated artifacts are visibly draft and AI-assisted.
- Frontend network calls go only to the FrankInTest backend.
- No provider key appears in browser-visible code, logs, payloads, or env names.
- Provider/platform failure does not show consumed final credits.
- Run status can be traced after success or failure.
