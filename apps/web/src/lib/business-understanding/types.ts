export const moduleCriticalities = ["low", "medium", "high", "critical"] as const;

export type ModuleCriticality = (typeof moduleCriticalities)[number];

export const moduleStatuses = ["active", "deprecated", "planned"] as const;

export type ModuleStatus = (typeof moduleStatuses)[number];

export const requirementSources = [
  "user_input",
  "documentation",
  "stakeholder",
  "ai_draft",
  "imported",
] as const;

export type RequirementSource = (typeof requirementSources)[number];

export const requirementStatuses = ["draft", "active", "needs_review", "archived"] as const;

export type RequirementStatus = (typeof requirementStatuses)[number];

export const businessRulePriorities = ["low", "medium", "high", "critical"] as const;

export type BusinessRulePriority = (typeof businessRulePriorities)[number];

export const businessRuleStatuses = ["draft", "active", "needs_review", "archived"] as const;

export type BusinessRuleStatus = (typeof businessRuleStatuses)[number];

export type ProductModule = {
  id: string;
  projectId: string;
  name: string;
  description: string;
  criticality: ModuleCriticality;
  status: ModuleStatus;
  createdAt: string;
  updatedAt: string;
};

export type ProductModuleInput = {
  projectId: string;
  name: string;
  description?: string;
  criticality?: ModuleCriticality;
  status?: ModuleStatus;
};

export type Requirement = {
  id: string;
  projectId: string;
  moduleId: string;
  title: string;
  description: string;
  source: RequirementSource;
  status: RequirementStatus;
  aiGenerated: boolean;
  reviewedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type RequirementInput = {
  projectId: string;
  moduleId: string;
  title: string;
  description?: string;
  source?: RequirementSource;
  status?: RequirementStatus;
  aiGenerated?: boolean;
  reviewedBy?: string;
};

export type BusinessRule = {
  id: string;
  projectId: string;
  moduleId: string;
  requirementId: string;
  title: string;
  ruleText: string;
  priority: BusinessRulePriority;
  status: BusinessRuleStatus;
  aiGenerated: boolean;
  reviewedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type BusinessRuleInput = {
  projectId: string;
  moduleId: string;
  requirementId: string;
  title: string;
  ruleText: string;
  priority?: BusinessRulePriority;
  status?: BusinessRuleStatus;
  aiGenerated?: boolean;
  reviewedBy?: string;
};

export type ModuleTraceability = {
  module: ProductModule;
  requirementCount: number;
  businessRuleCount: number;
};

export type RequirementTraceability = {
  requirement: Requirement | null;
  businessRules: BusinessRule[];
  businessRuleCount: number;
};

export type BusinessUnderstandingSummary = {
  totalModules: number;
  totalRequirements: number;
  totalBusinessRules: number;
  criticalModules: number;
  requirementsNeedingReview: number;
  businessRulesNeedingReview: number;
};
