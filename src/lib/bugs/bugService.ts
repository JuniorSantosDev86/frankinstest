import {
  demoBusinessRules,
  demoProductModules,
  demoRequirements,
} from "@/lib/business-understanding/businessUnderstandingService";
import type { BusinessRule, ProductModule, Requirement } from "@/lib/business-understanding/types";
import { demoProjects } from "@/lib/projects/projectService";
import type { Project } from "@/lib/projects/types";
import {
  demoTestCases,
  demoTestCycles,
  demoTestExecutions,
  demoTestScenarios,
  demoTestSuites,
  getTestExecutionTraceability,
} from "@/lib/test-design/testDesignService";
import type {
  TestCase,
  TestCycle,
  TestExecution,
  TestScenario,
  TestSuite,
} from "@/lib/test-design/types";
import {
  bugPriorities,
  bugSeverities,
  bugStatuses,
  type BugPriority,
  type BugReport,
  type BugReportInput,
  type BugReportSummary,
  type BugReportTraceability,
  type BugSeverity,
  type BugStatus,
  type ExecutionBugTraceability,
  type ModuleBugTraceability,
} from "./types";

const demoTimestamp = "2026-05-13T10:00:00.000Z";

export const demoBugReports: BugReport[] = [
  {
    id: "bug_demo_landing_invalid_email_open",
    projectId: "project_demo_landing",
    moduleId: "module_demo_landing_conversion",
    executionId: "test_execution_demo_landing_release_invalid_email_failed",
    title: "Formulário aceita e-mail inválido",
    description: "O formulário permite envio com formato de e-mail inválido durante o fluxo principal.",
    stepsToReproduce: [
      "Acessar a landing page",
      "Preencher o campo de e-mail com valor inválido",
      "Enviar o formulário de captura",
    ],
    actualResult: "O lead é aceito sem feedback de validação.",
    expectedResult: "O envio deve ser bloqueado e uma mensagem de e-mail válido deve aparecer.",
    severity: "high",
    priority: "high",
    status: "open",
    environment: "Chrome desktop, ambiente staging da landing page",
    createdBy: "user_demo_qa_lead",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
  {
    id: "bug_demo_saas_environment_blocked_open",
    projectId: "project_demo_saas",
    moduleId: "module_demo_saas_auth",
    executionId: "test_execution_demo_saas_auth_boundary_blocked",
    title: "Bloqueio por ambiente indisponível",
    description: "A regressão de fronteira de workspace não pode ser concluída porque o ambiente está indisponível.",
    stepsToReproduce: [
      "Carregar a sessão do usuário demo",
      "Tentar executar a regressão de acesso entre workspaces",
      "Validar a disponibilidade do ambiente de autenticação",
    ],
    actualResult: "O ambiente retorna indisponibilidade e impede a validação do acesso.",
    expectedResult: "O ambiente deve permitir executar a regressão de acesso entre workspaces.",
    severity: "critical",
    priority: "high",
    status: "open",
    environment: "Portal SaaS staging, serviço de autenticação indisponível",
    createdBy: "user_demo_qa_lead",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
  {
    id: "bug_demo_landing_mobile_cta_draft",
    projectId: "project_demo_landing",
    moduleId: "module_demo_landing_responsive",
    executionId: "",
    title: "CTA principal quebra em tela mobile estreita",
    description: "Bug registrado manualmente para investigar quebra visual do CTA em viewport estreita.",
    stepsToReproduce: [
      "Abrir a landing page em largura mobile estreita",
      "Rolar até a área principal de conversão",
      "Observar alinhamento e toque do CTA principal",
    ],
    actualResult: "O CTA fica parcialmente desalinhado e pode cobrir conteúdo essencial.",
    expectedResult: "O CTA deve permanecer visível, acionável e sem sobrepor conteúdo.",
    severity: "medium",
    priority: "medium",
    status: "draft",
    environment: "Safari mobile, viewport estreita em demonstração local",
    createdBy: "user_demo_qa_lead",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
  {
    id: "bug_demo_landing_validation_feedback_retest",
    projectId: "project_demo_landing",
    moduleId: "module_demo_landing_conversion",
    executionId: "test_execution_demo_landing_release_invalid_email_failed",
    title: "Feedback de validação não aparece após envio",
    description: "Correção aplicada precisa de reteste para confirmar exibição do feedback de validação.",
    stepsToReproduce: [
      "Acessar a landing page em staging",
      "Enviar o formulário com e-mail inválido",
      "Observar a mensagem retornada ao visitante",
    ],
    actualResult: "A correção está disponível, mas ainda precisa de reteste no ciclo atual.",
    expectedResult: "A mensagem de validação deve aparecer logo após o envio inválido.",
    severity: "medium",
    priority: "high",
    status: "retest",
    environment: "Chrome desktop, staging após correção de validação",
    createdBy: "user_demo_qa_lead",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
];

export function isBugSeverity(value: string): value is BugSeverity {
  return bugSeverities.includes(value as BugSeverity);
}

export function isBugPriority(value: string): value is BugPriority {
  return bugPriorities.includes(value as BugPriority);
}

export function isBugStatus(value: string): value is BugStatus {
  return bugStatuses.includes(value as BugStatus);
}

export function validateBugReportInput(input: BugReportInput): string[] {
  const errors: string[] = [];

  if (input.projectId.trim().length === 0) {
    errors.push("bug_project_required");
  }

  if (input.moduleId.trim().length === 0) {
    errors.push("bug_module_required");
  }

  if (input.title.trim().length < 2) {
    errors.push("bug_title_required");
  }

  if (input.description.trim().length < 2) {
    errors.push("bug_description_required");
  }

  if (input.stepsToReproduce.length === 0) {
    errors.push("bug_steps_required");
  }

  if (input.stepsToReproduce.some((step) => step.trim().length < 2)) {
    errors.push("bug_step_required");
  }

  if (input.actualResult.trim().length < 2) {
    errors.push("bug_actual_result_required");
  }

  if (input.expectedResult.trim().length < 2) {
    errors.push("bug_expected_result_required");
  }

  if (!isBugSeverity(input.severity)) {
    errors.push("invalid_bug_severity");
  }

  if (!isBugPriority(input.priority)) {
    errors.push("invalid_bug_priority");
  }

  if (!isBugStatus(input.status)) {
    errors.push("invalid_bug_status");
  }

  if (input.environment.trim().length < 2) {
    errors.push("bug_environment_required");
  }

  if (input.createdBy !== undefined && input.createdBy.trim().length > 0 && input.createdBy.trim().length < 2) {
    errors.push("bug_created_by_required");
  }

  return errors;
}

export function listBugReportsByProject(
  projectId: string,
  bugReports: BugReport[] = demoBugReports,
): BugReport[] {
  return bugReports.filter((bugReport) => bugReport.projectId === projectId);
}

export function listBugReportsByModule(
  moduleId: string,
  bugReports: BugReport[] = demoBugReports,
): BugReport[] {
  return bugReports.filter((bugReport) => bugReport.moduleId === moduleId);
}

export function listBugReportsByExecution(
  executionId: string,
  bugReports: BugReport[] = demoBugReports,
): BugReport[] {
  return bugReports.filter((bugReport) => bugReport.executionId === executionId);
}

export function listBugReportsByStatus(
  projectId: string,
  status: BugStatus,
  bugReports: BugReport[] = demoBugReports,
): BugReport[] {
  return bugReports.filter(
    (bugReport) => bugReport.projectId === projectId && bugReport.status === status,
  );
}

export function listBugReportsBySeverity(
  projectId: string,
  severity: BugSeverity,
  bugReports: BugReport[] = demoBugReports,
): BugReport[] {
  return bugReports.filter(
    (bugReport) => bugReport.projectId === projectId && bugReport.severity === severity,
  );
}

export function createBugReport(input: BugReportInput, now = new Date()): BugReport {
  const errors = validateBugReportInput(input);

  if (errors.length > 0) {
    throw new Error(errors.join(","));
  }

  const timestamp = now.toISOString();

  return {
    id: `bug_report_${now.getTime()}`,
    projectId: input.projectId,
    moduleId: input.moduleId,
    executionId: input.executionId?.trim() ?? "",
    title: input.title.trim(),
    description: input.description.trim(),
    stepsToReproduce: input.stepsToReproduce.map((step) => step.trim()),
    actualResult: input.actualResult.trim(),
    expectedResult: input.expectedResult.trim(),
    severity: input.severity,
    priority: input.priority,
    status: input.status,
    environment: input.environment.trim(),
    createdBy: input.createdBy?.trim() ?? "",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateBugReport(
  bugReport: BugReport,
  updates: Partial<BugReportInput>,
  now = new Date(),
): BugReport {
  const nextBugReport: BugReport = {
    ...bugReport,
    projectId: updates.projectId ?? bugReport.projectId,
    moduleId: updates.moduleId ?? bugReport.moduleId,
    executionId: updates.executionId?.trim() ?? bugReport.executionId,
    title: updates.title?.trim() ?? bugReport.title,
    description: updates.description?.trim() ?? bugReport.description,
    stepsToReproduce:
      updates.stepsToReproduce?.map((step) => step.trim()) ?? bugReport.stepsToReproduce,
    actualResult: updates.actualResult?.trim() ?? bugReport.actualResult,
    expectedResult: updates.expectedResult?.trim() ?? bugReport.expectedResult,
    severity: updates.severity ?? bugReport.severity,
    priority: updates.priority ?? bugReport.priority,
    status: updates.status ?? bugReport.status,
    environment: updates.environment?.trim() ?? bugReport.environment,
    createdBy: updates.createdBy?.trim() ?? bugReport.createdBy,
    updatedAt: now.toISOString(),
  };

  const errors = validateBugReportInput(nextBugReport);

  if (errors.length > 0) {
    throw new Error(errors.join(","));
  }

  return nextBugReport;
}

export function countBugReportsByProject(
  projectId: string,
  bugReports: BugReport[] = demoBugReports,
): number {
  return listBugReportsByProject(projectId, bugReports).length;
}

export function countBugReportsByExecution(
  executionId: string,
  bugReports: BugReport[] = demoBugReports,
): number {
  return listBugReportsByExecution(executionId, bugReports).length;
}

function createEmptyBugsByStatus(): Record<BugStatus, number> {
  return bugStatuses.reduce(
    (totals, status) => ({
      ...totals,
      [status]: 0,
    }),
    {} as Record<BugStatus, number>,
  );
}

function createEmptyBugsBySeverity(): Record<BugSeverity, number> {
  return bugSeverities.reduce(
    (totals, severity) => ({
      ...totals,
      [severity]: 0,
    }),
    {} as Record<BugSeverity, number>,
  );
}

export function getBugReportSummary(
  projectId: string,
  bugReports: BugReport[] = demoBugReports,
): BugReportSummary {
  const projectBugs = listBugReportsByProject(projectId, bugReports);
  const bugsByStatus = createEmptyBugsByStatus();
  const bugsBySeverity = createEmptyBugsBySeverity();

  projectBugs.forEach((bugReport) => {
    bugsByStatus[bugReport.status] += 1;
    bugsBySeverity[bugReport.severity] += 1;
  });

  return {
    totalBugs: projectBugs.length,
    draftBugs: bugsByStatus.draft,
    openBugs: bugsByStatus.open,
    inProgressBugs: bugsByStatus.in_progress,
    retestBugs: bugsByStatus.retest,
    resolvedBugs: bugsByStatus.resolved,
    closedBugs: bugsByStatus.closed,
    rejectedBugs: bugsByStatus.rejected,
    criticalBugs: bugsBySeverity.critical,
    highBugs: bugsBySeverity.high,
    linkedToExecutionBugs: projectBugs.filter((bugReport) => bugReport.executionId.length > 0).length,
    bugsByStatus,
    bugsBySeverity,
  };
}

export function getBugReportTraceability(
  bugReportId: string,
  bugReports: BugReport[] = demoBugReports,
  testExecutions: TestExecution[] = demoTestExecutions,
  testCycles: TestCycle[] = demoTestCycles,
  testSuites: TestSuite[] = demoTestSuites,
  testCases: TestCase[] = demoTestCases,
  scenarios: TestScenario[] = demoTestScenarios,
  projects: Project[] = demoProjects,
  modules: ProductModule[] = demoProductModules,
  requirements: Requirement[] = demoRequirements,
  businessRules: BusinessRule[] = demoBusinessRules,
): BugReportTraceability {
  const bugReport = bugReports.find((item) => item.id === bugReportId) ?? null;
  const executionTraceability =
    bugReport && bugReport.executionId
      ? getTestExecutionTraceability(
          bugReport.executionId,
          testExecutions,
          testCycles,
          testSuites,
          testCases,
          scenarios,
          projects,
          modules,
          requirements,
          businessRules,
        )
      : null;

  return {
    project: bugReport
      ? projects.find((project) => project.id === bugReport.projectId) ?? null
      : null,
    module: bugReport ? modules.find((module) => module.id === bugReport.moduleId) ?? null : null,
    requirement: executionTraceability?.requirement ?? null,
    businessRule: executionTraceability?.businessRule ?? null,
    scenario: executionTraceability?.scenario ?? null,
    testCase: executionTraceability?.testCase ?? null,
    testSuite: executionTraceability?.testSuite ?? null,
    testCycle: executionTraceability?.testCycle ?? null,
    execution: executionTraceability?.testExecution ?? null,
    bugReport,
  };
}

export function getExecutionBugTraceability(
  executionId: string,
  bugReports: BugReport[] = demoBugReports,
  testExecutions: TestExecution[] = demoTestExecutions,
  testCycles: TestCycle[] = demoTestCycles,
  testSuites: TestSuite[] = demoTestSuites,
  testCases: TestCase[] = demoTestCases,
  scenarios: TestScenario[] = demoTestScenarios,
  projects: Project[] = demoProjects,
  modules: ProductModule[] = demoProductModules,
  requirements: Requirement[] = demoRequirements,
  businessRules: BusinessRule[] = demoBusinessRules,
): ExecutionBugTraceability {
  const execution = testExecutions.find((item) => item.id === executionId) ?? null;
  const linkedBugs = listBugReportsByExecution(executionId, bugReports);

  return {
    execution,
    bugReports: linkedBugs,
    bugReportTraceability: linkedBugs.map((bugReport) =>
      getBugReportTraceability(
        bugReport.id,
        bugReports,
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
    bugCount: linkedBugs.length,
  };
}

export function getModuleBugTraceability(
  moduleId: string,
  bugReports: BugReport[] = demoBugReports,
  testExecutions: TestExecution[] = demoTestExecutions,
  testCycles: TestCycle[] = demoTestCycles,
  testSuites: TestSuite[] = demoTestSuites,
  testCases: TestCase[] = demoTestCases,
  scenarios: TestScenario[] = demoTestScenarios,
  projects: Project[] = demoProjects,
  modules: ProductModule[] = demoProductModules,
  requirements: Requirement[] = demoRequirements,
  businessRules: BusinessRule[] = demoBusinessRules,
): ModuleBugTraceability {
  const productModule = modules.find((item) => item.id === moduleId) ?? null;
  const linkedBugs = listBugReportsByModule(moduleId, bugReports);

  return {
    project: productModule
      ? projects.find((project) => project.id === productModule.projectId) ?? null
      : null,
    module: productModule,
    bugReports: linkedBugs,
    bugReportTraceability: linkedBugs.map((bugReport) =>
      getBugReportTraceability(
        bugReport.id,
        bugReports,
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
    bugCount: linkedBugs.length,
  };
}
