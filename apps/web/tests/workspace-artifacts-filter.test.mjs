import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

// ── T029: US5 — sourceCheckupReportId query param filter ─────────────────────

const pageSrc = readFileSync(
  "src/app/workspace/artifacts/page.tsx",
  "utf8"
);

test("workspace/artifacts/page.tsx — lê sourceCheckupReportId via useSearchParams", () => {
  assert.ok(
    pageSrc.includes("useSearchParams"),
    "deve importar e usar useSearchParams"
  );
  assert.ok(
    pageSrc.includes("sourceCheckupReportId"),
    "deve ler o parâmetro sourceCheckupReportId da URL"
  );
});

test("workspace/artifacts/page.tsx — inicializa filtros com initialReportId da URL", () => {
  assert.ok(
    pageSrc.includes("initialReportId"),
    "deve extrair initialReportId da URL"
  );
  assert.ok(
    pageSrc.includes("sourceCheckupReportId: initialReportId"),
    "deve inicializar filtros com sourceCheckupReportId da URL"
  );
});

test("workspace/artifacts/page.tsx — exibe banner quando filtro de relatório ativo", () => {
  assert.ok(
    pageSrc.includes("Exibindo artefatos do relatório:"),
    "deve exibir banner com ID do relatório quando filtro ativo"
  );
});

test("workspace/artifacts/page.tsx — botão 'Ver todos os artefatos' limpa o filtro", () => {
  assert.ok(
    pageSrc.includes("Ver todos os artefatos"),
    "deve ter botão 'Ver todos os artefatos'"
  );
  assert.ok(
    pageSrc.includes("clearReportFilter"),
    "deve implementar função clearReportFilter"
  );
});

test("workspace/artifacts/page.tsx — banner condicional apenas quando filtro ativo", () => {
  assert.ok(
    pageSrc.includes("filters.sourceCheckupReportId &&"),
    "banner deve ser renderizado apenas quando sourceCheckupReportId definido"
  );
});

test("workspace/artifacts/page.tsx — usa Suspense para useSearchParams", () => {
  assert.ok(
    pageSrc.includes("Suspense"),
    "deve envolver componente com Suspense para compatibilidade com useSearchParams no Next.js"
  );
});

// ── WorkspaceArtifactList — onClearReportFilter prop ─────────────────────────

const listSrc = readFileSync(
  "src/components/workspace/WorkspaceArtifactList.tsx",
  "utf8"
);

test("WorkspaceArtifactList — aceita prop onClearReportFilter opcional", () => {
  assert.ok(
    listSrc.includes("onClearReportFilter"),
    "deve aceitar prop onClearReportFilter"
  );
  assert.ok(
    listSrc.includes("onClearReportFilter?:"),
    "prop deve ser opcional"
  );
});
