# Quickstart: Workspace Artifact Navigation & Traceability Polish

**Feature**: 011-artifact-navigation-traceability
**Date**: 2026-05-19

---

## Pré-requisitos

```bash
# Verificar que o banco está rodando e as migrations estão aplicadas
docker compose -f infra/docker-compose.yml up -d

# Verificar que o backend compila
cd services/api && mvn compile -q

# Verificar que o frontend compila
cd apps/web && npm run build
```

---

## Rodar o ambiente de desenvolvimento

```bash
# Terminal 1 — Backend
cd services/api
mvn spring-boot:run

# Terminal 2 — Frontend
cd apps/web
npm run dev
```

Backend disponível em `http://localhost:8080`.
Frontend disponível em `http://localhost:3000`.

---

## Fluxo de desenvolvimento deste bloco

### 1. Ponto de entrada na navegação do Workspace

Localizar o componente de layout que envolve as rotas `/workspace/*`:

```
apps/web/src/app/workspace/
```

Adicionar link `<Link href="/workspace/artifacts">Revisão de Artefatos</Link>` visível na navegação/sidebar.

### 2. Seção de artefatos na página do Check-up

Arquivo: `apps/web/src/app/checkup/[runId]/page.tsx`

Criar componente `CheckupArtifactsSection` que:
- Recebe `reportId: string` e `orgId: string`, `token: string`
- Chama `listArtifacts(orgId, token, { sourceCheckupReportId: reportId })`
- Renderiza lista de artefatos com nome, tipo, status e link para `/workspace/artifacts?sourceCheckupReportId=reportId`
- Renderiza estado vazio com instrução em pt-BR quando não há artefatos

Renderizar abaixo do `CheckupConversionPanel` na página.

### 3. Traceabilidade amigável no painel de detalhes

Arquivo: `apps/web/src/components/workspace/WorkspaceArtifactDetailPanel.tsx`

Substituir os `ReadOnlyField` atuais da seção "Rastreabilidade" por apresentação melhorada:

```tsx
// sourceSection
const sectionLabel = artifact.sourceSection?.trim() || "Seção de origem não informada";

// sourceItemIndex  
const itemLabel = artifact.sourceItemIndex != null
  ? `Item de origem #${artifact.sourceItemIndex + 1}`
  : null;

// sourceCheckupReportId — link de navegação
{artifact.sourceCheckupReportId && (
  <Link href={`/checkup/${artifact.sourceCheckupReportId}`}>
    Ver relatório de origem
  </Link>
)}
```

### 4. Filtro por relatório via query param na página de artefatos

Arquivo: `apps/web/src/app/workspace/artifacts/page.tsx`

Adicionar `useSearchParams()` para ler `sourceCheckupReportId` na montagem:

```tsx
const searchParams = useSearchParams();
const initialReportId = searchParams.get('sourceCheckupReportId') ?? undefined;

// Inicializar filtros com o valor da URL
const [filters, setFilters] = useState<...>({ sourceCheckupReportId: initialReportId });
```

Exibir banner quando filtro ativo:
```tsx
{filters.sourceCheckupReportId && (
  <div className="...">
    Exibindo artefatos do relatório: {filters.sourceCheckupReportId}
    <button onClick={clearReportFilter}>Ver todos os artefatos</button>
  </div>
)}
```

---

## Comandos de validação

```bash
# Backend — testes existentes devem continuar passando
cd services/api && mvn test

# Frontend — lint
cd apps/web && npm run lint

# Frontend — build de produção
cd apps/web && npm run build

# Frontend — testes (se existirem)
cd apps/web && npm test
```

---

## Verificação manual do fluxo completo

1. Abrir `http://localhost:3000/checkup` e iniciar um Check-up
2. Aguardar o relatório ser gerado
3. Na página do relatório, converter pelo menos um item em artefato
4. Verificar que a seção "Artefatos criados a partir deste relatório" aparece com o artefato convertido
5. Clicar no link do artefato → deve navegar para `/workspace/artifacts?sourceCheckupReportId=<id>`
6. Verificar que o banner de filtro ativo aparece
7. Abrir o artefato → verificar painel de detalhes com `sourceSection`, `sourceItemIndex #N`, link "Ver relatório de origem"
8. Clicar em "Ver relatório de origem" → deve voltar para a página do Check-up
9. Clicar em "Ver todos os artefatos" no banner → deve limpar o filtro e mostrar todos
10. Verificar que o link "Revisão de Artefatos" está visível na navegação do Workspace
