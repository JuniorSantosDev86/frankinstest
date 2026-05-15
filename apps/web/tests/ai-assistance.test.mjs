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

const aiModalSource = readFileSync("src/app/components/AiGenerationModal.tsx", "utf8");
const testScenarioSectionSource = readFileSync("src/app/components/TestScenarioSection.tsx", "utf8");

// Carrega módulo com mock ativado para evitar chamadas HTTP reais
process.env.NEXT_PUBLIC_USE_MOCK_AI = "true";
const aiClient = loadTsModule("src/lib/ai-assistance/aiAssistanceClient.ts");

test("aiAssistanceClient — estimateGeneration mock retorna créditos e pricingNote", async () => {
  const result = await aiClient.estimateGeneration({ feature: "generate_scenarios", context: "validação de login" });
  assert.ok(typeof result.estimatedCredits === "number", "estimatedCredits deve ser número");
  assert.ok(result.estimatedCredits >= 1, "estimatedCredits deve ser >= 1");
  assert.ok(typeof result.pricingNote === "string", "pricingNote deve ser string");
  assert.ok(result.pricingNote.length > 0, "pricingNote não deve ser vazio");
});

test("aiAssistanceClient — estimateGeneration mock aumenta com contexto maior", async () => {
  const short = await aiClient.estimateGeneration({ feature: "generate_scenarios", context: "curto" });
  const long = await aiClient.estimateGeneration({ feature: "generate_scenarios", context: "a".repeat(500) });
  assert.ok(long.estimatedCredits >= short.estimatedCredits, "contexto maior deve gerar estimativa maior ou igual");
});

test("aiAssistanceClient — generateScenarios mock retorna status completed", async () => {
  const result = await aiClient.generateScenarios({
    projectId: "proj_001",
    businessRuleId: "rule_001",
    businessRuleTitle: "Validação de email obrigatório",
    context: "email deve ter formato válido",
  });
  assert.equal(result.status, "completed");
  assert.ok(result.aiRunId.length > 0, "aiRunId deve ser preenchido");
  assert.ok(result.output !== null, "output não deve ser nulo");
  assert.ok(result.output.includes("SUGESTÃO IA"), "output deve conter aviso de IA");
  assert.equal(result.outputArtifactType, "test_scenario");
});

test("aiAssistanceClient — generateTestCases mock retorna status completed", async () => {
  const result = await aiClient.generateTestCases({
    projectId: "proj_001",
    scenarioId: "scenario_001",
    scenarioTitle: "Email inválido deve ser rejeitado",
    context: "sistema valida formato",
  });
  assert.equal(result.status, "completed");
  assert.ok(result.output !== null, "output não deve ser nulo");
  assert.ok(result.output.includes("SUGESTÃO IA"), "output deve conter aviso de IA");
  assert.equal(result.outputArtifactType, "test_case");
  assert.ok(result.consumedCredits >= 1, "consumedCredits deve ser positivo");
});

test("AiGenerationModal — componente referencia modo scenarios e test-cases", () => {
  assert.match(aiModalSource, /mode.*scenarios/, "deve ter modo scenarios");
  assert.match(aiModalSource, /mode.*test-cases/, "deve ter modo test-cases");
});

test("AiGenerationModal — exibe aviso de validação humana obrigatória", () => {
  assert.match(aiModalSource, /validação humana/, "deve alertar sobre validação humana");
});

test("AiGenerationModal — tem botão aceitar como rascunho", () => {
  assert.match(aiModalSource, /Aceitar como rascunho/, "deve ter botão aceitar");
});

test("AiGenerationModal — tem botão descartar", () => {
  assert.match(aiModalSource, /Descartar/, "deve ter botão descartar");
});

test("AiGenerationModal — mostra estimativa de créditos antes de gerar", () => {
  assert.match(aiModalSource, /estimatedCredits/, "deve mostrar créditos estimados");
  assert.match(aiModalSource, /Ver estimativa de créditos/, "deve ter botão de estimativa");
});

test("TestScenarioSection — botão gerar cenários com IA presente", () => {
  assert.match(testScenarioSectionSource, /Gerar cenários com IA/, "deve ter botão de geração IA");
});

test("TestScenarioSection — importa AiGenerationModal", () => {
  assert.match(testScenarioSectionSource, /AiGenerationModal/, "deve importar modal de IA");
});

test("TestScenarioSection — cenário aceito por IA é marcado como aiGenerated", () => {
  assert.match(testScenarioSectionSource, /aiGenerated: true/, "deve marcar output de IA como aiGenerated");
});

test("TestScenarioSection — cenário aceito por IA tem status draft", () => {
  assert.match(testScenarioSectionSource, /status: "draft"/, "cenário de IA deve ser salvo como rascunho");
});

test("aiClient — módulo exporta as três funções esperadas", () => {
  assert.ok(typeof aiClient.estimateGeneration === "function", "deve exportar estimateGeneration");
  assert.ok(typeof aiClient.generateScenarios === "function", "deve exportar generateScenarios");
  assert.ok(typeof aiClient.generateTestCases === "function", "deve exportar generateTestCases");
});
