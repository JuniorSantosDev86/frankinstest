// ---- Request types (match OpenAPI contract) ----

export type AiTestDesignEstimateRequest = {
  organizationId: string;
  projectId: string;
  generationType: "scenarios_from_business_rule" | "test_cases_from_scenario";
  sourceArtifactId: string;
  context?: string;
};

export type GenerateScenariosRequest = {
  organizationId: string;
  projectId: string;
  businessRuleId: string;
  confirmedEstimatedCredits: number;
  context?: string;
};

export type GenerateTestCasesRequest = {
  organizationId: string;
  projectId: string;
  scenarioId: string;
  confirmedEstimatedCredits: number;
  context?: string;
};

// ---- Response types ----

export type AiTestDesignEstimateResponse = {
  estimatedCredits: number;
  pricingNote: string;
  expiresAt: string;
};

export type GeneratedQaArtifact = {
  id: string;
  title: string;
  description?: string;
  status: "draft";
  aiAssisted: true;
};

export type AiGenerationResult = {
  aiRunId: string;
  status: "completed";
  outputArtifactType: "test_scenario" | "test_case";
  artifacts: GeneratedQaArtifact[];
  consumedCredits: number;
  creditNote?: string;
};

export type AiRunStatus = {
  aiRunId: string;
  status: "estimated" | "reserved" | "running" | "completed" | "failed" | "cancelled";
  estimatedCredits: number;
  consumedCredits: number;
  failureCategory?: string | null;
  outputArtifactType?: string | null;
  outputArtifactIds?: string[];
};

export type ApiError = {
  code: string;
  message: string;
  aiRunId?: string | null;
};

// ---- UI state machine ----

export type AiGenerationState =
  | { phase: "idle" }
  | { phase: "estimating" }
  | { phase: "estimated"; estimatedCredits: number; pricingNote: string; expiresAt: string }
  | { phase: "generating" }
  | { phase: "completed"; result: AiGenerationResult }
  | { phase: "error"; message: string; aiRunId?: string };
