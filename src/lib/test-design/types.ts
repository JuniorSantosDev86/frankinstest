import type { BusinessRule, ProductModule, Requirement } from "@/lib/business-understanding/types";
import type { Project } from "@/lib/projects/types";

export const scenarioTypes = [
  "positive",
  "negative",
  "edge_case",
  "regression",
  "exploratory",
  "security",
  "accessibility",
  "performance",
  "integration",
] as const;

export type ScenarioType = (typeof scenarioTypes)[number];

export const scenarioPriorities = ["low", "medium", "high", "critical"] as const;

export type ScenarioPriority = (typeof scenarioPriorities)[number];

export const scenarioStatuses = ["draft", "ready", "needs_review", "archived"] as const;

export type ScenarioStatus = (typeof scenarioStatuses)[number];

export const testLevels = [
  "unit",
  "integration",
  "api",
  "e2e",
  "system",
  "acceptance",
  "exploratory",
] as const;

export type TestLevel = (typeof testLevels)[number];

export const testCasePriorities = ["low", "medium", "high", "critical"] as const;

export type TestCasePriority = (typeof testCasePriorities)[number];

export const testCaseStatuses = ["draft", "ready", "needs_review", "archived"] as const;

export type TestCaseStatus = (typeof testCaseStatuses)[number];

export const testCaseAutomationStatuses = [
  "not_automated",
  "automation_candidate",
  "automated",
  "not_applicable",
] as const;

export type TestCaseAutomationStatus = (typeof testCaseAutomationStatuses)[number];

export const testSuiteTypes = [
  "smoke",
  "regression",
  "release",
  "feature",
  "exploratory",
  "api",
  "mobile",
  "security",
  "accessibility",
  "performance",
] as const;

export type TestSuiteType = (typeof testSuiteTypes)[number];

export const testSuiteStatuses = ["draft", "ready", "needs_review", "archived"] as const;

export type TestSuiteStatus = (typeof testSuiteStatuses)[number];

export const testSuitePriorities = ["low", "medium", "high", "critical"] as const;

export type TestSuitePriority = (typeof testSuitePriorities)[number];

export const testCycleStatuses = [
  "draft",
  "planned",
  "active",
  "completed",
  "archived",
] as const;

export type TestCycleStatus = (typeof testCycleStatuses)[number];

export const testCyclePriorities = ["low", "medium", "high", "critical"] as const;

export type TestCyclePriority = (typeof testCyclePriorities)[number];

export const testExecutionStatuses = [
  "not_run",
  "passed",
  "failed",
  "blocked",
  "skipped",
] as const;

export type TestExecutionStatus = (typeof testExecutionStatuses)[number];

