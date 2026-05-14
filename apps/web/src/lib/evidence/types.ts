import type { BugReport } from "@/lib/bugs/types";
import type { BusinessRule, ProductModule, Requirement } from "@/lib/business-understanding/types";
import type { Project } from "@/lib/projects/types";
import type {
  TestCase,
  TestCycle,
  TestExecution,
  TestScenario,
  TestSuite,
} from "@/lib/test-design/types";

export const evidenceTypes = ["screenshot", "video", "log", "document", "url", "note"] as const;

export type EvidenceType = (typeof evidenceTypes)[number];

export const evidenceSources = ["manual", "execution", "bug_report", "imported"] as const;

export type EvidenceSource = (typeof evidenceSources)[number];

export const evidenceStatuses = ["draft", "attached", "needs_review", "archived"] as const;

export type EvidenceStatus = (typeof evidenceStatuses)[number];

export type Evidence = {
  id: string;
  projectId: string;
  bugReportId: string;
  executionId: string;
  title: string;
  description: string;
  evidenceType: EvidenceType;
  source: EvidenceSource;
  reference: string;
  status: EvidenceStatus;
  capturedBy: string;
  capturedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type EvidenceInput = {
  projectId: string;
  bugReportId?: string;
  executionId?: string;
  title: string;
  description: string;
  evidenceType: EvidenceType;
  source: EvidenceSource;
  reference: string;
  status: EvidenceStatus;
  capturedBy?: string;
  capturedAt?: string;
};

export type EvidenceSummary = {
  totalEvidence: number;
  screenshotEvidence: number;
  videoEvidence: number;
  logEvidence: number;
  documentEvidence: number;
  urlEvidence: number;
  noteEvidence: number;
  attachedEvidence: number;
  evidenceNeedingReview: number;
  linkedToBugEvidence: number;
  linkedToExecutionEvidence: number;
  evidenceByType: Record<EvidenceType, number>;
  evidenceByStatus: Record<EvidenceStatus, number>;
};

export type EvidenceTraceability = {
  project: Project | null;
  module: ProductModule | null;
  requirement: Requirement | null;
  businessRule: BusinessRule | null;
  scenario: TestScenario | null;
  testCase: TestCase | null;
  testSuite: TestSuite | null;
  testCycle: TestCycle | null;
  execution: TestExecution | null;
  bugReport: BugReport | null;
  evidence: Evidence | null;
};

export type BugEvidenceTraceability = {
  bugReport: BugReport | null;
  evidence: Evidence[];
  evidenceTraceability: EvidenceTraceability[];
  evidenceCount: number;
};

export type ExecutionEvidenceTraceability = {
  execution: TestExecution | null;
  evidence: Evidence[];
  evidenceTraceability: EvidenceTraceability[];
  evidenceCount: number;
};
