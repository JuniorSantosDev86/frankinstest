import { demoBugReports, getBugReportSummary } from "@/lib/bugs/bugService";
import type { BugReport } from "@/lib/bugs/types";
import { demoEvidence, getEvidenceSummary } from "@/lib/evidence/evidenceService";
import type { Evidence } from "@/lib/evidence/types";
import { demoProjects } from "@/lib/projects/projectService";
import type { Project } from "@/lib/projects/types";
import {
  demoTestCycles,
  demoTestExecutions,
  getTestExecutionSummary,
  listTestCyclesByProject,
} from "@/lib/test-design/testDesignService";
import type { TestCycle, TestExecution } from "@/lib/test-design/types";
import {
  reportScopes,
  reportStatuses,
  reportTypes,
  type BugReportReportTraceability,
  type EvidenceReportTraceability,
  type ProjectReportTraceability,
  type Report,
  type ReportInput,
  type ReportScope,
  type ReportSnapshot,
  type ReportStatus,
  type ReportSummary,
  type ReportTraceability,
  type ReportType,
} from "./types";

const demoTimestamp = "2026-05-13T13:00:00.000Z";

export const demoReports: Report[] = [
  {
    id: "report_demo_landing_qa_status",
    projectId: "project_demo_landing",
    title: "Relatório QA — Landing page",
    description: "Visão determinística do status de QA para o projeto de landing page.",
    reportType: "qa_status",
    status: "ready",
    scope: "project",
    linkedCycleIds: [
      "test_cycle_demo_landing_smoke_planned",
      "test_cycle_demo_landing_release_completed",
    ],
    linkedExecutionIds: [
      "test_execution_demo_landing_release_valid_email_passed",
      "test_execution_demo_landing_release_invalid_email_failed",
      "test_execution_demo_landing_mobile_skipped",
    ],
    linkedBugReportIds: [
      "bug_demo_landing_invalid_email_open",
      "bug_demo_landing_validation_feedback_retest",
    ],
    linkedEvidenceIds: [
      "evidence_demo_invalid_email_screenshot",
      "evidence_demo_execution_cycle_url",
    ],
    summary:
      "Status consolidado localmente com foco no fluxo de conversão, validação de formulário e evidências anexadas.",
    risks: [
      "Validação de e-mail ainda apresenta falha aberta no fluxo principal.",
      "Parte da revisão mobile ficou fora do escopo do ciclo concluído.",
    ],
    recommendations: [
      "Retestar o feedback de validação antes de comunicar estabilidade do fluxo.",
      "Abrir ciclo específico para responsividade mobile estreita.",
    ],
    conclusion:
      "O projeto possui evidências úteis e execução parcial, mas ainda exige validação manual dos riscos abertos.",
    createdBy: "user_demo_qa_lead",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
  {
    id: "report_demo_landing_execution_summary",
    projectId: "project_demo_landing",
    title: "Resumo de execução — Ciclo release",
    description: "Resumo manual do ciclo de release do fluxo principal da landing page.",
    reportType: "execution_summary",
    status: "needs_review",
    scope: "cycle",
    linkedCycleIds: ["test_cycle_demo_landing_release_completed"],
    linkedExecutionIds: [
      "test_execution_demo_landing_release_valid_email_passed",
      "test_execution_demo_landing_release_invalid_email_failed",
      "test_execution_demo_landing_mobile_skipped",
    ],
    linkedBugReportIds: ["bug_demo_landing_invalid_email_open"],
    linkedEvidenceIds: ["evidence_demo_execution_cycle_url"],
    summary:
      "O ciclo de release registrou aprovação no envio válido, falha no envio inválido e item mobile pulado.",
    risks: ["Falha funcional no caminho negativo pode afetar qualidade dos leads capturados."],
    recommendations: ["Corrigir e retestar o envio inválido antes de ampliar a cobertura do release."],
    conclusion: "A execução documenta progresso, mas o ciclo ainda precisa de revisão de QA.",
    createdBy: "user_demo_qa_lead",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
  {
    id: "report_demo_landing_bug_summary",
    projectId: "project_demo_landing",
    title: "Resumo de bugs — Conversão",
    description: "Consolidação local dos bugs ligados ao fluxo de conversão.",
    reportType: "bug_summary",
    status: "draft",
    scope: "bug",
    linkedCycleIds: ["test_cycle_demo_landing_release_completed"],
    linkedExecutionIds: ["test_execution_demo_landing_release_invalid_email_failed"],
    linkedBugReportIds: [
      "bug_demo_landing_invalid_email_open",
      "bug_demo_landing_mobile_cta_draft",
      "bug_demo_landing_validation_feedback_retest",
    ],
    linkedEvidenceIds: [
      "evidence_demo_invalid_email_screenshot",
      "evidence_demo_mobile_viewport_note",
    ],
    summary:
      "Os bugs atuais se concentram em conversão, validação de formulário e responsividade mobile.",
    risks: ["Defeitos de conversão podem reduzir confiança no formulário principal."],
    recommendations: [
      "Priorizar bugs de validação antes de ajustes visuais de menor impacto.",
      "Vincular evidência adicional ao CTA mobile após nova reprodução.",
    ],
    conclusion: "O resumo deve permanecer em rascunho até o reteste dos itens de maior prioridade.",
    createdBy: "user_demo_qa_lead",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
  {
    id: "report_demo_landing_evidence_summary",
    projectId: "project_demo_landing",
    title: "Resumo de evidências — Formulário",
    description: "Resumo estruturado das evidências locais associadas ao formulário.",
    reportType: "evidence_summary",
    status: "ready",
    scope: "evidence",
    linkedCycleIds: ["test_cycle_demo_landing_release_completed"],
    linkedExecutionIds: [
      "test_execution_demo_landing_release_valid_email_passed",
      "test_execution_demo_landing_release_invalid_email_failed",
    ],
    linkedBugReportIds: ["bug_demo_landing_invalid_email_open"],
    linkedEvidenceIds: [
      "evidence_demo_invalid_email_screenshot",
      "evidence_demo_execution_cycle_url",
    ],
    summary:
      "As evidências mostram o comportamento do formulário e a referência do ciclo usado na validação.",
    risks: ["Uma evidência do ciclo ainda precisa de revisão para ficar pronta para comunicação externa."],
    recommendations: ["Revisar a referência do ciclo e anexar nova evidência após correção do formulário."],
    conclusion: "A base de evidências é suficiente para orientar o próximo reteste manual.",
    createdBy: "user_demo_qa_lead",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
];

export function isReportType(value: string): value is ReportType {
  return reportTypes.includes(value as ReportType);
}

export function isReportStatus(value: string): value is ReportStatus {
  return reportStatuses.includes(value as ReportStatus);
}

export function isReportScope(value: string): value is ReportScope {
  return reportScopes.includes(value as ReportScope);
}

function validateOptionalItems(items: string[] | undefined, errorCode: string): string[] {
  if (!items) {
    return [];
  }

  return items.some((item) => item.trim().length < 2) ? [errorCode] : [];
}

export function validateReportInput(input: ReportInput): string[] {
  const errors: string[] = [];

  if (input.projectId.trim().length === 0) {
    errors.push("report_project_required");
  }

  if (input.title.trim().length < 2) {
    errors.push("report_title_required");
  }

  if (input.description.trim().length < 2) {
    errors.push("report_description_required");
  }

  if (!isReportType(input.reportType)) {
    errors.push("invalid_report_type");
  }

  if (!isReportStatus(input.status)) {
    errors.push("invalid_report_status");
  }

  if (!isReportScope(input.scope)) {
    errors.push("invalid_report_scope");
  }

  if (input.summary.trim().length < 2) {
    errors.push("report_summary_required");
  }

  if (input.conclusion.trim().length < 2) {
    errors.push("report_conclusion_required");
  }

  if (
    input.createdBy !== undefined &&
    input.createdBy.trim().length > 0 &&
    input.createdBy.trim().length < 2
  ) {
    errors.push("report_created_by_required");
  }

  errors.push(...validateOptionalItems(input.risks, "report_risk_required"));
  errors.push(...validateOptionalItems(input.recommendations, "report_recommendation_required"));

  return errors;
}

export function listReportsByProject(
  projectId: string,
  reports: Report[] = demoReports,
): Report[] {
  return reports.filter((report) => report.projectId === projectId);
}

export function listReportsByType(
  projectId: string,
  reportType: ReportType,
  reports: Report[] = demoReports,
): Report[] {
  return reports.filter(
    (report) => report.projectId === projectId && report.reportType === reportType,
  );
}

export function listReportsByStatus(
  projectId: string,
  status: ReportStatus,
  reports: Report[] = demoReports,
): Report[] {
  return reports.filter((report) => report.projectId === projectId && report.status === status);
}

export function listReportsByCycle(cycleId: string, reports: Report[] = demoReports): Report[] {
  return reports.filter((report) => report.linkedCycleIds.includes(cycleId));
}

export function listReportsByExecution(
  executionId: string,
  reports: Report[] = demoReports,
): Report[] {
  return reports.filter((report) => report.linkedExecutionIds.includes(executionId));
}

export function listReportsByBugReport(
  bugReportId: string,
  reports: Report[] = demoReports,
): Report[] {
  return reports.filter((report) => report.linkedBugReportIds.includes(bugReportId));
}

export function listReportsByEvidence(
  evidenceId: string,
  reports: Report[] = demoReports,
): Report[] {
  return reports.filter((report) => report.linkedEvidenceIds.includes(evidenceId));
}

function cleanList(items: string[] | undefined): string[] {
  return items?.map((item) => item.trim()).filter(Boolean) ?? [];
}

export function createReport(input: ReportInput, now = new Date()): Report {
  const errors = validateReportInput(input);

  if (errors.length > 0) {
    throw new Error(errors.join(","));
  }

  const timestamp = now.toISOString();

  return {
    id: `report_${now.getTime()}`,
    projectId: input.projectId,
    title: input.title.trim(),
    description: input.description.trim(),
    reportType: input.reportType,
    status: input.status,
    scope: input.scope,
    linkedCycleIds: cleanList(input.linkedCycleIds),
    linkedExecutionIds: cleanList(input.linkedExecutionIds),
    linkedBugReportIds: cleanList(input.linkedBugReportIds),
    linkedEvidenceIds: cleanList(input.linkedEvidenceIds),
    summary: input.summary.trim(),
    risks: cleanList(input.risks),
    recommendations: cleanList(input.recommendations),
    conclusion: input.conclusion.trim(),
    createdBy: input.createdBy?.trim() ?? "",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateReport(
  report: Report,
  updates: Partial<ReportInput>,
  now = new Date(),
): Report {
  const nextReport: Report = {
    ...report,
    projectId: updates.projectId ?? report.projectId,
    title: updates.title?.trim() ?? report.title,
    description: updates.description?.trim() ?? report.description,
    reportType: updates.reportType ?? report.reportType,
    status: updates.status ?? report.status,
    scope: updates.scope ?? report.scope,
    linkedCycleIds: updates.linkedCycleIds ? cleanList(updates.linkedCycleIds) : report.linkedCycleIds,
    linkedExecutionIds: updates.linkedExecutionIds
      ? cleanList(updates.linkedExecutionIds)
      : report.linkedExecutionIds,
    linkedBugReportIds: updates.linkedBugReportIds
      ? cleanList(updates.linkedBugReportIds)
      : report.linkedBugReportIds,
    linkedEvidenceIds: updates.linkedEvidenceIds
      ? cleanList(updates.linkedEvidenceIds)
      : report.linkedEvidenceIds,
    summary: updates.summary?.trim() ?? report.summary,
    risks: updates.risks ? cleanList(updates.risks) : report.risks,
    recommendations: updates.recommendations
      ? cleanList(updates.recommendations)
      : report.recommendations,
    conclusion: updates.conclusion?.trim() ?? report.conclusion,
    createdBy: updates.createdBy?.trim() ?? report.createdBy,
    updatedAt: now.toISOString(),
  };

  const errors = validateReportInput(nextReport);

  if (errors.length > 0) {
    throw new Error(errors.join(","));
  }

  return nextReport;
}

export function countReportsByProject(
  projectId: string,
  reports: Report[] = demoReports,
): number {
  return listReportsByProject(projectId, reports).length;
}

export function countReportsByType(
  projectId: string,
  reportType: ReportType,
  reports: Report[] = demoReports,
): number {
  return listReportsByType(projectId, reportType, reports).length;
}

function createEmptyReportsByType(): Record<ReportType, number> {
  return reportTypes.reduce(
    (totals, reportType) => ({
      ...totals,
      [reportType]: 0,
    }),
    {} as Record<ReportType, number>,
  );
}

function createEmptyReportsByStatus(): Record<ReportStatus, number> {
  return reportStatuses.reduce(
    (totals, status) => ({
      ...totals,
      [status]: 0,
    }),
    {} as Record<ReportStatus, number>,
  );
}

export function getReportSummary(
  projectId: string,
  reports: Report[] = demoReports,
): ReportSummary {
  const projectReports = listReportsByProject(projectId, reports);
  const reportsByType = createEmptyReportsByType();
  const reportsByStatus = createEmptyReportsByStatus();

  projectReports.forEach((report) => {
    reportsByType[report.reportType] += 1;
    reportsByStatus[report.status] += 1;
  });

  return {
    totalReports: projectReports.length,
    draftReports: reportsByStatus.draft,
    readyReports: reportsByStatus.ready,
    reportsNeedingReview: reportsByStatus.needs_review,
    archivedReports: reportsByStatus.archived,
    qaStatusReports: reportsByType.qa_status,
    executionSummaryReports: reportsByType.execution_summary,
    bugSummaryReports: reportsByType.bug_summary,
    evidenceSummaryReports: reportsByType.evidence_summary,
    releaseReviewReports: reportsByType.release_review,
    stakeholderUpdateReports: reportsByType.stakeholder_update,
    linkedCycleReports: projectReports.filter((report) => report.linkedCycleIds.length > 0).length,
    linkedExecutionReports: projectReports.filter(
      (report) => report.linkedExecutionIds.length > 0,
    ).length,
    linkedBugReports: projectReports.filter((report) => report.linkedBugReportIds.length > 0)
      .length,
    linkedEvidenceReports: projectReports.filter((report) => report.linkedEvidenceIds.length > 0)
      .length,
    reportsByType,
    reportsByStatus,
  };
}

export function buildReportSnapshot(
  projectId: string,
  reports: Report[] = demoReports,
  projects: Project[] = demoProjects,
  testCycles: TestCycle[] = demoTestCycles,
  testExecutions: TestExecution[] = demoTestExecutions,
  bugReports: BugReport[] = demoBugReports,
  evidence: Evidence[] = demoEvidence,
): ReportSnapshot {
  const project = projects.find((item) => item.id === projectId) ?? null;
  const executionSummary = getTestExecutionSummary(projectId, testExecutions);
  const bugSummary = getBugReportSummary(projectId, bugReports);
  const evidenceSummary = getEvidenceSummary(projectId, evidence);
  const projectCycles = listTestCyclesByProject(projectId, testCycles);

  return {
    project,
    executionSummary: {
      totalExecutions: executionSummary.totalExecutions,
      passedExecutions: executionSummary.passedExecutions,
      failedExecutions: executionSummary.failedExecutions,
      blockedExecutions: executionSummary.blockedExecutions,
      skippedExecutions: executionSummary.skippedExecutions,
      notRunExecutions: executionSummary.notRunExecutions,
    },
    bugSummary: {
      totalBugs: bugSummary.totalBugs,
      openBugs: bugSummary.openBugs,
      criticalBugs: bugSummary.criticalBugs,
    },
    evidenceSummary: {
      totalEvidence: evidenceSummary.totalEvidence,
      attachedEvidence: evidenceSummary.attachedEvidence,
      evidenceNeedingReview: evidenceSummary.evidenceNeedingReview,
    },
    totalCycles: projectCycles.length,
    totalExecutions: executionSummary.totalExecutions,
    totalBugs: bugSummary.totalBugs,
    totalEvidence: evidenceSummary.totalEvidence,
    openBugs: bugSummary.openBugs,
    criticalBugs: bugSummary.criticalBugs,
    attachedEvidence: evidenceSummary.attachedEvidence,
    reportsCount: countReportsByProject(projectId, reports),
  };
}

export function getReportTraceability(
  reportId: string,
  reports: Report[] = demoReports,
  projects: Project[] = demoProjects,
  testCycles: TestCycle[] = demoTestCycles,
  testExecutions: TestExecution[] = demoTestExecutions,
  bugReports: BugReport[] = demoBugReports,
  evidence: Evidence[] = demoEvidence,
): ReportTraceability {
  const report = reports.find((item) => item.id === reportId) ?? null;

  return {
    project: report ? projects.find((project) => project.id === report.projectId) ?? null : null,
    report,
    testCycles: report
      ? testCycles.filter((testCycle) => report.linkedCycleIds.includes(testCycle.id))
      : [],
    testExecutions: report
      ? testExecutions.filter((execution) => report.linkedExecutionIds.includes(execution.id))
      : [],
    bugReports: report
      ? bugReports.filter((bugReport) => report.linkedBugReportIds.includes(bugReport.id))
      : [],
    evidence: report ? evidence.filter((item) => report.linkedEvidenceIds.includes(item.id)) : [],
  };
}

export function getProjectReportTraceability(
  projectId: string,
  reports: Report[] = demoReports,
  projects: Project[] = demoProjects,
  testCycles: TestCycle[] = demoTestCycles,
  testExecutions: TestExecution[] = demoTestExecutions,
  bugReports: BugReport[] = demoBugReports,
  evidence: Evidence[] = demoEvidence,
): ProjectReportTraceability {
  const project = projects.find((item) => item.id === projectId) ?? null;
  const projectReports = listReportsByProject(projectId, reports);

  return {
    project,
    reports: projectReports,
    reportTraceability: projectReports.map((report) =>
      getReportTraceability(report.id, reports, projects, testCycles, testExecutions, bugReports, evidence),
    ),
    reportCount: projectReports.length,
  };
}

export function getBugReportReportTraceability(
  bugReportId: string,
  reports: Report[] = demoReports,
  bugReports: BugReport[] = demoBugReports,
  projects: Project[] = demoProjects,
  testCycles: TestCycle[] = demoTestCycles,
  testExecutions: TestExecution[] = demoTestExecutions,
  evidence: Evidence[] = demoEvidence,
): BugReportReportTraceability {
  const bugReport = bugReports.find((item) => item.id === bugReportId) ?? null;
  const linkedReports = listReportsByBugReport(bugReportId, reports);

  return {
    bugReport,
    reports: linkedReports,
    reportTraceability: linkedReports.map((report) =>
      getReportTraceability(report.id, reports, projects, testCycles, testExecutions, bugReports, evidence),
    ),
    reportCount: linkedReports.length,
  };
}

export function getEvidenceReportTraceability(
  evidenceId: string,
  reports: Report[] = demoReports,
  evidence: Evidence[] = demoEvidence,
  projects: Project[] = demoProjects,
  testCycles: TestCycle[] = demoTestCycles,
  testExecutions: TestExecution[] = demoTestExecutions,
  bugReports: BugReport[] = demoBugReports,
): EvidenceReportTraceability {
  const evidenceItem = evidence.find((item) => item.id === evidenceId) ?? null;
  const linkedReports = listReportsByEvidence(evidenceId, reports);

  return {
    evidence: evidenceItem,
    reports: linkedReports,
    reportTraceability: linkedReports.map((report) =>
      getReportTraceability(report.id, reports, projects, testCycles, testExecutions, bugReports, evidence),
    ),
    reportCount: linkedReports.length,
  };
}
