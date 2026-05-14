import type { BusinessRule, ProductModule, Requirement } from "@/lib/business-understanding/types";
import type { Project } from "@/lib/projects/types";
import type {
  TestCase,
  TestCycle,
  TestExecution,
  TestSuite,
  TestScenario,
} from "@/lib/test-design/types";

export const bugSeverities = ["low", "medium", "high", "critical"] as const;

export type BugSeverity = (typeof bugSeverities)[number];

export const bugPriorities = ["low", "medium", "high", "critical"] as const;

export type BugPriority = (typeof bugPriorities)[number];

export const bugStatuses = [
  "draft",
  "open",
  "in_progress",
  "retest",
  "resolved",
  "closed",
  "rejected",
] as const;

export type BugStatus = (typeof bugStatuses)[number];

export type BugReport = {
  id: string;
  projectId: string;
  moduleId: string;
  executionId: string;
  title: string;
  description: string;
  stepsToReproduce: string[];
  actualResult: string;
  expectedResult: string;
  severity: BugSeverity;
  priority: BugPriority;
  status: BugStatus;
  environment: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type BugReportInput = {
  projectId: string;
  moduleId: string;
  executionId?: string;
  title: string;
  description: string;
  stepsToReproduce: string[];
  actualResult: string;
  expectedResult: string;
  severity: BugSeverity;
  priority: BugPriority;
  status: BugStatus;
  environment: string;
  createdBy?: string;
};

export type BugReportSummary = {
  totalBugs: number;
  draftBugs: number;
  openBugs: number;
  inProgressBugs: number;
  retestBugs: number;
  resolvedBugs: number;
  closedBugs: number;
  rejectedBugs: number;
  criticalBugs: number;
  highBugs: number;
  linkedToExecutionBugs: number;
  bugsByStatus: Record<BugStatus, number>;
  bugsBySeverity: Record<BugSeverity, number>;
};

export type BugReportTraceability = {
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
};

export type ExecutionBugTraceability = {
  execution: TestExecution | null;
  bugReports: BugReport[];
  bugReportTraceability: BugReportTraceability[];
  bugCount: number;
};

export type ModuleBugTraceability = {
  project: Project | null;
  module: ProductModule | null;
  bugReports: BugReport[];
  bugReportTraceability: BugReportTraceability[];
  bugCount: number;
};
