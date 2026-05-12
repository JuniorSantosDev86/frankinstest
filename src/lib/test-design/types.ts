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

export type ScenarioDesignSummary = {
  totalScenarios: number;
  readyScenarios: number;
  scenariosNeedingReview: number;
  criticalScenarios: number;
  aiGeneratedScenarios: number;
  scenariosByType: Record<ScenarioType, number>;
};

export type BusinessRuleScenarioTraceability = {
  businessRule: BusinessRule | null;
  scenarios: TestScenario[];
  scenarioCount: number;
};

export type ScenarioTraceability = {
  project: Project | null;
  module: ProductModule | null;
  requirement: Requirement | null;
  businessRule: BusinessRule | null;
  scenario: TestScenario | null;
};