export type TestScenario = {
  id: string;
  projectId: string;
  moduleId: string;
  requirementId: string;
  businessRuleId: string;
  title: string;
  description: string;
  scenarioType: ScenarioType;
  priority: ScenarioPriority;
  status: ScenarioStatus;
  testLevel: TestLevel;
  aiGenerated: boolean;
  reviewedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type TestExecution = {
  id: string;
  projectId: string;
  cycleId: string;
  testSuiteId: string;
  testCaseId: string;
  status: TestExecutionStatus;
  notes: string;
  executedBy: string;
  executedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type TestCase = {
  id: string;
  projectId: string;
  moduleId: string;
  requirementId: string;
  businessRuleId: string;
  scenarioId: string;
  title: string;
  objective: string;
  precondition: string;
  steps: string[];
  expectedResult: string;
  priority: TestCasePriority;
  status: TestCaseStatus;
  testLevel: TestLevel;
  automationStatus: TestCaseAutomationStatus;
  aiGenerated: boolean;
  reviewedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type TestSuite = {
  id: string;
  projectId: string;
  name: string;
  description: string;
  suiteType: TestSuiteType;
  status: TestSuiteStatus;
  priority: TestSuitePriority;
  testCaseIds: string[];
  owner: string;
  createdAt: string;
  updatedAt: string;
};

export type TestCycle = {
  id: string;
  projectId: string;
  name: string;
  objective: string;
  status: TestCycleStatus;
  priority: TestCyclePriority;
  testSuiteIds: string[];
  owner: string;
  plannedStartAt: string;
  plannedEndAt: string;
  createdAt: string;
  updatedAt: string;
};

export type TestScenarioInput = {
  projectId: string;
  moduleId: string;
  requirementId: string;
  businessRuleId: string;
  title: string;
  description?: string;
  scenarioType?: ScenarioType;
  priority?: ScenarioPriority;
  status?: ScenarioStatus;
  testLevel?: TestLevel;
  aiGenerated?: boolean;
  reviewedBy?: string;
};

export type TestCaseInput = {
  projectId: string;
  moduleId: string;
  requirementId: string;
  businessRuleId: string;
  scenarioId: string;
  title: string;
  objective: string;
  precondition?: string;
  steps: string[];
  expectedResult: string;
  priority?: TestCasePriority;
  status?: TestCaseStatus;
  testLevel?: TestLevel;
  automationStatus?: TestCaseAutomationStatus;
  aiGenerated?: boolean;
  reviewedBy?: string;
};

export type TestSuiteInput = {
  projectId: string;
  name: string;
  description?: string;
  suiteType?: TestSuiteType;
  status?: TestSuiteStatus;
  priority?: TestSuitePriority;
  testCaseIds: string[];
  owner?: string;
};

export type TestCycleInput = {
  projectId: string;
  name: string;
  objective: string;
  status?: TestCycleStatus;
  priority?: TestCyclePriority;
  testSuiteIds: string[];
  owner?: string;
  plannedStartAt?: string;
  plannedEndAt?: string;
};

export type TestExecutionInput = {
  projectId: string;
  cycleId: string;
  testSuiteId: string;
  testCaseId: string;
  status: TestExecutionStatus;
  notes?: string;
  executedBy?: string;
  executedAt?: string;
};

export type ScenarioDesignSummary = {
  totalScenarios: number;
  readyScenarios: number;
  scenariosNeedingReview: number;
  criticalScenarios: number;
  aiGeneratedScenarios: number;
  scenariosByType: Record<ScenarioType, number>;
};

export type TestCaseDesignSummary = {
  totalTestCases: number;
  readyTestCases: number;
  testCasesNeedingReview: number;
  criticalTestCases: number;
  automationCandidates: number;
  automatedTestCases: number;
  aiGeneratedTestCases: number;
  testCasesByAutomationStatus: Record<TestCaseAutomationStatus, number>;
};

export type TestSuiteSummary = {
  totalSuites: number;
  readySuites: number;
  suitesNeedingReview: number;
  criticalSuites: number;
  archivedSuites: number;
  totalLinkedTestCases: number;
  suitesByType: Record<TestSuiteType, number>;
};

export type TestCycleSummary = {
  totalCycles: number;
  draftCycles: number;
  plannedCycles: number;
  activeCycles: number;
  completedCycles: number;
  archivedCycles: number;
  criticalCycles: number;
  totalLinkedSuites: number;
  cyclesByStatus: Record<TestCycleStatus, number>;
};

export type TestExecutionSummary = {
  totalExecutions: number;
  notRunExecutions: number;
  passedExecutions: number;
  failedExecutions: number;
  blockedExecutions: number;
  skippedExecutions: number;
  executedExecutions: number;
  completionRate: number;
  passRate: number;
  executionsByStatus: Record<TestExecutionStatus, number>;
};

export type TestCycleExecutionSummary = Omit<
  TestExecutionSummary,
  "executedExecutions" | "executionsByStatus"
>;

export type BusinessRuleScenarioTraceability = {
  businessRule: BusinessRule | null;
  scenarios: TestScenario[];
  scenarioCount: number;
};

export type ScenarioTestCaseTraceability = {
  scenario: TestScenario | null;
  testCases: TestCase[];
  testCaseCount: number;
};

export type ScenarioTraceability = {
  project: Project | null;
  module: ProductModule | null;
  requirement: Requirement | null;
  businessRule: BusinessRule | null;
  scenario: TestScenario | null;
};

export type TestCaseTraceability = {
  project: Project | null;
  module: ProductModule | null;
  requirement: Requirement | null;
  businessRule: BusinessRule | null;
  scenario: TestScenario | null;
  testCase: TestCase | null;
};

export type TestSuiteTraceability = {
  project: Project | null;
  testSuite: TestSuite | null;
  testCases: TestCase[];
  testCaseTraceability: TestCaseTraceability[];
};

export type TestCycleTraceability = {
  project: Project | null;
  testCycle: TestCycle | null;
  testSuites: TestSuite[];
  testSuiteTraceability: TestSuiteTraceability[];
};

export type TestSuiteCycleTraceability = {
  project: Project | null;
  testSuite: TestSuite | null;
  testCases: TestCase[];
  testCaseTraceability: TestCaseTraceability[];
  testCycles: TestCycle[];
  cycleCount: number;
};

export type TestCaseSuiteTraceability = {
  project: Project | null;
  module: ProductModule | null;
  requirement: Requirement | null;
  businessRule: BusinessRule | null;
  scenario: TestScenario | null;
  testCase: TestCase | null;
  testSuites: TestSuite[];
  suiteCount: number;
};

export type TestExecutionTraceability = {
  project: Project | null;
  module: ProductModule | null;
  requirement: Requirement | null;
  businessRule: BusinessRule | null;
  scenario: TestScenario | null;
  testCase: TestCase | null;
  testSuite: TestSuite | null;
  testCycle: TestCycle | null;
  testExecution: TestExecution | null;
};

export type TestCaseExecutionTraceability = {
  project: Project | null;
  module: ProductModule | null;
  requirement: Requirement | null;
  businessRule: BusinessRule | null;
  scenario: TestScenario | null;
  testCase: TestCase | null;
  testSuites: TestSuite[];
  testCycles: TestCycle[];
  testExecutions: TestExecution[];
  executionCount: number;
};

export type CycleExecutionTraceability = {
  project: Project | null;
  testCycle: TestCycle | null;
  testSuites: TestSuite[];
  testCases: TestCase[];
  testExecutions: TestExecution[];
  testExecutionTraceability: TestExecutionTraceability[];
};
