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
const testCaseSectionSource = readFileSync("src/app/components/TestCaseSection.tsx", "utf8");

process.env.NEXT_PUBLIC_USE_MOCK_AI = "true";
const aiClient = loadTsModule("src/lib/ai-assistance/aiAssistanceClient.ts");

// ---- T026/T027 — US1: Estimate-before-generate UX + rascunho/assistido por IA labels ----

test("aiClient — mockEstimateResponse retorna créditos, pricingNote e expiresAt", () => {
  const result = aiClient.mockEstimateResponse("validação de login");
  assert.ok(typeof result.estimatedCredits === "number", "estimatedCredits deve ser número");
  assert.ok(result.estimatedCredits >= 1, "estimatedCredits deve ser >= 1");
  assert.ok(typeof result.pricingNote === "string", "pricingNote deve ser string");
  assert.ok(result.pricingNote.length > 0, "pricingNote não deve ser vazio");
  assert.ok(typeof result.expiresAt === "string", "expiresAt deve ser string ISO");
});

test("aiClient — mockEstimateResponse aumenta com contexto maior", () => {
  const short = aiClient.mockEstimateResponse("curto");
  const long = aiClient.mockEstimateResponse("a".repeat(500));
  assert.ok(long.estimatedCredits >= short.estimatedCredits, "contexto maior deve gerar estimativa maior ou igual");
});

test("T027 — mockGenerateScenariosResponse retorna artifacts com status draft e aiAssisted true", () => {
  const result = aiClient.mockGenerateScenariosResponse("Validação de email obrigatório");
  assert.equal(result.status, "completed");
  assert.ok(result.aiRunId.length > 0, "aiRunId deve ser preenchido");
  assert.ok(Array.isArray(result.artifacts), "artifacts deve ser array");
  assert.ok(result.artifacts.length > 0, "deve gerar ao menos um artefato");
  assert.equal(result.outputArtifactType, "test_scenario");
  result.artifacts.forEach((a) => {
    assert.equal(a.status, "draft", "cada artefato deve ter status draft");
    assert.equal(a.aiAssisted, true, "cada artefato deve ter aiAssisted true");
    assert.ok(a.title.length > 0, "cada artefato deve ter título");
  });
});

// ---- T043/T044 — US2: Test-case estimate and generation UX ----

test("T043/T044 — mockGenerateTestCasesResponse retorna artifacts com status draft e aiAssisted true", () => {
  const result = aiClient.mockGenerateTestCasesResponse("Email inválido deve ser rejeitado");
  assert.equal(result.status, "completed");
  assert.ok(Array.isArray(result.artifacts), "artifacts deve ser array");
  assert.ok(result.artifacts.length > 0, "deve gerar ao menos um caso de teste");
  assert.equal(result.outputArtifactType, "test_case");
  result.artifacts.forEach((a) => {
    assert.equal(a.status, "draft", "cada caso de teste deve ter status draft");
    assert.equal(a.aiAssisted, true, "cada caso de teste deve ter aiAssisted true");
  });
  assert.ok(result.consumedCredits >= 1, "consumedCredits deve ser positivo");
});

// ---- T061 — US3: Failure message and non-consumed credit note ----

test("T061 — AiGenerationModal mostra nota sobre créditos não consumidos em falha", () => {
  // The text is split across lines in JSX: "os créditos estimados não\n  foram consumidos"
  assert.ok(
    aiModalSource.includes("créditos estimados") && aiModalSource.includes("foram consumidos"),
    "deve informar que créditos não foram consumidos em caso de falha do serviço"
  );
});

test("T061 — AiGenerationModal tem estado de error com mensagem em pt-BR", () => {
  assert.match(aiModalSource, /Tentar novamente/, "deve ter botão de retry em pt-BR");
  assert.match(aiModalSource, /Fechar/, "deve ter botão fechar em pt-BR");
});

// ---- Component structure checks ----

test("AiGenerationModal — componente referencia modo scenarios e test-cases", () => {
  assert.match(aiModalSource, /mode.*scenarios/, "deve ter modo scenarios");
  assert.match(aiModalSource, /mode.*test-cases/, "deve ter modo test-cases");
});

test("AiGenerationModal — exibe aviso de rascunho e validação humana obrigatória", () => {
  assert.match(aiModalSource, /validação humana/, "deve alertar sobre validação humana");
  assert.match(aiModalSource, /rascunho/, "deve mencionar rascunho");
});

