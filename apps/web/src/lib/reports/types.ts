import type { BugReport } from "@/lib/bugs/types";
import type { Evidence } from "@/lib/evidence/types";
import type { Project } from "@/lib/projects/types";
import type { TestCycle, TestExecution } from "@/lib/test-design/types";

export const reportTypes = [
  "qa_status",
  "execution_summary",
  "bug_summary",
  "evidence_summary",
  "release_review",
  "stakeholder_update",
] as const;

export type ReportType = (typeof reportTypes)[number];

export const reportStatuses = ["draft", "ready", "needs_review", "archived"] as const;

export type ReportStatus = (typeof reportStatuses)[number];

export const reportScopes = ["project", "cycle", "bug", "evidence", "mixed"] as const;

export type ReportScope = (typeof reportScopes)[number];

export type Report = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  reportType: ReportType;
  status: ReportStatus;
  scope: ReportScope;
  linkedCycleIds: string[];
  linkedExecutionIds: string[];
  linkedBugReportIds: string[];
  linkedEvidenceIds: string[];
  summary: string;
  risks: string[];
  recommendations: string[];
  conclusion: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type ReportInput = {
  projectId: string;
  title: string;
  description: string;
  reportType: ReportType;
  status: ReportStatus;
  scope: ReportScope;
  linkedCycleIds?: string[];
  linkedExecutionIds?: string[];
  linkedBugReportIds?: string[];
  linkedEvidenceIds?: string[];
  summary: string;
  risks?: string[];
  recommendations?: string[];
  conclusion: string;
  createdBy?: string;
};

export type ReportSummary = {
  totalReports: number;
  draftReports: number;
  readyReports: number;
  reportsNeedingReview: number;
  archivedReports: number;
  qaStatusReports: number;
  executionSummaryReports: number;
  bugSummaryReports: number;
  evidenceSummaryReports: number;
  releaseReviewReports: number;
  stakeholderUpdateReports: number;
  linkedCycleReports: number;
  linkedExecutionReports: number;
  linkedBugReports: number;
  linkedEvidenceReports: number;
  reportsByType: Record<ReportType, number>;
  reportsByStatus: Record<ReportStatus, number>;
};

export type ReportSnapshot = {
  project: Project | null;
  executionSummary: {
    totalExecutions: number;
    passedExecutions: number;
    failedExecutions: number;
    blockedExecutions: number;
    skippedExecutions: number;
    notRunExecutions: number;
  };
  bugSummary: {
    totalBugs: number;
    openBugs: number;
    criticalBugs: number;
  };
  evidenceSummary: {
    totalEvidence: number;
    attachedEvidence: number;
    evidenceNeedingReview: number;
  };
  totalCycles: number;
  totalExecutions: number;
  totalBugs: number;
  totalEvidence: number;
  openBugs: number;
  criticalBugs: number;
  attachedEvidence: number;
  reportsCount: number;
};

export type ReportTraceability = {
  project: Project | null;
  report: Report | null;
  testCycles: TestCycle[];
  testExecutions: TestExecution[];
  bugReports: BugReport[];
  evidence: Evidence[];
};

export type ProjectReportTraceability = {
  project: Project | null;
  reports: Report[];
  reportTraceability: ReportTraceability[];
  reportCount: number;
};

export type BugReportReportTraceability = {
  bugReport: BugReport | null;
  reports: Report[];
  reportTraceability: ReportTraceability[];
  reportCount: number;
};

export type EvidenceReportTraceability = {
  evidence: Evidence | null;
  reports: Report[];
  reportTraceability: ReportTraceability[];
  reportCount: number;
};
