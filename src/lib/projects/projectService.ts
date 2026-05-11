import { canCreateProject } from "@/lib/workspace/access";
import type { Organization, User } from "@/lib/workspace/types";
import {
  projectStatuses,
  projectTypes,
  qaMaturityLevels,
  riskLevels,
  type Project,
  type ProjectInput,
  type ProjectStatus,
  type ProjectType,
  type QaMaturity,
  type RiskLevel,
} from "./types";

const demoTimestamp = "2026-05-11T09:05:00.000Z";

export const demoProjects: Project[] = [
  {
    id: "project_demo_landing",
    organizationId: "org_demo_personal",
    name: "Landing de lançamento",
    type: "landing_page",
    description:
      "Página de captura para validar promessa, CTA, formulário, responsividade e riscos de conversão.",
    targetUrl: "https://example.com/lancamento",
    qaMaturity: "basic",
    riskLevel: "medium",
    status: "active",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
  {
    id: "project_demo_saas",
    organizationId: "org_demo_personal",
    name: "Portal SaaS MVP",
    type: "saas",
    description:
      "Fluxos iniciais de autenticação, dashboard, permissões, estados vazios e prontidão de release.",
    targetUrl: "",
    qaMaturity: "ad_hoc",
    riskLevel: "high",
    status: "active",
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  },
];

export function isProjectType(value: string): value is ProjectType {
  return projectTypes.includes(value as ProjectType);
}

export function isQaMaturity(value: string): value is QaMaturity {
  return qaMaturityLevels.includes(value as QaMaturity);
}

export function isRiskLevel(value: string): value is RiskLevel {
  return riskLevels.includes(value as RiskLevel);
}

export function isProjectStatus(value: string): value is ProjectStatus {
  return projectStatuses.includes(value as ProjectStatus);
}

export function validateProjectInput(input: ProjectInput): string[] {
  const errors: string[] = [];

  if (input.name.trim().length < 2) {
    errors.push("project_name_required");
  }

  if (!isProjectType(input.type)) {
    errors.push("invalid_project_type");
  }

  if (input.qaMaturity !== undefined && !isQaMaturity(input.qaMaturity)) {
    errors.push("invalid_qa_maturity");
  }

  if (input.riskLevel !== undefined && !isRiskLevel(input.riskLevel)) {
    errors.push("invalid_risk_level");
  }

  if (input.status !== undefined && !isProjectStatus(input.status)) {
    errors.push("invalid_project_status");
  }

  return errors;
}

export function canCreateProjectWithInput(
  user: User,
  organization: Organization,
  input: ProjectInput,
): boolean {
  return canCreateProject(user, organization) && validateProjectInput(input).length === 0;
}

export function createProject(input: ProjectInput, now = new Date()): Project {
  const errors = validateProjectInput(input);

  if (errors.length > 0) {
    throw new Error(errors.join(","));
  }

  const timestamp = now.toISOString();

  return {
    id: `project_${now.getTime()}`,
    organizationId: input.organizationId,
    name: input.name.trim(),
    type: input.type,
    description: input.description?.trim() ?? "",
    targetUrl: input.targetUrl?.trim() ?? "",
    qaMaturity: input.qaMaturity ?? "unknown",
    riskLevel: input.riskLevel ?? "medium",
    status: input.status ?? "active",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateProject(project: Project, updates: Partial<ProjectInput>, now = new Date()) {
  const nextProject: Project = {
    ...project,
    name: updates.name?.trim() ?? project.name,
    type: updates.type ?? project.type,
    description: updates.description?.trim() ?? project.description,
    targetUrl: updates.targetUrl?.trim() ?? project.targetUrl,
    qaMaturity: updates.qaMaturity ?? project.qaMaturity,
    riskLevel: updates.riskLevel ?? project.riskLevel,
    status: updates.status ?? project.status,
    updatedAt: now.toISOString(),
  };

  const errors = validateProjectInput(nextProject);

  if (errors.length > 0) {
    throw new Error(errors.join(","));
  }

  return nextProject;
}