test("AiGenerationModal — tem botão aceitar como rascunho", () => {
  assert.match(aiModalSource, /Aceitar como rascunho/, "deve ter botão aceitar");
});

test("AiGenerationModal — tem botão descartar", () => {
  assert.match(aiModalSource, /Descartar/, "deve ter botão descartar");
});

test("T026 — AiGenerationModal mostra estimativa de créditos antes de confirmar geração", () => {
  assert.match(aiModalSource, /estimatedCredits/, "deve mostrar créditos estimados");
  assert.match(aiModalSource, /Ver estimativa de créditos/, "deve ter botão de estimativa antes de gerar");
  assert.match(aiModalSource, /Confirmar e gerar/, "deve ter botão de confirmação de geração");
});

test("AiGenerationModal — artefatos exibem label rascunho e assistido por IA", () => {
  assert.match(aiModalSource, /rascunho/, "deve mostrar label rascunho");
  assert.match(aiModalSource, /assistido por IA/, "deve mostrar label assistido por IA");
  assert.match(aiModalSource, /ai-draft-label/, "deve ter testid para label rascunho");
  assert.match(aiModalSource, /ai-assisted-label/, "deve ter testid para label assistido por IA");
});

test("TestScenarioSection — botão gerar cenários com IA presente", () => {
  assert.match(testScenarioSectionSource, /Gerar cenários com IA/, "deve ter botão de geração IA");
});

test("TestScenarioSection — importa AiGenerationModal", () => {
  assert.match(testScenarioSectionSource, /AiGenerationModal/, "deve importar modal de IA");
});

test("T027 — TestScenarioSection — cenário aceito por IA é marcado como aiGenerated e status draft", () => {
  assert.match(testScenarioSectionSource, /aiGenerated: true/, "deve marcar output de IA como aiGenerated");
  assert.match(testScenarioSectionSource, /status: "draft"/, "cenário de IA deve ser salvo como rascunho");
});

test("T027 — TestScenarioSection — exibe label rascunho e assistido por IA nos cards", () => {
  assert.match(testScenarioSectionSource, /label="rascunho"/, "deve ter badge rascunho");
  assert.match(testScenarioSectionSource, /label="assistido por IA"/, "deve ter badge assistido por IA");
});

test("T044 — TestCaseSection — importa AiGenerationModal e integra geração de casos", () => {
  assert.match(testCaseSectionSource, /AiGenerationModal/, "deve importar modal de IA");
  assert.match(testCaseSectionSource, /Gerar casos com IA/, "deve ter botão de geração");
  assert.match(testCaseSectionSource, /aiGenerated: true/, "deve marcar output de IA como aiGenerated");
});

test("T044 — TestCaseSection — exibe label rascunho e assistido por IA nos cards de caso de teste", () => {
  assert.match(testCaseSectionSource, /label="rascunho"/, "deve ter badge rascunho");
  assert.match(testCaseSectionSource, /label="assistido por IA"/, "deve ter badge assistido por IA");
});

test("aiClient — módulo exporta funções esperadas pelo contrato", () => {
  assert.ok(typeof aiClient.estimateTestDesign === "function", "deve exportar estimateTestDesign");
  assert.ok(typeof aiClient.generateScenarios === "function", "deve exportar generateScenarios");
  assert.ok(typeof aiClient.generateTestCases === "function", "deve exportar generateTestCases");
  assert.ok(typeof aiClient.getAiRunStatus === "function", "deve exportar getAiRunStatus");
  assert.ok(typeof aiClient.mockEstimateResponse === "function", "deve exportar mockEstimateResponse");
  assert.ok(typeof aiClient.mockGenerateScenariosResponse === "function", "deve exportar mockGenerateScenariosResponse");
  assert.ok(typeof aiClient.mockGenerateTestCasesResponse === "function", "deve exportar mockGenerateTestCasesResponse");
});

test("aiClient — nenhuma variável NEXT_PUBLIC expõe chave de provedor de IA", () => {
  const clientSource = readFileSync("src/lib/ai-assistance/aiAssistanceClient.ts", "utf8");
  assert.doesNotMatch(clientSource, /NEXT_PUBLIC.*ANTHROPIC|ANTHROPIC.*NEXT_PUBLIC/i,
    "chave Anthropic não deve aparecer em variável NEXT_PUBLIC");
  assert.doesNotMatch(clientSource, /NEXT_PUBLIC.*API_KEY|API_KEY.*NEXT_PUBLIC/i,
    "API key não deve aparecer em variável NEXT_PUBLIC");
});
