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
  testCyclePriorities,
  testCycleStatuses,
  testExecutionStatuses,
  testSuitePriorities,
  testSuiteStatuses,
  testSuiteTypes,
  testLevels,
  type CycleExecutionTraceability,
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
  type TestCaseSuiteTraceability,
  type TestCaseTraceability,
  type TestCycle,
  type TestCycleInput,
  type TestCyclePriority,
  type TestCycleStatus,
  type TestCycleSummary,
  type TestCycleTraceability,
  type TestCycleExecutionSummary,
  type TestExecution,
  type TestExecutionInput,
  type TestExecutionStatus,
  type TestExecutionSummary,
  type TestExecutionTraceability,
  type TestCaseExecutionTraceability,
  type TestLevel,
  type TestScenario,
  type TestScenarioInput,
  type TestSuite,
  type TestSuiteInput,
  type TestSuitePriority,
  type TestSuiteStatus,
  type TestSuiteSummary,
  type TestSuiteCycleTraceability,
  type TestSuiteTraceability,
  type TestSuiteType,
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

export const demoTestSuites: TestSuite[] = [
  {
    id: "test_suite_demo_landing_smoke",
    projectId: "project_demo_landing",
    name: "Smoke - Landing page",
    description: "Suite curta para validar captura de lead e feedback essencial antes de campanha.",
    suiteType: "smoke",
    status: "ready",
    priority: "high",
    testCaseIds: [
      "test_case_demo_landing_valid_email_submission",
      "test_case_demo_landing_invalid_email_rejected",
    ],
    owner: "user_demo_qa_lead",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
  {
    id: "test_suite_demo_saas_auth_regression",
    projectId: "project_demo_saas",
    name: "Regressao - Autenticacao",
    description: "Suite deterministica para proteger a fronteira de workspace no portal SaaS.",
    suiteType: "regression",
    status: "ready",
    priority: "critical",
    testCaseIds: ["test_case_demo_saas_workspace_boundary_regression"],
    owner: "user_demo_qa_lead",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
  {
    id: "test_suite_demo_landing_release_main_flow",
    projectId: "project_demo_landing",
    name: "Release - Fluxo principal",
    description: "Suite de prontidao para revisar conversao e responsividade antes de publicar.",
    suiteType: "release",
    status: "needs_review",
    priority: "critical",
    testCaseIds: [
      "test_case_demo_landing_valid_email_submission",
      "test_case_demo_landing_invalid_email_rejected",
      "test_case_demo_landing_mobile_cta_narrow_screen",
    ],
    owner: "user_demo_qa_lead",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
  {
    id: "test_suite_demo_landing_mobile_feature",
    projectId: "project_demo_landing",
    name: "Funcional - Conversao mobile",
    description: "Suite focada no comportamento do CTA e conversao em tela mobile estreita.",
    suiteType: "feature",
    status: "draft",
    priority: "medium",
    testCaseIds: ["test_case_demo_landing_mobile_cta_narrow_screen"],
    owner: "user_demo_qa_lead",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
];

export const demoTestCycles: TestCycle[] = [
  {
    id: "test_cycle_demo_landing_smoke_planned",
    projectId: "project_demo_landing",
    name: "Ciclo smoke - Landing page",
    objective: "Planejar a execucao curta das validacoes essenciais de captura de lead.",
    status: "planned",
    priority: "high",
    testSuiteIds: ["test_suite_demo_landing_smoke"],
    owner: "user_demo_qa_lead",
    plannedStartAt: "2026-05-15",
    plannedEndAt: "2026-05-16",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
  {
    id: "test_cycle_demo_saas_auth_active",
    projectId: "project_demo_saas",
    name: "Ciclo regressivo - Autenticacao",
    objective: "Preparar a regressao deterministica da fronteira de workspace do portal SaaS.",
    status: "active",
    priority: "critical",
    testSuiteIds: ["test_suite_demo_saas_auth_regression"],
    owner: "user_demo_qa_lead",
    plannedStartAt: "2026-05-12",
    plannedEndAt: "2026-05-14",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
  {
    id: "test_cycle_demo_landing_release_completed",
    projectId: "project_demo_landing",
    name: "Ciclo release - Fluxo principal",
    objective: "Registrar o planejamento do recorte de release para conversao e responsividade.",
    status: "completed",
    priority: "critical",
    testSuiteIds: [
      "test_suite_demo_landing_smoke",
      "test_suite_demo_landing_release_main_flow",
    ],
    owner: "user_demo_qa_lead",
    plannedStartAt: "2026-05-08",
    plannedEndAt: "2026-05-10",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
  {
    id: "test_cycle_demo_landing_mobile_draft",
    projectId: "project_demo_landing",
    name: "Ciclo exploratorio - Conversao mobile",
    objective: "Rascunhar o planejamento da exploracao do CTA em telas mobile estreitas.",
    status: "draft",
    priority: "medium",
    testSuiteIds: ["test_suite_demo_landing_mobile_feature"],
    owner: "",
    plannedStartAt: "",
    plannedEndAt: "",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
];

export const demoTestExecutions: TestExecution[] = [
  {
    id: "test_execution_demo_landing_smoke_valid_email_not_run",
    projectId: "project_demo_landing",
    cycleId: "test_cycle_demo_landing_smoke_planned",
    testSuiteId: "test_suite_demo_landing_smoke",
    testCaseId: "test_case_demo_landing_valid_email_submission",
    status: "not_run",
    notes: "Execução ainda não iniciada.",
    executedBy: "",
    executedAt: "",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
  {
    id: "test_execution_demo_landing_release_valid_email_passed",
    projectId: "project_demo_landing",
    cycleId: "test_cycle_demo_landing_release_completed",
    testSuiteId: "test_suite_demo_landing_smoke",
    testCaseId: "test_case_demo_landing_valid_email_submission",
    status: "passed",
    notes: "Fluxo validado sem divergências visíveis.",
    executedBy: "user_demo_qa_lead",
    executedAt: "2026-05-09",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
  {
    id: "test_execution_demo_landing_release_invalid_email_failed",
    projectId: "project_demo_landing",
    cycleId: "test_cycle_demo_landing_release_completed",
    testSuiteId: "test_suite_demo_landing_smoke",
    testCaseId: "test_case_demo_landing_invalid_email_rejected",
    status: "failed",
    notes: "Falha observada no feedback de validação.",
    executedBy: "user_demo_qa_lead",
    executedAt: "2026-05-09",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
  {
    id: "test_execution_demo_saas_auth_boundary_blocked",
    projectId: "project_demo_saas",
    cycleId: "test_cycle_demo_saas_auth_active",
    testSuiteId: "test_suite_demo_saas_auth_regression",
    testCaseId: "test_case_demo_saas_workspace_boundary_regression",
    status: "blocked",
    notes: "Bloqueado por ambiente indisponível.",
    executedBy: "user_demo_qa_lead",
    executedAt: "2026-05-12",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
  {
    id: "test_execution_demo_landing_mobile_skipped",
    projectId: "project_demo_landing",
    cycleId: "test_cycle_demo_landing_release_completed",
    testSuiteId: "test_suite_demo_landing_release_main_flow",
    testCaseId: "test_case_demo_landing_mobile_cta_narrow_screen",
    status: "skipped",
    notes: "Pulado fora do escopo deste ciclo.",
    executedBy: "user_demo_qa_lead",
    executedAt: "2026-05-10",
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

export function isTestSuiteType(value: string): value is TestSuiteType {
  return testSuiteTypes.includes(value as TestSuiteType);
}

export function isTestSuiteStatus(value: string): value is TestSuiteStatus {
  return testSuiteStatuses.includes(value as TestSuiteStatus);
}

export function isTestSuitePriority(value: string): value is TestSuitePriority {
  return testSuitePriorities.includes(value as TestSuitePriority);
}

export function isTestCycleStatus(value: string): value is TestCycleStatus {
  return testCycleStatuses.includes(value as TestCycleStatus);
}

export function isTestCyclePriority(value: string): value is TestCyclePriority {
  return testCyclePriorities.includes(value as TestCyclePriority);
}

export function isTestExecutionStatus(value: string): value is TestExecutionStatus {
  return testExecutionStatuses.includes(value as TestExecutionStatus);
}

function isValidDateString(value: string): boolean {
  if (value.trim().length === 0) {
    return false;
  }

  const timestamp = Date.parse(value);

  return Number.isFinite(timestamp);
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

export function validateTestSuiteInput(input: TestSuiteInput): string[] {
  const errors: string[] = [];

  if (input.projectId.trim().length === 0) {
    errors.push("test_suite_project_required");
  }

  if (input.name.trim().length < 2) {
    errors.push("test_suite_name_required");
  }

  if (input.suiteType !== undefined && !isTestSuiteType(input.suiteType)) {
    errors.push("invalid_test_suite_type");
  }

  if (input.status !== undefined && !isTestSuiteStatus(input.status)) {
    errors.push("invalid_test_suite_status");
  }

  if (input.priority !== undefined && !isTestSuitePriority(input.priority)) {
    errors.push("invalid_test_suite_priority");
  }

  if (input.testCaseIds.length === 0) {
    errors.push("test_suite_test_cases_required");
  }

  if (input.testCaseIds.some((testCaseId) => testCaseId.trim().length < 2)) {
    errors.push("test_suite_test_case_id_required");
  }

  return errors;
}

export function validateTestCycleInput(input: TestCycleInput): string[] {
  const errors: string[] = [];

  if (input.projectId.trim().length === 0) {
    errors.push("test_cycle_project_required");
  }

  if (input.name.trim().length < 2) {
    errors.push("test_cycle_name_required");
  }

  if (input.objective.trim().length < 2) {
    errors.push("test_cycle_objective_required");
  }

  if (input.status !== undefined && !isTestCycleStatus(input.status)) {
    errors.push("invalid_test_cycle_status");
  }

  if (input.priority !== undefined && !isTestCyclePriority(input.priority)) {
    errors.push("invalid_test_cycle_priority");
  }

  if (input.testSuiteIds.length === 0) {
    errors.push("test_cycle_test_suites_required");
  }

  if (input.testSuiteIds.some((testSuiteId) => testSuiteId.trim().length < 2)) {
    errors.push("test_cycle_test_suite_id_required");
  }

  if (input.plannedStartAt && !isValidDateString(input.plannedStartAt)) {
    errors.push("invalid_test_cycle_planned_start");
  }

  if (input.plannedEndAt && !isValidDateString(input.plannedEndAt)) {
    errors.push("invalid_test_cycle_planned_end");
  }

  if (
    input.plannedStartAt &&
    input.plannedEndAt &&
    isValidDateString(input.plannedStartAt) &&
    isValidDateString(input.plannedEndAt) &&
    Date.parse(input.plannedEndAt) < Date.parse(input.plannedStartAt)
  ) {
    errors.push("test_cycle_planned_end_before_start");
  }

  return errors;
}

export function validateTestExecutionInput(input: TestExecutionInput): string[] {
  const errors: string[] = [];

  if (input.projectId.trim().length === 0) {
    errors.push("test_execution_project_required");
  }

  if (input.cycleId.trim().length === 0) {
    errors.push("test_execution_cycle_required");
  }

  if (input.testSuiteId.trim().length === 0) {
    errors.push("test_execution_suite_required");
  }

  if (input.testCaseId.trim().length === 0) {
    errors.push("test_execution_case_required");
  }

  if (!isTestExecutionStatus(input.status)) {
    errors.push("invalid_test_execution_status");
  }

  if (input.executedAt && !isValidDateString(input.executedAt)) {
    errors.push("invalid_test_execution_executed_at");
  }

  if (input.status !== "not_run") {
    if (!input.executedAt || input.executedAt.trim().length === 0) {
      errors.push("test_execution_executed_at_required");
    }

    if (!input.executedBy || input.executedBy.trim().length === 0) {
      errors.push("test_execution_executed_by_required");
    }
  }

  if (
    (input.status === "failed" || input.status === "blocked") &&
    (!input.notes || input.notes.trim().length < 2)
  ) {
    errors.push("test_execution_notes_required");
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

export function listTestSuitesByProject(
  projectId: string,
  testSuites: TestSuite[] = demoTestSuites,
): TestSuite[] {
  return testSuites.filter((testSuite) => testSuite.projectId === projectId);
}

export function listTestSuitesByType(
  projectId: string,
  suiteType: TestSuiteType,
  testSuites: TestSuite[] = demoTestSuites,
): TestSuite[] {
  return testSuites.filter(
    (testSuite) => testSuite.projectId === projectId && testSuite.suiteType === suiteType,
  );
}

export function listTestSuitesByTestCase(
  testCaseId: string,
  testSuites: TestSuite[] = demoTestSuites,
): TestSuite[] {
  return testSuites.filter((testSuite) => testSuite.testCaseIds.includes(testCaseId));
}

export function listTestCyclesByProject(
  projectId: string,
  testCycles: TestCycle[] = demoTestCycles,
): TestCycle[] {
  return testCycles.filter((testCycle) => testCycle.projectId === projectId);
}

export function listTestCyclesByStatus(
  projectId: string,
  status: TestCycleStatus,
  testCycles: TestCycle[] = demoTestCycles,
): TestCycle[] {
  return testCycles.filter(
    (testCycle) => testCycle.projectId === projectId && testCycle.status === status,
  );
}

export function listTestCyclesBySuite(
  testSuiteId: string,
  testCycles: TestCycle[] = demoTestCycles,
): TestCycle[] {
  return testCycles.filter((testCycle) => testCycle.testSuiteIds.includes(testSuiteId));
}

export function listExecutionsByProject(
  projectId: string,
  testExecutions: TestExecution[] = demoTestExecutions,
): TestExecution[] {
  return testExecutions.filter((testExecution) => testExecution.projectId === projectId);
}

export function listExecutionsByCycle(
  cycleId: string,
  testExecutions: TestExecution[] = demoTestExecutions,
): TestExecution[] {
  return testExecutions.filter((testExecution) => testExecution.cycleId === cycleId);
}

export function listExecutionsBySuite(
  testSuiteId: string,
  testExecutions: TestExecution[] = demoTestExecutions,
): TestExecution[] {
  return testExecutions.filter((testExecution) => testExecution.testSuiteId === testSuiteId);
}

export function listExecutionsByTestCase(
  testCaseId: string,
  testExecutions: TestExecution[] = demoTestExecutions,
): TestExecution[] {
  return testExecutions.filter((testExecution) => testExecution.testCaseId === testCaseId);
}

export function listExecutionsByStatus(
  projectId: string,
  status: TestExecutionStatus,
  testExecutions: TestExecution[] = demoTestExecutions,
): TestExecution[] {
  return testExecutions.filter(
    (testExecution) => testExecution.projectId === projectId && testExecution.status === status,
  );
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

export function createTestSuite(input: TestSuiteInput, now = new Date()): TestSuite {
  const errors = validateTestSuiteInput(input);

  if (errors.length > 0) {
    throw new Error(errors.join(","));
  }

  const timestamp = now.toISOString();

  return {
    id: `test_suite_${now.getTime()}`,
    projectId: input.projectId,
    name: input.name.trim(),
    description: input.description?.trim() ?? "",
    suiteType: input.suiteType ?? "feature",
    status: input.status ?? "draft",
    priority: input.priority ?? "medium",
    testCaseIds: input.testCaseIds.map((testCaseId) => testCaseId.trim()),
    owner: input.owner?.trim() ?? "",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createTestCycle(input: TestCycleInput, now = new Date()): TestCycle {
  const errors = validateTestCycleInput(input);

  if (errors.length > 0) {
    throw new Error(errors.join(","));
  }

  const timestamp = now.toISOString();

  return {
    id: `test_cycle_${now.getTime()}`,
    projectId: input.projectId,
    name: input.name.trim(),
    objective: input.objective.trim(),
    status: input.status ?? "draft",
    priority: input.priority ?? "medium",
    testSuiteIds: input.testSuiteIds.map((testSuiteId) => testSuiteId.trim()),
    owner: input.owner?.trim() ?? "",
    plannedStartAt: input.plannedStartAt?.trim() ?? "",
    plannedEndAt: input.plannedEndAt?.trim() ?? "",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createTestExecution(
  input: TestExecutionInput,
  now = new Date(),
): TestExecution {
  const errors = validateTestExecutionInput(input);

  if (errors.length > 0) {
    throw new Error(errors.join(","));
  }

  const timestamp = now.toISOString();

  return {
    id: `test_execution_${now.getTime()}`,
    projectId: input.projectId,
    cycleId: input.cycleId,
    testSuiteId: input.testSuiteId,
    testCaseId: input.testCaseId,
    status: input.status,
    notes: input.notes?.trim() ?? "",
    executedBy: input.executedBy?.trim() ?? "",
    executedAt: input.executedAt?.trim() ?? "",
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

export function updateTestSuite(
  testSuite: TestSuite,
  updates: Partial<TestSuiteInput>,
  now = new Date(),
): TestSuite {
  const nextTestSuite: TestSuite = {
    ...testSuite,
    projectId: updates.projectId ?? testSuite.projectId,
    name: updates.name?.trim() ?? testSuite.name,
    description: updates.description?.trim() ?? testSuite.description,
    suiteType: updates.suiteType ?? testSuite.suiteType,
    status: updates.status ?? testSuite.status,
    priority: updates.priority ?? testSuite.priority,
    testCaseIds:
      updates.testCaseIds?.map((testCaseId) => testCaseId.trim()) ?? testSuite.testCaseIds,
    owner: updates.owner?.trim() ?? testSuite.owner,
    updatedAt: now.toISOString(),
  };

  const errors = validateTestSuiteInput(nextTestSuite);

  if (errors.length > 0) {
    throw new Error(errors.join(","));
  }

  return nextTestSuite;
}

export function updateTestCycle(
  testCycle: TestCycle,
  updates: Partial<TestCycleInput>,
  now = new Date(),
): TestCycle {
  const nextTestCycle: TestCycle = {
    ...testCycle,
    projectId: updates.projectId ?? testCycle.projectId,
    name: updates.name?.trim() ?? testCycle.name,
    objective: updates.objective?.trim() ?? testCycle.objective,
    status: updates.status ?? testCycle.status,
    priority: updates.priority ?? testCycle.priority,
    testSuiteIds:
      updates.testSuiteIds?.map((testSuiteId) => testSuiteId.trim()) ?? testCycle.testSuiteIds,
    owner: updates.owner?.trim() ?? testCycle.owner,
    plannedStartAt: updates.plannedStartAt?.trim() ?? testCycle.plannedStartAt,
    plannedEndAt: updates.plannedEndAt?.trim() ?? testCycle.plannedEndAt,
    updatedAt: now.toISOString(),
  };

  const errors = validateTestCycleInput(nextTestCycle);

  if (errors.length > 0) {
    throw new Error(errors.join(","));
  }

  return nextTestCycle;
}

export function updateTestExecution(
  testExecution: TestExecution,
  updates: Partial<TestExecutionInput>,
  now = new Date(),
): TestExecution {
  const nextTestExecution: TestExecution = {
    ...testExecution,
    projectId: updates.projectId ?? testExecution.projectId,
    cycleId: updates.cycleId ?? testExecution.cycleId,
    testSuiteId: updates.testSuiteId ?? testExecution.testSuiteId,
    testCaseId: updates.testCaseId ?? testExecution.testCaseId,
    status: updates.status ?? testExecution.status,
    notes: updates.notes?.trim() ?? testExecution.notes,
    executedBy: updates.executedBy?.trim() ?? testExecution.executedBy,
    executedAt: updates.executedAt?.trim() ?? testExecution.executedAt,
    updatedAt: now.toISOString(),
  };

  const errors = validateTestExecutionInput(nextTestExecution);

  if (errors.length > 0) {
    throw new Error(errors.join(","));
  }

  return nextTestExecution;
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

export function countTestSuitesByProject(
  projectId: string,
  testSuites: TestSuite[] = demoTestSuites,
): number {
  return listTestSuitesByProject(projectId, testSuites).length;
}

export function countTestSuitesByTestCase(
  testCaseId: string,
  testSuites: TestSuite[] = demoTestSuites,
): number {
  return listTestSuitesByTestCase(testCaseId, testSuites).length;
}

export function countTestCyclesByProject(
  projectId: string,
  testCycles: TestCycle[] = demoTestCycles,
): number {
  return listTestCyclesByProject(projectId, testCycles).length;
}

export function countTestCyclesBySuite(
  testSuiteId: string,
  testCycles: TestCycle[] = demoTestCycles,
): number {
  return listTestCyclesBySuite(testSuiteId, testCycles).length;
}

export function countExecutionsByCycle(
  cycleId: string,
  testExecutions: TestExecution[] = demoTestExecutions,
): number {
  return listExecutionsByCycle(cycleId, testExecutions).length;
}

export function countExecutionsByTestCase(
  testCaseId: string,
  testExecutions: TestExecution[] = demoTestExecutions,
): number {
  return listExecutionsByTestCase(testCaseId, testExecutions).length;
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

function createEmptySuitesByType(): Record<TestSuiteType, number> {
  return testSuiteTypes.reduce(
    (totals, suiteType) => ({
      ...totals,
      [suiteType]: 0,
    }),
    {} as Record<TestSuiteType, number>,
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

function createEmptyCyclesByStatus(): Record<TestCycleStatus, number> {
  return testCycleStatuses.reduce(
    (totals, status) => ({
      ...totals,
      [status]: 0,
    }),
    {} as Record<TestCycleStatus, number>,
  );
}

function createEmptyExecutionsByStatus(): Record<TestExecutionStatus, number> {
  return testExecutionStatuses.reduce(
    (totals, status) => ({
      ...totals,
      [status]: 0,
    }),
    {} as Record<TestExecutionStatus, number>,
  );
}

function calculateRate(numerator: number, denominator: number): number {
  if (denominator === 0) {
    return 0;
  }

  return Math.round((numerator / denominator) * 100);
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

export function getTestSuiteSummary(
  projectId: string,
  testSuites: TestSuite[] = demoTestSuites,
): TestSuiteSummary {
  const projectSuites = listTestSuitesByProject(projectId, testSuites);
  const suitesByType = createEmptySuitesByType();
  const linkedTestCaseIds = new Set<string>();

  projectSuites.forEach((testSuite) => {
    suitesByType[testSuite.suiteType] += 1;
    testSuite.testCaseIds.forEach((testCaseId) => linkedTestCaseIds.add(testCaseId));
  });

  return {
    totalSuites: projectSuites.length,
    readySuites: projectSuites.filter((testSuite) => testSuite.status === "ready").length,
    suitesNeedingReview: projectSuites.filter((testSuite) => testSuite.status === "needs_review")
      .length,
    criticalSuites: projectSuites.filter((testSuite) => testSuite.priority === "critical").length,
    archivedSuites: projectSuites.filter((testSuite) => testSuite.status === "archived").length,
    totalLinkedTestCases: linkedTestCaseIds.size,
    suitesByType,
  };
}

export function getTestCycleSummary(
  projectId: string,
  testCycles: TestCycle[] = demoTestCycles,
): TestCycleSummary {
  const projectCycles = listTestCyclesByProject(projectId, testCycles);
  const cyclesByStatus = createEmptyCyclesByStatus();
  const linkedSuiteIds = new Set<string>();

  projectCycles.forEach((testCycle) => {
    cyclesByStatus[testCycle.status] += 1;
    testCycle.testSuiteIds.forEach((testSuiteId) => linkedSuiteIds.add(testSuiteId));
  });

  return {
    totalCycles: projectCycles.length,
    draftCycles: projectCycles.filter((testCycle) => testCycle.status === "draft").length,
    plannedCycles: projectCycles.filter((testCycle) => testCycle.status === "planned").length,
    activeCycles: projectCycles.filter((testCycle) => testCycle.status === "active").length,
    completedCycles: projectCycles.filter((testCycle) => testCycle.status === "completed").length,
    archivedCycles: projectCycles.filter((testCycle) => testCycle.status === "archived").length,
    criticalCycles: projectCycles.filter((testCycle) => testCycle.priority === "critical").length,
    totalLinkedSuites: linkedSuiteIds.size,
    cyclesByStatus,
  };
}

export function getTestExecutionSummary(
  projectId: string,
  testExecutions: TestExecution[] = demoTestExecutions,
): TestExecutionSummary {
  const projectExecutions = listExecutionsByProject(projectId, testExecutions);
  const executionsByStatus = createEmptyExecutionsByStatus();

  projectExecutions.forEach((testExecution) => {
    executionsByStatus[testExecution.status] += 1;
  });

  const totalExecutions = projectExecutions.length;
  const passedExecutions = executionsByStatus.passed;
  const executedExecutions = totalExecutions - executionsByStatus.not_run;

  return {
    totalExecutions,
    notRunExecutions: executionsByStatus.not_run,
    passedExecutions,
    failedExecutions: executionsByStatus.failed,
    blockedExecutions: executionsByStatus.blocked,
    skippedExecutions: executionsByStatus.skipped,
    executedExecutions,
    completionRate: calculateRate(executedExecutions, totalExecutions),
    passRate: calculateRate(passedExecutions, executedExecutions),
    executionsByStatus,
  };
}

export function getTestCycleExecutionSummary(
  cycleId: string,
  testExecutions: TestExecution[] = demoTestExecutions,
): TestCycleExecutionSummary {
  const cycleExecutions = listExecutionsByCycle(cycleId, testExecutions);
  const executionsByStatus = createEmptyExecutionsByStatus();

  cycleExecutions.forEach((testExecution) => {
    executionsByStatus[testExecution.status] += 1;
  });

  const totalExecutions = cycleExecutions.length;
  const passedExecutions = executionsByStatus.passed;
  const executedExecutions = totalExecutions - executionsByStatus.not_run;

  return {
    totalExecutions,
    notRunExecutions: executionsByStatus.not_run,
    passedExecutions,
    failedExecutions: executionsByStatus.failed,
    blockedExecutions: executionsByStatus.blocked,
    skippedExecutions: executionsByStatus.skipped,
    completionRate: calculateRate(executedExecutions, totalExecutions),
    passRate: calculateRate(passedExecutions, executedExecutions),
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

export function getTestSuiteTraceability(
  testSuiteId: string,
  testSuites: TestSuite[] = demoTestSuites,
  testCases: TestCase[] = demoTestCases,
  scenarios: TestScenario[] = demoTestScenarios,
  projects: Project[] = demoProjects,
  modules: ProductModule[] = demoProductModules,
  requirements: Requirement[] = demoRequirements,
  businessRules: BusinessRule[] = demoBusinessRules,
): TestSuiteTraceability {
  const testSuite = testSuites.find((item) => item.id === testSuiteId) ?? null;
  const linkedTestCases = testSuite
    ? testCases.filter((testCase) => testSuite.testCaseIds.includes(testCase.id))
    : [];

  return {
    project: testSuite
      ? projects.find((project) => project.id === testSuite.projectId) ?? null
      : null,
    testSuite,
    testCases: linkedTestCases,
    testCaseTraceability: linkedTestCases.map((testCase) =>
      getTestCaseTraceability(
        testCase.id,
        testCases,
        scenarios,
        projects,
        modules,
        requirements,
        businessRules,
      ),
    ),
  };
}

export function getTestCaseSuiteTraceability(
  testCaseId: string,
  testCases: TestCase[] = demoTestCases,
  testSuites: TestSuite[] = demoTestSuites,
  scenarios: TestScenario[] = demoTestScenarios,
  projects: Project[] = demoProjects,
  modules: ProductModule[] = demoProductModules,
  requirements: Requirement[] = demoRequirements,
  businessRules: BusinessRule[] = demoBusinessRules,
): TestCaseSuiteTraceability {
  const testCaseTraceability = getTestCaseTraceability(
    testCaseId,
    testCases,
    scenarios,
    projects,
    modules,
    requirements,
    businessRules,
  );
  const testSuitesForCase = listTestSuitesByTestCase(testCaseId, testSuites);

  return {
    ...testCaseTraceability,
    testSuites: testSuitesForCase,
    suiteCount: testSuitesForCase.length,
  };
}

export function getTestCycleTraceability(
  testCycleId: string,
  testCycles: TestCycle[] = demoTestCycles,
  testSuites: TestSuite[] = demoTestSuites,
  testCases: TestCase[] = demoTestCases,
  scenarios: TestScenario[] = demoTestScenarios,
  projects: Project[] = demoProjects,
  modules: ProductModule[] = demoProductModules,
  requirements: Requirement[] = demoRequirements,
  businessRules: BusinessRule[] = demoBusinessRules,
): TestCycleTraceability {
  const testCycle = testCycles.find((item) => item.id === testCycleId) ?? null;
  const linkedSuites = testCycle
    ? testSuites.filter((testSuite) => testCycle.testSuiteIds.includes(testSuite.id))
    : [];

  return {
    project: testCycle
      ? projects.find((project) => project.id === testCycle.projectId) ?? null
      : null,
    testCycle,
    testSuites: linkedSuites,
    testSuiteTraceability: linkedSuites.map((testSuite) =>
      getTestSuiteTraceability(
        testSuite.id,
        testSuites,
        testCases,
        scenarios,
        projects,
        modules,
        requirements,
        businessRules,
      ),
    ),
  };
}

export function getTestSuiteCycleTraceability(
  testSuiteId: string,
  testSuites: TestSuite[] = demoTestSuites,
  testCycles: TestCycle[] = demoTestCycles,
  testCases: TestCase[] = demoTestCases,
  scenarios: TestScenario[] = demoTestScenarios,
  projects: Project[] = demoProjects,
  modules: ProductModule[] = demoProductModules,
  requirements: Requirement[] = demoRequirements,
  businessRules: BusinessRule[] = demoBusinessRules,
): TestSuiteCycleTraceability {
  const testSuiteTraceability = getTestSuiteTraceability(
    testSuiteId,
    testSuites,
    testCases,
    scenarios,
    projects,
    modules,
    requirements,
    businessRules,
  );
  const testCyclesForSuite = listTestCyclesBySuite(testSuiteId, testCycles);

  return {
    ...testSuiteTraceability,
    testCycles: testCyclesForSuite,
    cycleCount: testCyclesForSuite.length,
  };
}

export function getTestExecutionTraceability(
  testExecutionId: string,
  testExecutions: TestExecution[] = demoTestExecutions,
  testCycles: TestCycle[] = demoTestCycles,
  testSuites: TestSuite[] = demoTestSuites,
  testCases: TestCase[] = demoTestCases,
  scenarios: TestScenario[] = demoTestScenarios,
  projects: Project[] = demoProjects,
  modules: ProductModule[] = demoProductModules,
  requirements: Requirement[] = demoRequirements,
  businessRules: BusinessRule[] = demoBusinessRules,
): TestExecutionTraceability {
  const testExecution = testExecutions.find((item) => item.id === testExecutionId) ?? null;
  const testCaseTraceability = testExecution
    ? getTestCaseTraceability(
        testExecution.testCaseId,
        testCases,
        scenarios,
        projects,
        modules,
        requirements,
        businessRules,
      )
    : null;

  return {
    project: testExecution
      ? projects.find((project) => project.id === testExecution.projectId) ?? null
      : null,
    module: testCaseTraceability?.module ?? null,
    requirement: testCaseTraceability?.requirement ?? null,
    businessRule: testCaseTraceability?.businessRule ?? null,
    scenario: testCaseTraceability?.scenario ?? null,
    testCase: testCaseTraceability?.testCase ?? null,
    testSuite: testExecution
      ? testSuites.find((testSuite) => testSuite.id === testExecution.testSuiteId) ?? null
      : null,
    testCycle: testExecution
      ? testCycles.find((testCycle) => testCycle.id === testExecution.cycleId) ?? null
      : null,
    testExecution,
  };
}

export function getTestCaseExecutionTraceability(
  testCaseId: string,
  testExecutions: TestExecution[] = demoTestExecutions,
  testCycles: TestCycle[] = demoTestCycles,
  testSuites: TestSuite[] = demoTestSuites,
  testCases: TestCase[] = demoTestCases,
  scenarios: TestScenario[] = demoTestScenarios,
  projects: Project[] = demoProjects,
  modules: ProductModule[] = demoProductModules,
  requirements: Requirement[] = demoRequirements,
  businessRules: BusinessRule[] = demoBusinessRules,
): TestCaseExecutionTraceability {
  const testCaseTraceability = getTestCaseTraceability(
    testCaseId,
    testCases,
    scenarios,
    projects,
    modules,
    requirements,
    businessRules,
  );
  const linkedExecutions = listExecutionsByTestCase(testCaseId, testExecutions);
  const linkedSuiteIds = new Set(linkedExecutions.map((testExecution) => testExecution.testSuiteId));
  const linkedCycleIds = new Set(linkedExecutions.map((testExecution) => testExecution.cycleId));

  return {
    ...testCaseTraceability,
    testSuites: testSuites.filter((testSuite) => linkedSuiteIds.has(testSuite.id)),
    testCycles: testCycles.filter((testCycle) => linkedCycleIds.has(testCycle.id)),
    testExecutions: linkedExecutions,
    executionCount: linkedExecutions.length,
  };
}

export function getCycleExecutionTraceability(
  cycleId: string,
  testExecutions: TestExecution[] = demoTestExecutions,
  testCycles: TestCycle[] = demoTestCycles,
  testSuites: TestSuite[] = demoTestSuites,
  testCases: TestCase[] = demoTestCases,
  scenarios: TestScenario[] = demoTestScenarios,
  projects: Project[] = demoProjects,
  modules: ProductModule[] = demoProductModules,
  requirements: Requirement[] = demoRequirements,
  businessRules: BusinessRule[] = demoBusinessRules,
): CycleExecutionTraceability {
  const cycleTraceability = getTestCycleTraceability(
    cycleId,
    testCycles,
    testSuites,
    testCases,
    scenarios,
    projects,
    modules,
    requirements,
    businessRules,
  );
  const linkedExecutions = listExecutionsByCycle(cycleId, testExecutions);
  const linkedTestCaseIds = new Set(linkedExecutions.map((testExecution) => testExecution.testCaseId));

  return {
    project: cycleTraceability.project,
    testCycle: cycleTraceability.testCycle,
    testSuites: cycleTraceability.testSuites,
    testCases: testCases.filter((testCase) => linkedTestCaseIds.has(testCase.id)),
    testExecutions: linkedExecutions,
    testExecutionTraceability: linkedExecutions.map((testExecution) =>
      getTestExecutionTraceability(
        testExecution.id,
        testExecutions,
        testCycles,
        testSuites,
        testCases,
        scenarios,
        projects,
        modules,
        requirements,
        businessRules,
      ),
    ),
  };
}
