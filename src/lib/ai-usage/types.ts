import type { Project } from "@/lib/projects/types";

export const aiFeatures = [
  "vulnerability_checkup",
  "test_case_generation",
  "bug_summary",
  "report_assist",
  "drift_analysis",
  "business_rule_analysis",
  "automation_suggestion",
  "requirement_review",
] as const;

export type AiFeature = (typeof aiFeatures)[number];

export const aiInputArtifactTypes = [
  "project",
  "module",
  "requirement",
  "business_rule",
  "scenario",
  "test_case",
  "suite",
  "cycle",
  "execution",
  "bug",
  "evidence",
  "report",
  "url",
  "mixed",
] as const;

export type AiInputArtifactType = (typeof aiInputArtifactTypes)[number];

export const aiRunStatuses = [
  "estimated",
  "queued",
  "running",
  "completed",
  "failed",
  "cancelled",
] as const;

export type AiRunStatus = (typeof aiRunStatuses)[number];

export const aiProviders = ["mock", "openai", "anthropic", "google", "other"] as const;

export type AiProvider = (typeof aiProviders)[number];

export const aiCreditTransactionTypes = [
  "grant",
  "reserve",
  "charge",
  "refund",
  "adjustment",
] as const;

export type AiCreditTransactionType = (typeof aiCreditTransactionTypes)[number];

export const aiCreditTransactionStatuses = ["pending", "completed", "cancelled"] as const;

export type AiCreditTransactionStatus = (typeof aiCreditTransactionStatuses)[number];

export type AiRun = {
  id: string;
  projectId: string;
  feature: AiFeature;
  inputArtifactType: AiInputArtifactType;
  inputArtifactIds: string[];
  promptSummary: string;
  status: AiRunStatus;
  provider: AiProvider;
  model: string;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  actualInputTokens: number | null;
  actualOutputTokens: number | null;
  estimatedCredits: number;
  chargedCredits: number;
  requestedBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string;
  errorMessage: string;
};

export type AiCreditBalance = {
  projectId: string;
  includedCredits: number;
  purchasedCredits: number;
  reservedCredits: number;
  usedCredits: number;
  availableCredits: number;
  updatedAt: string;
};

export type AiCreditTransaction = {
  id: string;
  projectId: string;
  aiRunId: string;
  transactionType: AiCreditTransactionType;
  status: AiCreditTransactionStatus;
  credits: number;
  reason: string;
  createdAt: string;
};

export type AiRunInput = {
  projectId: string;
  feature: AiFeature;
  inputArtifactType: AiInputArtifactType;
  inputArtifactIds: string[];
  promptSummary: string;
  requestedBy?: string;
};

export type AiRunEstimateInput = {
  feature: AiFeature;
  inputText: string;
  artifactCount: number;
};

export type AiCreditEstimate = {
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedTotalTokens: number;
  estimatedCredits: number;
  pricingNote: string;
};

export type AiUsageSummary = {
  totalRuns: number;
  estimatedRuns: number;
  queuedRuns: number;
  runningRuns: number;
  completedRuns: number;
  failedRuns: number;
  cancelledRuns: number;
  totalEstimatedCredits: number;
  totalChargedCredits: number;
  includedCredits: number;
  purchasedCredits: number;
  usedCredits: number;
  reservedCredits: number;
  availableCredits: number;
  runsByFeature: Record<AiFeature, number>;
  runsByStatus: Record<AiRunStatus, number>;
  transactionsCount: number;
};

export type AiRunTraceability = {
  project: Project | null;
  aiRun: AiRun | null;
  transactions: AiCreditTransaction[];
  relatedArtifactIds: string[];
  artifactType: AiInputArtifactType | null;
};

export type ProjectAiUsageTraceability = {
  project: Project | null;
  aiRuns: AiRun[];
  transactions: AiCreditTransaction[];
  aiRunTraceability: AiRunTraceability[];
  runCount: number;
  transactionCount: number;
};
