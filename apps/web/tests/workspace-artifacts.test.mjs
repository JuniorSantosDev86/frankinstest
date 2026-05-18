import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const moduleCache = new Map();

function loadTsModule(relativePath) {
  const normalizedPath = relativePath.endsWith(".ts") ? relativePath : `${relativePath}.ts`;
  if (moduleCache.has(normalizedPath)) {
    return moduleCache.get(normalizedPath).exports;
  }
  const source = readFileSync(normalizedPath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const compiledModule = { exports: {} };
  moduleCache.set(normalizedPath, compiledModule);
  const localRequire = (specifier) => {
    if (specifier.startsWith("@/")) {
      return loadTsModule(path.join("src", specifier.slice(2)));
    }
    if (specifier.startsWith(".")) {
      return loadTsModule(path.join(path.dirname(normalizedPath), specifier));
    }
    return require(specifier);
  };
  const execute = new Function("exports", "require", "module", output);
  execute(compiledModule.exports, localRequire, compiledModule);
  return compiledModule.exports;
}

const types = loadTsModule("src/lib/artifacts/artifactTypes.ts");

// ── ArtifactStatus labels ──────────────────────────────────────────────────

test("ARTIFACT_STATUS_LABELS — todos os 4 status têm labels em pt-BR", () => {
  const labels = types.ARTIFACT_STATUS_LABELS;
  assert.equal(labels["DRAFT"], "Rascunho");
  assert.equal(labels["REVIEWED"], "Revisado");
  assert.equal(labels["ACCEPTED"], "Aceito");
  assert.equal(labels["ARCHIVED"], "Arquivado");
});

test("ARTIFACT_TYPE_LABELS — todos os 3 tipos têm labels em pt-BR", () => {
  const labels = types.ARTIFACT_TYPE_LABELS;
  assert.equal(labels["REQUIREMENT"], "Requisito");
  assert.equal(labels["RISK_ITEM"], "Item de Risco");
  assert.equal(labels["QA_ACTION"], "Ação de QA");
});

// ── artifactsApi — updateArtifact strips immutable fields ─────────────────

test("updateArtifact — payload enviado nunca inclui campos imutáveis", async () => {
  // Mock global fetch to capture payload
  let capturedBody = null;
  global.fetch = async (_url, opts) => {
    capturedBody = JSON.parse(opts.body);
    return {
      ok: true,
      json: async () => ({
        id: "wa_001", organizationId: "org_x", projectId: null,
        artifactType: "REQUIREMENT", title: "Novo título", description: null,
        status: "REVIEWED", aiAssisted: true,
        sourceCheckupReportId: "rpt_001", sourceSection: "sec", sourceItemIndex: 0,
        details: null, createdBy: "user_01",
        createdAt: "2026-05-18T10:00:00Z", updatedAt: "2026-05-18T11:00:00Z",
      }),
    };
  };

  const api = loadTsModule("src/lib/artifacts/artifactsApi.ts");

  await api.updateArtifact("wa_001", "org_x", "token_abc", {
    title: "Novo título",
    status: "REVIEWED",
    // These should NEVER appear in the HTTP body:
    // sourceCheckupReportId, aiAssisted, createdBy, organizationId, etc.
  });

  assert.ok(capturedBody !== null, "fetch deve ter sido chamado");
  assert.ok(!("sourceCheckupReportId" in capturedBody), "sourceCheckupReportId não deve ser enviado");
  assert.ok(!("aiAssisted" in capturedBody), "aiAssisted não deve ser enviado");
  assert.ok(!("createdBy" in capturedBody), "createdBy não deve ser enviado");
  assert.ok(!("organizationId" in capturedBody), "organizationId não deve ser enviado");
  assert.ok(!("projectId" in capturedBody), "projectId não deve ser enviado");
  assert.ok(!("id" in capturedBody), "id não deve ser enviado");
  assert.ok(!("artifactType" in capturedBody), "artifactType não deve ser enviado");
  assert.equal(capturedBody.title, "Novo título", "title deve ser enviado corretamente");
  assert.equal(capturedBody.status, "REVIEWED", "status deve ser enviado corretamente");
});

// ── listArtifacts — limitReached field is present ────────────────────────

test("listArtifacts — resposta com limitReached=true é reconhecida", async () => {
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      artifacts: Array.from({ length: 200 }, (_, i) => ({
        id: `wa_${i}`, organizationId: "org_x", projectId: null,
        artifactType: "REQUIREMENT", title: `Artefato ${i}`, description: null,
        status: "DRAFT", aiAssisted: true,
        sourceCheckupReportId: "rpt_001", sourceSection: "sec", sourceItemIndex: i,
        details: null, createdBy: "user_01",
        createdAt: "2026-05-18T10:00:00Z", updatedAt: "2026-05-18T10:00:00Z",
      })),
      limitReached: true,
    }),
  });

  const api = loadTsModule("src/lib/artifacts/artifactsApi.ts");
  const result = await api.listArtifacts("org_x", "token_abc", {});
  assert.equal(result.limitReached, true, "limitReached deve ser true quando > 200 artefatos");
  assert.equal(result.artifacts.length, 200, "deve retornar 200 artefatos");
});

