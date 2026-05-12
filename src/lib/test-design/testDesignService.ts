import {
  demoBusinessRules,
  demoProductModules,
  demoRequirements,
} from "@/lib/business-understanding/businessUnderstandingService";
import type { BusinessRule, ProductModule, Requirement } from "@/lib/business-understanding/types";
import { demoProjects } from "@/lib/projects/projectService";
import type { Project } from "@/lib/projects/types";
import {
  scenarioPriorities,
  scenarioStatuses,
  scenarioTypes,
  testCaseAutomationStatuses,
  testCasePriorities,
  testCaseStatuses,
  testLevels,
  type BusinessRuleScenarioTraceability,
  type ScenarioDesignSummary,
  type ScenarioTestCaseTraceability,
  type ScenarioPriority,
  type ScenarioStatus,
  type ScenarioTraceability,
  type ScenarioType,
  type TestCase,
  type TestCaseAutomationStatus,
  type TestCaseDesignSummary,
  type TestCaseInput,
  type TestCasePriority,
  type TestCaseStatus,
  type TestCaseTraceability,
  type TestLevel,
  type TestScenario,
  type TestScenarioInput,
} from "./types";

const demoTimestamp = "2026-05-12T11:00:00.000Z";

export const demoTestScenarios: TestScenario[] = [
  {
    id: "scenario_demo_landing_valid_email",
    projectId: "project_demo_landing",
    moduleId: "module_demo_landing_conversion",
    requirementId: "requirement_demo_landing_form",
    businessRuleId: "rule_demo_landing_email",
    title: "Envio de lead com email valido",
    description: "Validar que um visitante consegue enviar o formulario quando informa email valido.",
    scenarioType: "positive",
    priority: "high",
    status: "ready",
    testLevel: "acceptance",
    aiGenerated: false,
    reviewedBy: "user_demo_qa_lead",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
  {
    id: "scenario_demo_landing_invalid_email",
    projectId: "project_demo_landing",
    moduleId: "module_demo_landing_conversion",
    requirementId: "requirement_demo_landing_form",
    businessRuleId: "rule_demo_landing_email",
    title: "Bloqueio de lead sem email valido",
    description: "Validar que o formulario rejeita envio sem email ou com formato invalido.",
    scenarioType: "negative",
    priority: "high",
    status: "ready",
    testLevel: "acceptance",
    aiGenerated: false,
    reviewedBy: "user_demo_qa_lead",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
  {
    id: "scenario_demo_landing_mobile_cta_small_screen",
    projectId: "project_demo_landing",
    moduleId: "module_demo_landing_responsive",
    requirementId: "requirement_demo_landing_mobile",
    businessRuleId: "rule_demo_landing_mobile_cta",
    title: "CTA em tela mobile muito estreita",
    description: "Verificar se o CTA continua visivel e acionavel sem cobrir conteudo essencial.",
    scenarioType: "edge_case",
    priority: "medium",
    status: "needs_review",
    testLevel: "exploratory",
    aiGenerated: true,
    reviewedBy: "",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
  {
    id: "scenario_demo_saas_workspace_boundary_regression",
    projectId: "project_demo_saas",
    moduleId: "module_demo_saas_auth",
    requirementId: "requirement_demo_saas_session",
    businessRuleId: "rule_demo_saas_workspace_boundary",
    title: "Regressao da fronteira de workspace",
    description: "Confirmar que um usuario nao visualiza projetos de outra organizacao apos mudancas de acesso.",
    scenarioType: "regression",
    priority: "critical",
    status: "ready",
    testLevel: "integration",
    aiGenerated: false,
    reviewedBy: "user_demo_qa_lead",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
];

export const demoTestCases: TestCase[] = [
  {
    id: "test_case_demo_landing_valid_email_submission",
    projectId: "project_demo_landing",
    moduleId: "module_demo_landing_conversion",
    requirementId: "requirement_demo_landing_form",
    businessRuleId: "rule_demo_landing_email",
    scenarioId: "scenario_demo_landing_valid_email",
    title: "Enviar lead com email valido",
    objective: "Confirmar que o formulario aceita um lead com email em formato valido.",
    precondition: "Landing page disponivel e formulario de lead visivel.",
    steps: [
      "Acessar a landing page",
      "Preencher o campo de email com um valor valido",
      "Enviar o formulario",
    ],
    expectedResult: "O lead deve ser registrado e a mensagem de sucesso deve ser exibida.",
    priority: "high",
    status: "ready",
    testLevel: "acceptance",
    automationStatus: "automation_candidate",
    aiGenerated: false,
    reviewedBy: "user_demo_qa_lead",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
  {
    id: "test_case_demo_landing_invalid_email_rejected",
    projectId: "project_demo_landing",
    moduleId: "module_demo_landing_conversion",
    requirementId: "requirement_demo_landing_form",
    businessRuleId: "rule_demo_landing_email",
    scenarioId: "scenario_demo_landing_invalid_email",
    title: "Bloquear envio com email invalido",
    objective: "Validar que o formulario nao aceita lead sem email valido.",
    precondition: "Landing page disponivel e formulario de lead visivel.",
    steps: [
      "Acessar a landing page",
      "Preencher o campo de email com formato invalido",
      "Enviar o formulario",
    ],
    expectedResult: "O envio deve ser bloqueado e uma orientacao de email valido deve aparecer.",
    priority: "high",
    status: "ready",
    testLevel: "acceptance",
    automationStatus: "not_automated",
    aiGenerated: false,
    reviewedBy: "user_demo_qa_lead",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
  {
    id: "test_case_demo_landing_mobile_cta_narrow_screen",
    projectId: "project_demo_landing",
    moduleId: "module_demo_landing_responsive",
    requirementId: "requirement_demo_landing_mobile",
    businessRuleId: "rule_demo_landing_mobile_cta",
    scenarioId: "scenario_demo_landing_mobile_cta_small_screen",
    title: "Revisar CTA em tela mobile estreita",
    objective: "Verificar se o CTA permanece visivel e acionavel em largura mobile reduzida.",
    precondition: "Landing page aberta em viewport mobile estreito.",
    steps: [
      "Acessar a landing page em viewport mobile",
      "Rolar ate a area principal de conversao",
      "Verificar visibilidade e acionamento do CTA",
    ],
    expectedResult: "O CTA deve continuar visivel, acionavel e sem cobrir conteudo essencial.",
    priority: "medium",
    status: "needs_review",
    testLevel: "exploratory",
    automationStatus: "not_applicable",
    aiGenerated: true,
    reviewedBy: "",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
  {
    id: "test_case_demo_saas_workspace_boundary_regression",
    projectId: "project_demo_saas",
    moduleId: "module_demo_saas_auth",
    requirementId: "requirement_demo_saas_session",
    businessRuleId: "rule_demo_saas_workspace_boundary",
    scenarioId: "scenario_demo_saas_workspace_boundary_regression",
    title: "Regredir acesso entre workspaces",
    objective: "Confirmar que um usuario nao acessa projetos de outra organizacao.",
    precondition: "Usuario demo autenticado e projeto externo simulado indisponivel ao workspace.",
    steps: [
      "Carregar a sessao do usuario demo",
      "Tentar consultar projeto de outra organizacao",
      "Validar o resultado da checagem de acesso",
    ],
    expectedResult: "O acesso deve ser negado e nenhum dado de outro workspace deve ser retornado.",
    priority: "critical",
    status: "ready",
    testLevel: "integration",
    automationStatus: "automated",
    aiGenerated: false,
    reviewedBy: "user_demo_qa_lead",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
];

export function isScenarioType(value: string): value is ScenarioType {
  return scenarioTypes.includes(value as ScenarioType);
}

export function isScenarioPriority(value: string): value is ScenarioPriority {
  return scenarioPriorities.includes(value as ScenarioPriority);
}

export function isScenarioStatus(value: string): value is ScenarioStatus {
  return scenarioStatuses.includes(value as ScenarioStatus);
}

export function isTestLevel(value: string): value is TestLevel {
  return testLevels.includes(value as TestLevel);
}

export function isTestCasePriority(value: string): value is TestCasePriority {
  return testCasePriorities.includes(value as TestCasePriority);
}

export function isTestCaseStatus(value: string): value is TestCaseStatus {
  return testCaseStatuses.includes(value as TestCaseStatus);
}

export function isTestCaseAutomationStatus(value: string): value is TestCaseAutomationStatus {
  return testCaseAutomationStatuses.includes(value as TestCaseAutomationStatus);
}

export function validateTestScenarioInput(input: TestScenarioInput): string[] {
  const errors: string[] = [];

  if (input.projectId.trim().length === 0) {
    errors.push("scenario_project_required");
  }

  if (input.moduleId.trim().length === 0) {
    errors.push("scenario_module_required");
  }

  if (input.requirementId.trim().length === 0) {
    errors.push("scenario_requirement_required");
  }

  if (input.businessRuleId.trim().length === 0) {
    errors.push("scenario_business_rule_required");
  }

  if (input.title.trim().length < 2) {
    errors.push("scenario_title_required");
  }

  if (input.scenarioType !== undefined && !isScenarioType(input.scenarioType)) {
    errors.push("invalid_scenario_type");
  }

  if (input.priority !== undefined && !isScenarioPriority(input.priority)) {
    errors.push("invalid_scenario_priority");
  }

  if (input.status !== undefined && !isScenarioStatus(input.status)) {
    errors.push("invalid_scenario_status");
  }

  if (input.testLevel !== undefined && !isTestLevel(input.testLevel)) {
    errors.push("invalid_test_level");
  }

  return errors;
}

export function validateTestCaseInput(input: TestCaseInput): string[] {
  const errors: string[] = [];

  if (input.projectId.trim().length === 0) {
    errors.push("test_case_project_required");
  }

  if (input.moduleId.trim().length === 0) {
    errors.push("test_case_module_required");
  }

  if (input.requirementId.trim().length === 0) {
    errors.push("test_case_requirement_required");
  }

  if (input.businessRuleId.trim().length === 0) {
    errors.push("test_case_business_rule_required");
  }

  if (input.scenarioId.trim().length === 0) {
    errors.push("test_case_scenario_required");
  }

  if (input.title.trim().length < 2) {
    errors.push("test_case_title_required");
  }

  if (input.objective.trim().length < 2) {
    errors.push("test_case_objective_required");
  }

  if (input.steps.length === 0) {
    errors.push("test_case_steps_required");
  }

  if (input.steps.some((step) => step.trim().length < 2)) {
    errors.push("test_case_step_required");
  }

  if (input.expectedResult.trim().length < 2) {
    errors.push("test_case_expected_result_required");
  }

  if (input.priority !== undefined && !isTestCasePriority(input.priority)) {
    errors.push("invalid_test_case_priority");
  }

  if (input.status !== undefined && !isTestCaseStatus(input.status)) {
    errors.push("invalid_test_case_status");
  }

  if (input.testLevel !== undefined && !isTestLevel(input.testLevel)) {
    errors.push("invalid_test_level");
  }

  if (
    input.automationStatus !== undefined &&
    !isTestCaseAutomationStatus(input.automationStatus)
  ) {
    errors.push("invalid_test_case_automation_status");
  }

  return errors;
}

export function listScenariosByProject(
  projectId: string,
  scenarios: TestScenario[] = demoTestScenarios,
): TestScenario[] {
  return scenarios.filter((scenario) => scenario.projectId === projectId);
}

export function listScenariosByModule(
  moduleId: string,
  scenarios: TestScenario[] = demoTestScenarios,
): TestScenario[] {
  return scenarios.filter((scenario) => scenario.moduleId === moduleId);
}

export function listScenariosByRequirement(
  requirementId: string,
  scenarios: TestScenario[] = demoTestScenarios,
): TestScenario[] {
  return scenarios.filter((scenario) => scenario.requirementId === requirementId);
}

export function listScenariosByBusinessRule(
  businessRuleId: string,
  scenarios: TestScenario[] = demoTestScenarios,
): TestScenario[] {
  return scenarios.filter((scenario) => scenario.businessRuleId === businessRuleId);
}

export function listTestCasesByProject(
  projectId: string,
  testCases: TestCase[] = demoTestCases,
): TestCase[] {
  return testCases.filter((testCase) => testCase.projectId === projectId);
}

export function listTestCasesByModule(
  moduleId: string,
  testCases: TestCase[] = demoTestCases,
): TestCase[] {
  return testCases.filter((testCase) => testCase.moduleId === moduleId);
}

export function listTestCasesByRequirement(
  requirementId: string,
  testCases: TestCase[] = demoTestCases,
): TestCase[] {
  return testCases.filter((testCase) => testCase.requirementId === requirementId);
}

export function listTestCasesByBusinessRule(
  businessRuleId: string,
  testCases: TestCase[] = demoTestCases,
): TestCase[] {
  return testCases.filter((testCase) => testCase.businessRuleId === businessRuleId);
}

export function listTestCasesByScenario(
  scenarioId: string,
  testCases: TestCase[] = demoTestCases,
): TestCase[] {
  return testCases.filter((testCase) => testCase.scenarioId === scenarioId);
}

export function createTestScenario(input: TestScenarioInput, now = new Date()): TestScenario {
  const errors = validateTestScenarioInput(input);

  if (errors.length > 0) {
    throw new Error(errors.join(","));
  }

  const timestamp = now.toISOString();

  return {
    id: `scenario_${now.getTime()}`,
    projectId: input.projectId,
    moduleId: input.moduleId,
    requirementId: input.requirementId,
    businessRuleId: input.businessRuleId,
    title: input.title.trim(),
    description: input.description?.trim() ?? "",
    scenarioType: input.scenarioType ?? "positive",
    priority: input.priority ?? "medium",
    status: input.status ?? "draft",
    testLevel: input.testLevel ?? "acceptance",
    aiGenerated: input.aiGenerated ?? false,
    reviewedBy: input.reviewedBy?.trim() ?? "",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createTestCase(input: TestCaseInput, now = new Date()): TestCase {
  const errors = validateTestCaseInput(input);

  if (errors.length > 0) {
    throw new Error(errors.join(","));
  }

  const timestamp = now.toISOString();

  return {
    id: `test_case_${now.getTime()}`,
    projectId: input.projectId,
    moduleId: input.moduleId,
    requirementId: input.requirementId,
    businessRuleId: input.businessRuleId,
    scenarioId: input.scenarioId,
    title: input.title.trim(),
    objective: input.objective.trim(),
    precondition: input.precondition?.trim() ?? "",
    steps: input.steps.map((step) => step.trim()),
    expectedResult: input.expectedResult.trim(),
    priority: input.priority ?? "medium",
    status: input.status ?? "draft",
    testLevel: input.testLevel ?? "acceptance",
    automationStatus: input.automationStatus ?? "not_automated",
    aiGenerated: input.aiGenerated ?? false,
    reviewedBy: input.reviewedBy?.trim() ?? "",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateTestScenario(
  scenario: TestScenario,
  updates: Partial<TestScenarioInput>,
  now = new Date(),
): TestScenario {
  const nextScenario: TestScenario = {
    ...scenario,
    projectId: updates.projectId ?? scenario.projectId,
    moduleId: updates.moduleId ?? scenario.moduleId,
    requirementId: updates.requirementId ?? scenario.requirementId,
    businessRuleId: updates.businessRuleId ?? scenario.businessRuleId,
    title: updates.title?.trim() ?? scenario.title,
    description: updates.description?.trim() ?? scenario.description,
    scenarioType: updates.scenarioType ?? scenario.scenarioType,
    priority: updates.priority ?? scenario.priority,
    status: updates.status ?? scenario.status,
    testLevel: updates.testLevel ?? scenario.testLevel,
    aiGenerated: updates.aiGenerated ?? scenario.aiGenerated,
    reviewedBy: updates.reviewedBy?.trim() ?? scenario.reviewedBy,
    updatedAt: now.toISOString(),
  };

  const errors = validateTestScenarioInput(nextScenario);

  if (errors.length > 0) {
    throw new Error(errors.join(","));
  }

  return nextScenario;
}

export function updateTestCase(
  testCase: TestCase,
  updates: Partial<TestCaseInput>,
  now = new Date(),
): TestCase {
  const nextTestCase: TestCase = {
    ...testCase,
    projectId: updates.projectId ?? testCase.projectId,
    moduleId: updates.moduleId ?? testCase.moduleId,
    requirementId: updates.requirementId ?? testCase.requirementId,
    businessRuleId: updates.businessRuleId ?? testCase.businessRuleId,
    scenarioId: updates.scenarioId ?? testCase.scenarioId,
    title: updates.title?.trim() ?? testCase.title,
    objective: updates.objective?.trim() ?? testCase.objective,
    precondition: updates.precondition?.trim() ?? testCase.precondition,
    steps: updates.steps?.map((step) => step.trim()) ?? testCase.steps,
    expectedResult: updates.expectedResult?.trim() ?? testCase.expectedResult,
    priority: updates.priority ?? testCase.priority,
    status: updates.status ?? testCase.status,
    testLevel: updates.testLevel ?? testCase.testLevel,
    automationStatus: updates.automationStatus ?? testCase.automationStatus,
    aiGenerated: updates.aiGenerated ?? testCase.aiGenerated,
    reviewedBy: updates.reviewedBy?.trim() ?? testCase.reviewedBy,
    updatedAt: now.toISOString(),
  };

  const errors = validateTestCaseInput(nextTestCase);

  if (errors.length > 0) {
    throw new Error(errors.join(","));
  }

  return nextTestCase;
}

export function countScenariosByBusinessRule(
  businessRuleId: string,
  scenarios: TestScenario[] = demoTestScenarios,
): number {
  return listScenariosByBusinessRule(businessRuleId, scenarios).length;
}

export function countTestCasesByScenario(
  scenarioId: string,
  testCases: TestCase[] = demoTestCases,
): number {
  return listTestCasesByScenario(scenarioId, testCases).length;
}

function createEmptyScenariosByType(): Record<ScenarioType, number> {
  return scenarioTypes.reduce(
    (totals, scenarioType) => ({
      ...totals,
      [scenarioType]: 0,
    }),
    {} as Record<ScenarioType, number>,
  );
}

function createEmptyTestCasesByAutomationStatus(): Record<TestCaseAutomationStatus, number> {
  return testCaseAutomationStatuses.reduce(
    (totals, automationStatus) => ({
      ...totals,
      [automationStatus]: 0,
    }),
    {} as Record<TestCaseAutomationStatus, number>,
  );
}

export function getScenarioDesignSummary(
  projectId: string,
  scenarios: TestScenario[] = demoTestScenarios,
): ScenarioDesignSummary {
  const projectScenarios = listScenariosByProject(projectId, scenarios);
  const scenariosByType = createEmptyScenariosByType();

  projectScenarios.forEach((scenario) => {
    scenariosByType[scenario.scenarioType] += 1;
  });

  return {
    totalScenarios: projectScenarios.length,
    readyScenarios: projectScenarios.filter((scenario) => scenario.status === "ready").length,
    scenariosNeedingReview: projectScenarios.filter(
      (scenario) => scenario.status === "needs_review",
    ).length,
    criticalScenarios: projectScenarios.filter((scenario) => scenario.priority === "critical")
      .length,
    aiGeneratedScenarios: projectScenarios.filter((scenario) => scenario.aiGenerated).length,
    scenariosByType,
  };
}

export function getTestCaseDesignSummary(
  projectId: string,
  testCases: TestCase[] = demoTestCases,
): TestCaseDesignSummary {
  const projectTestCases = listTestCasesByProject(projectId, testCases);
  const testCasesByAutomationStatus = createEmptyTestCasesByAutomationStatus();

  projectTestCases.forEach((testCase) => {
    testCasesByAutomationStatus[testCase.automationStatus] += 1;
  });

  return {
    totalTestCases: projectTestCases.length,
    readyTestCases: projectTestCases.filter((testCase) => testCase.status === "ready").length,
    testCasesNeedingReview: projectTestCases.filter(
      (testCase) => testCase.status === "needs_review",
    ).length,
    criticalTestCases: projectTestCases.filter((testCase) => testCase.priority === "critical")
      .length,
    automationCandidates: projectTestCases.filter(
      (testCase) => testCase.automationStatus === "automation_candidate",
    ).length,
    automatedTestCases: projectTestCases.filter(
      (testCase) => testCase.automationStatus === "automated",
    ).length,
    aiGeneratedTestCases: projectTestCases.filter((testCase) => testCase.aiGenerated).length,
    testCasesByAutomationStatus,
  };
}

export function getBusinessRuleScenarioTraceability(
  businessRuleId: string,
  businessRules: BusinessRule[] = demoBusinessRules,
  scenarios: TestScenario[] = demoTestScenarios,
): BusinessRuleScenarioTraceability {
  const businessRule = businessRules.find((rule) => rule.id === businessRuleId) ?? null;
  const linkedScenarios = listScenariosByBusinessRule(businessRuleId, scenarios);

  return {
    businessRule,
    scenarios: linkedScenarios,
    scenarioCount: linkedScenarios.length,
  };
}

export function getScenarioTestCaseTraceability(
  scenarioId: string,
  scenarios: TestScenario[] = demoTestScenarios,
  testCases: TestCase[] = demoTestCases,
): ScenarioTestCaseTraceability {
  const scenario = scenarios.find((item) => item.id === scenarioId) ?? null;
  const linkedTestCases = listTestCasesByScenario(scenarioId, testCases);

  return {
    scenario,
    testCases: linkedTestCases,
    testCaseCount: linkedTestCases.length,
  };
}

export function getScenarioTraceability(
  scenarioId: string,
  scenarios: TestScenario[] = demoTestScenarios,
  projects: Project[] = demoProjects,
  modules: ProductModule[] = demoProductModules,
  requirements: Requirement[] = demoRequirements,
  businessRules: BusinessRule[] = demoBusinessRules,
): ScenarioTraceability {
  const scenario = scenarios.find((item) => item.id === scenarioId) ?? null;

  return {
    project: scenario
      ? projects.find((project) => project.id === scenario.projectId) ?? null
      : null,
    module: scenario ? modules.find((module) => module.id === scenario.moduleId) ?? null : null,
    requirement: scenario
      ? requirements.find((requirement) => requirement.id === scenario.requirementId) ?? null
      : null,
    businessRule: scenario
      ? businessRules.find((rule) => rule.id === scenario.businessRuleId) ?? null
      : null,
    scenario,
  };
}

export function getTestCaseTraceability(
  testCaseId: string,
  testCases: TestCase[] = demoTestCases,
  scenarios: TestScenario[] = demoTestScenarios,
  projects: Project[] = demoProjects,
  modules: ProductModule[] = demoProductModules,
  requirements: Requirement[] = demoRequirements,
  businessRules: BusinessRule[] = demoBusinessRules,
): TestCaseTraceability {
  const testCase = testCases.find((item) => item.id === testCaseId) ?? null;

  return {
    project: testCase
      ? projects.find((project) => project.id === testCase.projectId) ?? null
      : null,
    module: testCase ? modules.find((module) => module.id === testCase.moduleId) ?? null : null,
    requirement: testCase
      ? requirements.find((requirement) => requirement.id === testCase.requirementId) ?? null
      : null,
    businessRule: testCase
      ? businessRules.find((rule) => rule.id === testCase.businessRuleId) ?? null
      : null,
    scenario: testCase
      ? scenarios.find((scenario) => scenario.id === testCase.scenarioId) ?? null
      : null,
    testCase,
  };
}
