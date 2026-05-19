import { test } from "node:test";
import assert from "node:assert/strict";

// ── T014: Tests for CheckupArtifactsSection ───────────────────────────────────
//
// These tests verify the logic of CheckupArtifactsSection via the artifact
// types and API module (no DOM rendering needed for pure-logic assertions).
// Navigation link construction and copy text are asserted via source inspection.

import { readFileSync } from "node:fs";

const src = readFileSync(
  "src/app/checkup/[runId]/CheckupArtifactsSection.tsx",
  "utf8"
);

test("CheckupArtifactsSection — título da seção em pt-BR", () => {
  assert.ok(
    src.includes("Artefatos criados a partir deste relatório"),
    "deve conter o título da seção em pt-BR"
  );
});

test("CheckupArtifactsSection — estado vazio em pt-BR", () => {
  assert.ok(
    src.includes("Nenhum artefato criado a partir deste relatório"),
    "deve conter mensagem de estado vazio em pt-BR"
  );
});

test("CheckupArtifactsSection — link para /workspace/artifacts com sourceCheckupReportId", () => {
  assert.ok(
    src.includes("/workspace/artifacts?sourceCheckupReportId="),
    "deve construir link para /workspace/artifacts?sourceCheckupReportId=..."
  );
});

test("CheckupArtifactsSection — chama listArtifacts com sourceCheckupReportId", () => {
  assert.ok(
    src.includes("listArtifacts"),
    "deve chamar listArtifacts"
  );
  assert.ok(
    src.includes("sourceCheckupReportId"),
    "deve passar sourceCheckupReportId como filtro"
  );
});

test("CheckupArtifactsSection — usa ARTIFACT_TYPE_LABELS e ARTIFACT_STATUS_LABELS", () => {
  assert.ok(
    src.includes("ARTIFACT_TYPE_LABELS"),
    "deve usar ARTIFACT_TYPE_LABELS para exibir tipo"
  );
  assert.ok(
    src.includes("ARTIFACT_STATUS_LABELS"),
    "deve usar ARTIFACT_STATUS_LABELS para exibir status"
  );
});

test("CheckupArtifactsSection — não contém chamada direta ao provedor de IA", () => {
  assert.ok(!src.includes("anthropic"), "não deve chamar Anthropic diretamente");
  assert.ok(!src.includes("openai"), "não deve chamar OpenAI diretamente");
});

// ── page.tsx integration ──────────────────────────────────────────────────────

const pageSrc = readFileSync("src/app/checkup/[runId]/page.tsx", "utf8");

test("checkup/[runId]/page.tsx — importa CheckupArtifactsSection", () => {
  assert.ok(
    pageSrc.includes("CheckupArtifactsSection"),
    "page.tsx deve importar CheckupArtifactsSection"
  );
});

test("checkup/[runId]/page.tsx — usa DEFAULT_ORG e getDevToken", () => {
  assert.ok(
    pageSrc.includes("DEFAULT_ORG"),
    "page.tsx deve definir DEFAULT_ORG"
  );
  assert.ok(
    pageSrc.includes("getDevToken"),
    "page.tsx deve usar getDevToken"
  );
});

test("checkup/[runId]/page.tsx — passa reportId para CheckupArtifactsSection", () => {
  assert.ok(
    pageSrc.includes("reportId={report.id}"),
    "page.tsx deve passar reportId={report.id} para CheckupArtifactsSection"
  );
});