test("listArtifacts — resposta com limitReached=false para listas pequenas", async () => {
  global.fetch = async () => ({
    ok: true,
    json: async () => ({ artifacts: [], limitReached: false }),
  });

  const api = loadTsModule("src/lib/artifacts/artifactsApi.ts");
  const result = await api.listArtifacts("org_x", "token_abc", {});
  assert.equal(result.limitReached, false);
  assert.equal(result.artifacts.length, 0);
});

// ── pt-BR: page source contains no English UI strings ─────────────────────

test("page.tsx — não contém strings de UI em inglês", () => {
  const src = readFileSync("src/app/workspace/artifacts/page.tsx", "utf8");
  // Check pt-BR labels are present
  assert.ok(src.includes("Revisão de Artefatos"), "deve conter 'Revisão de Artefatos'");
  assert.ok(src.includes("Carregando artefatos"), "deve conter texto de carregamento em pt-BR");
  // Ensure common English UI words are not used as visible labels
  assert.ok(!src.includes('"Loading"'), "não deve conter 'Loading' como label");
  assert.ok(!src.includes('"Error"'), "não deve conter 'Error' como label");
});

test("WorkspaceArtifactDetailPanel.tsx — botões e labels em pt-BR", () => {
  const src = readFileSync("src/components/workspace/WorkspaceArtifactDetailPanel.tsx", "utf8");
  assert.ok(src.includes("Salvar"), "deve conter botão 'Salvar'");
  assert.ok(src.includes("Cancelar"), "deve conter botão 'Cancelar'");
  assert.ok(src.includes("Editar"), "deve conter botão 'Editar'");
  assert.ok(src.includes("Rastreabilidade"), "deve conter label de rastreabilidade em pt-BR");
  assert.ok(src.includes("somente leitura"), "deve indicar campos somente leitura");
});

// ── SC-009: status change requires ≤ 3 interactions ──────────────────────

test("WorkspaceArtifactDetailPanel.tsx — mudança de status disponível em no máximo 3 passos de UI", () => {
  const src = readFileSync("src/components/workspace/WorkspaceArtifactDetailPanel.tsx", "utf8");
  // The status <select> and Save button must both be present in editing mode
  // without requiring extra navigation (no modal, no page reload)
  assert.ok(src.includes("<select"), "deve ter um elemento <select> para status");
  assert.ok(src.includes("Salvar"), "deve ter botão Salvar no mesmo painel");
  // Confirm no navigation away (no router.push, no Link to another page)
  assert.ok(!src.includes("router.push"), "não deve navegar para outra página ao salvar");
});
