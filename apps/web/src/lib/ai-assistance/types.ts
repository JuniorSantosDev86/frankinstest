export type AiEstimateRequest = {
  feature: string;
  context: string;
};

export type AiEstimateResponse = {
  estimatedCredits: number;
  pricingNote: string;
};

export type AiGenerateScenariosRequest = {
  organizationId?: string;
  projectId: string;
  userId?: string;
  businessRuleId: string;
  businessRuleTitle: string;
  context?: string;
};

export type AiGenerateTestCasesRequest = {
  organizationId?: string;
  projectId: string;
  userId?: string;
  scenarioId: string;
  scenarioTitle: string;
  context?: string;
};

export type AiRunResult = {
  aiRunId: string;
  status: "completed" | "failed" | "processing";
  outputArtifactType: "test_scenario" | "test_case" | null;
  output: string | null;
  consumedCredits: number;
  errorMessage: string | null;
};

export type AiGenerationState =
  | { phase: "idle" }
  | { phase: "estimating" }
  | { phase: "estimated"; estimatedCredits: number; pricingNote: string }
  | { phase: "generating" }
  | { phase: "completed"; result: AiRunResult }
  | { phase: "error"; message: string };
