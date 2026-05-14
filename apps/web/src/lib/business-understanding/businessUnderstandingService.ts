import {
  businessRulePriorities,
  businessRuleStatuses,
  moduleCriticalities,
  moduleStatuses,
  requirementSources,
  requirementStatuses,
  type BusinessRule,
  type BusinessRuleInput,
  type BusinessRulePriority,
  type BusinessRuleStatus,
  type BusinessUnderstandingSummary,
  type ModuleCriticality,
  type ModuleStatus,
  type ModuleTraceability,
  type ProductModule,
  type ProductModuleInput,
  type Requirement,
  type RequirementInput,
  type RequirementSource,
  type RequirementStatus,
  type RequirementTraceability,
} from "./types";

const demoTimestamp = "2026-05-12T09:00:00.000Z";

export const demoProductModules: ProductModule[] = [
  {
    id: "module_demo_landing_conversion",
    projectId: "project_demo_landing",
    name: "Captura e conversao",
    description: "Promessa principal, CTA, formulario de lead e sinais de confianca.",
    criticality: "high",
    status: "active",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
  {
    id: "module_demo_landing_responsive",
    projectId: "project_demo_landing",
    name: "Experiencia responsiva",
    description: "Comportamento visual em mobile, tablet e desktop antes de campanha paga.",
    criticality: "medium",
    status: "active",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
  {
    id: "module_demo_saas_auth",
    projectId: "project_demo_saas",
    name: "Autenticacao e acesso",
    description: "Entrada, sessao local, permissoes e fronteiras de acesso por workspace.",
    criticality: "critical",
    status: "active",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
  {
    id: "module_demo_saas_dashboard",
    projectId: "project_demo_saas",
    name: "Dashboard operacional",
    description: "Visao inicial, estados vazios, sinais de risco e prontidao de release.",
    criticality: "high",
    status: "planned",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
];

export const demoRequirements: Requirement[] = [
  {
    id: "requirement_demo_landing_form",
    projectId: "project_demo_landing",
    moduleId: "module_demo_landing_conversion",
    title: "Formulario deve capturar leads validos",
    description: "O formulario precisa exigir dados minimos antes de aceitar um lead.",
    source: "stakeholder",
    status: "active",
    aiGenerated: false,
    reviewedBy: "user_demo_qa_lead",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
  {
    id: "requirement_demo_landing_mobile",
    projectId: "project_demo_landing",
    moduleId: "module_demo_landing_responsive",
    title: "CTA principal deve permanecer visivel em mobile",
    description: "A chamada para acao precisa ser encontravel sem bloquear leitura do conteudo.",
    source: "documentation",
    status: "needs_review",
    aiGenerated: true,
    reviewedBy: "",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
  {
    id: "requirement_demo_saas_session",
    projectId: "project_demo_saas",
    moduleId: "module_demo_saas_auth",
    title: "Usuario deve acessar apenas seu workspace",
    description: "A sessao demo deve respeitar o workspace pessoal ativo.",
    source: "user_input",
    status: "active",
    aiGenerated: false,
    reviewedBy: "user_demo_qa_lead",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
  {
    id: "requirement_demo_saas_empty_states",
    projectId: "project_demo_saas",
    moduleId: "module_demo_saas_dashboard",
    title: "Estados vazios devem orientar o proximo artefato de QA",
    description: "Quando nao houver dados, a interface deve explicar o proximo passo operacional.",
    source: "ai_draft",
    status: "draft",
    aiGenerated: true,
    reviewedBy: "",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
];

export const demoBusinessRules: BusinessRule[] = [
  {
    id: "rule_demo_landing_email",
    projectId: "project_demo_landing",
    moduleId: "module_demo_landing_conversion",
    requirementId: "requirement_demo_landing_form",
    title: "Lead precisa ter email preenchido",
    ruleText: "O formulario nao deve aceitar envio sem um email em formato valido.",
    priority: "high",
    status: "active",
    aiGenerated: false,
    reviewedBy: "user_demo_qa_lead",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
  {
    id: "rule_demo_landing_mobile_cta",
    projectId: "project_demo_landing",
    moduleId: "module_demo_landing_responsive",
    requirementId: "requirement_demo_landing_mobile",
    title: "CTA mobile requer validacao manual",
    ruleText: "O CTA deve ser visivel e acionavel em telas pequenas sem cobrir conteudo essencial.",
    priority: "medium",
    status: "needs_review",
    aiGenerated: true,
    reviewedBy: "",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
  {
    id: "rule_demo_saas_workspace_boundary",
    projectId: "project_demo_saas",
    moduleId: "module_demo_saas_auth",
    requirementId: "requirement_demo_saas_session",
    title: "Projeto pertence a uma organizacao acessivel",
    ruleText: "Um usuario so pode visualizar projetos da organizacao em que possui membership.",
    priority: "critical",
    status: "active",
    aiGenerated: false,
    reviewedBy: "user_demo_qa_lead",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
  {
    id: "rule_demo_saas_empty_state_next_step",
    projectId: "project_demo_saas",
    moduleId: "module_demo_saas_dashboard",
    requirementId: "requirement_demo_saas_empty_states",
    title: "Estado vazio indica proximo artefato",
    ruleText: "Cada estado vazio deve apontar para criacao ou revisao de um artefato estruturado.",
    priority: "medium",
    status: "draft",
    aiGenerated: true,
    reviewedBy: "",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
];

export function isModuleCriticality(value: string): value is ModuleCriticality {
  return moduleCriticalities.includes(value as ModuleCriticality);
}

export function isModuleStatus(value: string): value is ModuleStatus {
  return moduleStatuses.includes(value as ModuleStatus);
}

export function isRequirementSource(value: string): value is RequirementSource {
  return requirementSources.includes(value as RequirementSource);
}

export function isRequirementStatus(value: string): value is RequirementStatus {
  return requirementStatuses.includes(value as RequirementStatus);
}

export function isBusinessRulePriority(value: string): value is BusinessRulePriority {
  return businessRulePriorities.includes(value as BusinessRulePriority);
}

export function isBusinessRuleStatus(value: string): value is BusinessRuleStatus {
  return businessRuleStatuses.includes(value as BusinessRuleStatus);
}

export function validateModuleInput(input: ProductModuleInput): string[] {
  const errors: string[] = [];

  if (input.projectId.trim().length === 0) {
    errors.push("module_project_required");
  }

  if (input.name.trim().length < 2) {
    errors.push("module_name_required");
  }

  if (input.criticality !== undefined && !isModuleCriticality(input.criticality)) {
    errors.push("invalid_module_criticality");
  }

  if (input.status !== undefined && !isModuleStatus(input.status)) {
    errors.push("invalid_module_status");
  }

  return errors;
}

export function validateRequirementInput(input: RequirementInput): string[] {
  const errors: string[] = [];

  if (input.projectId.trim().length === 0) {
    errors.push("requirement_project_required");
  }

  if (input.moduleId.trim().length === 0) {
    errors.push("requirement_module_required");
  }

  if (input.title.trim().length < 2) {
    errors.push("requirement_title_required");
  }

  if (input.source !== undefined && !isRequirementSource(input.source)) {
    errors.push("invalid_requirement_source");
  }

  if (input.status !== undefined && !isRequirementStatus(input.status)) {
    errors.push("invalid_requirement_status");
  }

  return errors;
}

export function validateBusinessRuleInput(input: BusinessRuleInput): string[] {
  const errors: string[] = [];

  if (input.projectId.trim().length === 0) {
    errors.push("business_rule_project_required");
  }

  if (input.moduleId.trim().length === 0) {
    errors.push("business_rule_module_required");
  }

  if (input.requirementId.trim().length === 0) {
    errors.push("business_rule_requirement_required");
  }

  if (input.title.trim().length < 2) {
    errors.push("business_rule_title_required");
  }

  if (input.ruleText.trim().length < 2) {
    errors.push("business_rule_text_required");
  }

  if (input.priority !== undefined && !isBusinessRulePriority(input.priority)) {
    errors.push("invalid_business_rule_priority");
  }

  if (input.status !== undefined && !isBusinessRuleStatus(input.status)) {
    errors.push("invalid_business_rule_status");
  }

  return errors;
}

export function listModulesByProject(
  projectId: string,
  modules: ProductModule[] = demoProductModules,
): ProductModule[] {
  return modules.filter((module) => module.projectId === projectId);
}

export function listRequirementsByProject(
  projectId: string,
  requirements: Requirement[] = demoRequirements,
): Requirement[] {
  return requirements.filter((requirement) => requirement.projectId === projectId);
}

export function listRequirementsByModule(
  moduleId: string,
  requirements: Requirement[] = demoRequirements,
): Requirement[] {
  return requirements.filter((requirement) => requirement.moduleId === moduleId);
}

export function listBusinessRulesByProject(
  projectId: string,
  businessRules: BusinessRule[] = demoBusinessRules,
): BusinessRule[] {
  return businessRules.filter((rule) => rule.projectId === projectId);
}

export function listBusinessRulesByModule(
  moduleId: string,
  businessRules: BusinessRule[] = demoBusinessRules,
): BusinessRule[] {
  return businessRules.filter((rule) => rule.moduleId === moduleId);
}

export function listBusinessRulesByRequirement(
  requirementId: string,
  businessRules: BusinessRule[] = demoBusinessRules,
): BusinessRule[] {
  return businessRules.filter((rule) => rule.requirementId === requirementId);
}

export function createModule(input: ProductModuleInput, now = new Date()): ProductModule {
  const errors = validateModuleInput(input);

  if (errors.length > 0) {
    throw new Error(errors.join(","));
  }

  const timestamp = now.toISOString();

  return {
    id: `module_${now.getTime()}`,
    projectId: input.projectId,
    name: input.name.trim(),
    description: input.description?.trim() ?? "",
    criticality: input.criticality ?? "medium",
    status: input.status ?? "active",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateModule(
  module: ProductModule,
  updates: Partial<ProductModuleInput>,
  now = new Date(),
): ProductModule {
  const nextModule: ProductModule = {
    ...module,
    projectId: updates.projectId ?? module.projectId,
    name: updates.name?.trim() ?? module.name,
    description: updates.description?.trim() ?? module.description,
    criticality: updates.criticality ?? module.criticality,
    status: updates.status ?? module.status,
    updatedAt: now.toISOString(),
  };

  const errors = validateModuleInput(nextModule);

  if (errors.length > 0) {
    throw new Error(errors.join(","));
  }

  return nextModule;
}

export function createRequirement(input: RequirementInput, now = new Date()): Requirement {
  const errors = validateRequirementInput(input);

  if (errors.length > 0) {
    throw new Error(errors.join(","));
  }

  const timestamp = now.toISOString();

  return {
    id: `requirement_${now.getTime()}`,
    projectId: input.projectId,
    moduleId: input.moduleId,
    title: input.title.trim(),
    description: input.description?.trim() ?? "",
    source: input.source ?? "user_input",
    status: input.status ?? "draft",
    aiGenerated: input.aiGenerated ?? false,
    reviewedBy: input.reviewedBy?.trim() ?? "",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateRequirement(
  requirement: Requirement,
  updates: Partial<RequirementInput>,
  now = new Date(),
): Requirement {
  const nextRequirement: Requirement = {
    ...requirement,
    projectId: updates.projectId ?? requirement.projectId,
    moduleId: updates.moduleId ?? requirement.moduleId,
    title: updates.title?.trim() ?? requirement.title,
    description: updates.description?.trim() ?? requirement.description,
    source: updates.source ?? requirement.source,
    status: updates.status ?? requirement.status,
    aiGenerated: updates.aiGenerated ?? requirement.aiGenerated,
    reviewedBy: updates.reviewedBy?.trim() ?? requirement.reviewedBy,
    updatedAt: now.toISOString(),
  };

  const errors = validateRequirementInput(nextRequirement);

  if (errors.length > 0) {
    throw new Error(errors.join(","));
  }

  return nextRequirement;
}

export function createBusinessRule(input: BusinessRuleInput, now = new Date()): BusinessRule {
  const errors = validateBusinessRuleInput(input);

  if (errors.length > 0) {
    throw new Error(errors.join(","));
  }

  const timestamp = now.toISOString();

  return {
    id: `business_rule_${now.getTime()}`,
    projectId: input.projectId,
    moduleId: input.moduleId,
    requirementId: input.requirementId,
    title: input.title.trim(),
    ruleText: input.ruleText.trim(),
    priority: input.priority ?? "medium",
    status: input.status ?? "draft",
    aiGenerated: input.aiGenerated ?? false,
    reviewedBy: input.reviewedBy?.trim() ?? "",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateBusinessRule(
  rule: BusinessRule,
  updates: Partial<BusinessRuleInput>,
  now = new Date(),
): BusinessRule {
  const nextRule: BusinessRule = {
    ...rule,
    projectId: updates.projectId ?? rule.projectId,
    moduleId: updates.moduleId ?? rule.moduleId,
    requirementId: updates.requirementId ?? rule.requirementId,
    title: updates.title?.trim() ?? rule.title,
    ruleText: updates.ruleText?.trim() ?? rule.ruleText,
    priority: updates.priority ?? rule.priority,
    status: updates.status ?? rule.status,
    aiGenerated: updates.aiGenerated ?? rule.aiGenerated,
    reviewedBy: updates.reviewedBy?.trim() ?? rule.reviewedBy,
    updatedAt: now.toISOString(),
  };

  const errors = validateBusinessRuleInput(nextRule);

  if (errors.length > 0) {
    throw new Error(errors.join(","));
  }

  return nextRule;
}

export function countRequirementsByModule(
  moduleId: string,
  requirements: Requirement[] = demoRequirements,
): number {
  return listRequirementsByModule(moduleId, requirements).length;
}

export function countBusinessRulesByRequirement(
  requirementId: string,
  businessRules: BusinessRule[] = demoBusinessRules,
): number {
  return listBusinessRulesByRequirement(requirementId, businessRules).length;
}

export function getModuleTraceability(
  projectId: string,
  modules: ProductModule[] = demoProductModules,
  requirements: Requirement[] = demoRequirements,
  businessRules: BusinessRule[] = demoBusinessRules,
): ModuleTraceability[] {
  return listModulesByProject(projectId, modules).map((module) => ({
    module,
    requirementCount: countRequirementsByModule(module.id, requirements),
    businessRuleCount: listBusinessRulesByModule(module.id, businessRules).length,
  }));
}

export function getRequirementTraceability(
  requirementId: string,
  requirements: Requirement[] = demoRequirements,
  businessRules: BusinessRule[] = demoBusinessRules,
): RequirementTraceability {
  const requirement = requirements.find((item) => item.id === requirementId) ?? null;
  const linkedBusinessRules = listBusinessRulesByRequirement(requirementId, businessRules);

  return {
    requirement,
    businessRules: linkedBusinessRules,
    businessRuleCount: linkedBusinessRules.length,
  };
}

export function getBusinessUnderstandingSummary(
  projectId: string,
  modules: ProductModule[] = demoProductModules,
  requirements: Requirement[] = demoRequirements,
  businessRules: BusinessRule[] = demoBusinessRules,
): BusinessUnderstandingSummary {
  const projectModules = listModulesByProject(projectId, modules);
  const projectRequirements = listRequirementsByProject(projectId, requirements);
  const projectBusinessRules = listBusinessRulesByProject(projectId, businessRules);

  return {
    totalModules: projectModules.length,
    totalRequirements: projectRequirements.length,
    totalBusinessRules: projectBusinessRules.length,
    criticalModules: projectModules.filter((module) => module.criticality === "critical").length,
    requirementsNeedingReview: projectRequirements.filter(
      (requirement) => requirement.status === "needs_review",
    ).length,
    businessRulesNeedingReview: projectBusinessRules.filter(
      (rule) => rule.status === "needs_review",
    ).length,
  };
}
