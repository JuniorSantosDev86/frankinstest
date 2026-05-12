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
  testLevels,
  type BusinessRuleScenarioTraceability,
  type ScenarioDesignSummary,
  type ScenarioPriority,
  type ScenarioStatus,
  type ScenarioTraceability,
  type ScenarioType,
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

export function countScenariosByBusinessRule(
  businessRuleId: string,
  scenarios: TestScenario[] = demoTestScenarios,
): number {
  return listScenariosByBusinessRule(businessRuleId, scenarios).length;
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
