import {
  demoBusinessRules,
  demoProductModules,
  demoRequirements,
} from "@/lib/business-understanding/businessUnderstandingService";
import type { BusinessRule, ProductModule, Requirement } from "@/lib/business-understanding/types";
import {
  demoBugReports,
  getBugReportTraceability,
} from "@/lib/bugs/bugService";
import type { BugReport } from "@/lib/bugs/types";
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
  evidenceSources,
  evidenceStatuses,
  evidenceTypes,
  type BugEvidenceTraceability,
  type Evidence,
  type EvidenceInput,
  type EvidenceSource,
  type EvidenceStatus,
  type EvidenceSummary,
  type EvidenceTraceability,
  type EvidenceType,
  type ExecutionEvidenceTraceability,
} from "./types";

const demoTimestamp = "2026-05-13T12:00:00.000Z";

export const demoEvidence: Evidence[] = [
  {
    id: "evidence_demo_invalid_email_screenshot",
    projectId: "project_demo_landing",
    bugReportId: "bug_demo_landing_invalid_email_open",
    executionId: "test_execution_demo_landing_release_invalid_email_failed",
    title: "Print do formulário aceitando e-mail inválido",
    description: "Referência visual do formulário permitindo envio com formato inválido.",
    evidenceType: "screenshot",
    source: "bug_report",
    reference: "referência local: /evidencias/demo/formulario-email-invalido.png",
    status: "attached",
    capturedBy: "user_demo_qa_lead",
    capturedAt: "2026-05-13",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
  {
    id: "evidence_demo_environment_unavailable_log",
    projectId: "project_demo_saas",
    bugReportId: "bug_demo_saas_environment_blocked_open",
    executionId: "test_execution_demo_saas_auth_boundary_blocked",
    title: "Log do ambiente indisponível",
    description: "Trecho de log referenciado para justificar o bloqueio da execução.",
    evidenceType: "log",
    source: "execution",
    reference: "log staging auth: 503 ao consultar fronteira de workspace",
    status: "attached",
    capturedBy: "user_demo_qa_lead",
    capturedAt: "2026-05-13",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
  {
    id: "evidence_demo_mobile_viewport_note",
    projectId: "project_demo_landing",
    bugReportId: "bug_demo_landing_mobile_cta_draft",
    executionId: "",
    title: "Nota de reprodução em viewport mobile",
    description: "Observação manual usada para investigar a quebra do CTA em tela estreita.",
    evidenceType: "note",
    source: "manual",
    reference: "viewport 320px: CTA desloca para a esquerda após rolagem até conversão",
    status: "draft",
    capturedBy: "user_demo_qa_lead",
    capturedAt: "2026-05-13",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
  {
    id: "evidence_demo_execution_cycle_url",
    projectId: "project_demo_landing",
    bugReportId: "",
    executionId: "test_execution_demo_landing_release_valid_email_passed",
    title: "Referência do ciclo de execução",
    description: "URL de referência local para consulta do recorte validado no ciclo.",
    evidenceType: "url",
    source: "execution",
    reference: "https://example.com/frankintest/demo/ciclo-release-landing",
    status: "needs_review",
    capturedBy: "user_demo_qa_lead",
    capturedAt: "2026-05-13",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
];

export function isEvidenceType(value: string): value is EvidenceType {
  return evidenceTypes.includes(value as EvidenceType);
}

export function isEvidenceSource(value: string): value is EvidenceSource {
  return evidenceSources.includes(value as EvidenceSource);
}

export function isEvidenceStatus(value: string): value is EvidenceStatus {
  return evidenceStatuses.includes(value as EvidenceStatus);
}

function isValidDateString(value: string): boolean {
  if (value.trim().length === 0) {
    return false;
  }

  return Number.isFinite(Date.parse(value));
}

export function validateEvidenceInput(input: EvidenceInput): string[] {
  const errors: string[] = [];
  const bugReportId = input.bugReportId?.trim() ?? "";
  const executionId = input.executionId?.trim() ?? "";

  if (input.projectId.trim().length === 0) {
    errors.push("evidence_project_required");
  }

  if (bugReportId.length === 0 && executionId.length === 0) {
    errors.push("evidence_link_required");
  }

  if (input.title.trim().length < 2) {
    errors.push("evidence_title_required");
  }

  if (input.description.trim().length < 2) {
    errors.push("evidence_description_required");
  }

  if (!isEvidenceType(input.evidenceType)) {
    errors.push("invalid_evidence_type");
  }

  if (!isEvidenceSource(input.source)) {
    errors.push("invalid_evidence_source");
  }

  if (input.reference.trim().length < 2) {
    errors.push("evidence_reference_required");
  }

  if (!isEvidenceStatus(input.status)) {
    errors.push("invalid_evidence_status");
  }

  if (
    input.capturedBy !== undefined &&
    input.capturedBy.trim().length > 0 &&
    input.capturedBy.trim().length < 2
  ) {
    errors.push("evidence_captured_by_required");
  }

  if (input.capturedAt && !isValidDateString(input.capturedAt)) {
    errors.push("invalid_evidence_captured_at");
  }

  return errors;
}

export function listEvidenceByProject(
  projectId: string,
  evidence: Evidence[] = demoEvidence,
): Evidence[] {
  return evidence.filter((item) => item.projectId === projectId);
}

export function listEvidenceByBugReport(
  bugReportId: string,
  evidence: Evidence[] = demoEvidence,
): Evidence[] {
  return evidence.filter((item) => item.bugReportId === bugReportId);
}

export function listEvidenceByExecution(
  executionId: string,
  evidence: Evidence[] = demoEvidence,
): Evidence[] {
  return evidence.filter((item) => item.executionId === executionId);
}

export function listEvidenceByType(
  projectId: string,
  evidenceType: EvidenceType,
  evidence: Evidence[] = demoEvidence,
): Evidence[] {
  return evidence.filter(
    (item) => item.projectId === projectId && item.evidenceType === evidenceType,
  );
}

export function listEvidenceByStatus(
  projectId: string,
  status: EvidenceStatus,
  evidence: Evidence[] = demoEvidence,
): Evidence[] {
  return evidence.filter((item) => item.projectId === projectId && item.status === status);
}

export function createEvidence(input: EvidenceInput, now = new Date()): Evidence {
  const errors = validateEvidenceInput(input);

  if (errors.length > 0) {
    throw new Error(errors.join(","));
  }

  const timestamp = now.toISOString();

  return {
    id: `evidence_${now.getTime()}`,
    projectId: input.projectId,
    bugReportId: input.bugReportId?.trim() ?? "",
    executionId: input.executionId?.trim() ?? "",
    title: input.title.trim(),
    description: input.description.trim(),
    evidenceType: input.evidenceType,
    source: input.source,
    reference: input.reference.trim(),
    status: input.status,
    capturedBy: input.capturedBy?.trim() ?? "",
    capturedAt: input.capturedAt?.trim() ?? "",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateEvidence(
  evidence: Evidence,
  updates: Partial<EvidenceInput>,
  now = new Date(),
): Evidence {
  const nextEvidence: Evidence = {
    ...evidence,
    projectId: updates.projectId ?? evidence.projectId,
    bugReportId: updates.bugReportId?.trim() ?? evidence.bugReportId,
    executionId: updates.executionId?.trim() ?? evidence.executionId,
    title: updates.title?.trim() ?? evidence.title,
    description: updates.description?.trim() ?? evidence.description,
    evidenceType: updates.evidenceType ?? evidence.evidenceType,
    source: updates.source ?? evidence.source,
    reference: updates.reference?.trim() ?? evidence.reference,
    status: updates.status ?? evidence.status,
    capturedBy: updates.capturedBy?.trim() ?? evidence.capturedBy,
    capturedAt: updates.capturedAt?.trim() ?? evidence.capturedAt,
    updatedAt: now.toISOString(),
  };

  const errors = validateEvidenceInput(nextEvidence);

  if (errors.length > 0) {
    throw new Error(errors.join(","));
  }

  return nextEvidence;
}

export function countEvidenceByProject(
  projectId: string,
  evidence: Evidence[] = demoEvidence,
): number {
  return listEvidenceByProject(projectId, evidence).length;
}

export function countEvidenceByBugReport(
  bugReportId: string,
  evidence: Evidence[] = demoEvidence,
): number {
  return listEvidenceByBugReport(bugReportId, evidence).length;
}

export function countEvidenceByExecution(
  executionId: string,
  evidence: Evidence[] = demoEvidence,
): number {
  return listEvidenceByExecution(executionId, evidence).length;
}

function createEmptyEvidenceByType(): Record<EvidenceType, number> {
  return evidenceTypes.reduce(
    (totals, evidenceType) => ({
      ...totals,
      [evidenceType]: 0,
    }),
    {} as Record<EvidenceType, number>,
  );
}

function createEmptyEvidenceByStatus(): Record<EvidenceStatus, number> {
  return evidenceStatuses.reduce(
    (totals, status) => ({
      ...totals,
      [status]: 0,
    }),
    {} as Record<EvidenceStatus, number>,
  );
}

export function getEvidenceSummary(
  projectId: string,
  evidence: Evidence[] = demoEvidence,
): EvidenceSummary {
  const projectEvidence = listEvidenceByProject(projectId, evidence);
  const evidenceByType = createEmptyEvidenceByType();
  const evidenceByStatus = createEmptyEvidenceByStatus();

  projectEvidence.forEach((item) => {
    evidenceByType[item.evidenceType] += 1;
    evidenceByStatus[item.status] += 1;
  });

  return {
    totalEvidence: projectEvidence.length,
    screenshotEvidence: evidenceByType.screenshot,
    videoEvidence: evidenceByType.video,
    logEvidence: evidenceByType.log,
    documentEvidence: evidenceByType.document,
    urlEvidence: evidenceByType.url,
    noteEvidence: evidenceByType.note,
    attachedEvidence: evidenceByStatus.attached,
    evidenceNeedingReview: evidenceByStatus.needs_review,
    linkedToBugEvidence: projectEvidence.filter((item) => item.bugReportId.length > 0).length,
    linkedToExecutionEvidence: projectEvidence.filter((item) => item.executionId.length > 0)
      .length,
    evidenceByType,
    evidenceByStatus,
  };
}

export function getEvidenceTraceability(
  evidenceId: string,
  evidence: Evidence[] = demoEvidence,
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
): EvidenceTraceability {
  const evidenceItem = evidence.find((item) => item.id === evidenceId) ?? null;
  const bugTraceability =
    evidenceItem && evidenceItem.bugReportId
      ? getBugReportTraceability(
          evidenceItem.bugReportId,
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
        )
      : null;
  const executionTraceability =
    evidenceItem && evidenceItem.executionId
      ? getTestExecutionTraceability(
          evidenceItem.executionId,
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
    project: evidenceItem
      ? projects.find((project) => project.id === evidenceItem.projectId) ?? null
      : null,
    module: bugTraceability?.module ?? executionTraceability?.module ?? null,
    requirement: bugTraceability?.requirement ?? executionTraceability?.requirement ?? null,
    businessRule: bugTraceability?.businessRule ?? executionTraceability?.businessRule ?? null,
    scenario: bugTraceability?.scenario ?? executionTraceability?.scenario ?? null,
    testCase: bugTraceability?.testCase ?? executionTraceability?.testCase ?? null,
    testSuite: bugTraceability?.testSuite ?? executionTraceability?.testSuite ?? null,
    testCycle: bugTraceability?.testCycle ?? executionTraceability?.testCycle ?? null,
    execution: bugTraceability?.execution ?? executionTraceability?.testExecution ?? null,
    bugReport: bugTraceability?.bugReport ?? null,
    evidence: evidenceItem,
  };
}

export function getBugEvidenceTraceability(
  bugReportId: string,
  evidence: Evidence[] = demoEvidence,
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
): BugEvidenceTraceability {
  const bugReport = bugReports.find((item) => item.id === bugReportId) ?? null;
  const linkedEvidence = listEvidenceByBugReport(bugReportId, evidence);

  return {
    bugReport,
    evidence: linkedEvidence,
    evidenceTraceability: linkedEvidence.map((item) =>
      getEvidenceTraceability(
        item.id,
        evidence,
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
    evidenceCount: linkedEvidence.length,
  };
}

export function getExecutionEvidenceTraceability(
  executionId: string,
  evidence: Evidence[] = demoEvidence,
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
): ExecutionEvidenceTraceability {
  const execution = testExecutions.find((item) => item.id === executionId) ?? null;
  const linkedEvidence = listEvidenceByExecution(executionId, evidence);

  return {
    execution,
    evidence: linkedEvidence,
    evidenceTraceability: linkedEvidence.map((item) =>
      getEvidenceTraceability(
        item.id,
        evidence,
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
    evidenceCount: linkedEvidence.length,
  };
}
