import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

// ── T026: US4 — link "Revisão de Artefatos" na navegação do Workspace ─────────

const dashboardSrc = readFileSync(
  "src/app/components/WorkspaceDashboard.tsx",
  "utf8"
);

test("WorkspaceDashboard — contém link 'Revisão de Artefatos'", () => {
  assert.ok(
    dashboardSrc.includes("Revisão de Artefatos"),
    "sidebar deve conter o link 'Revisão de Artefatos'"
  );
});

test("WorkspaceDashboard — link 'Revisão de Artefatos' aponta para /workspace/artifacts", () => {
  assert.ok(
    dashboardSrc.includes('href="/workspace/artifacts"'),
    "link deve apontar para /workspace/artifacts"
  );
});

test("WorkspaceDashboard — link usa next/link, não <a> com hash", () => {
  assert.ok(
    dashboardSrc.includes("next/link"),
    "deve importar e usar next/link para o link de Revisão de Artefatos"
  );
});
