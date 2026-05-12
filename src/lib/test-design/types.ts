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
