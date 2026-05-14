export const projectTypes = [
  "landing_page",
  "saas",
  "mobile_app",
  "api",
  "erp",
  "ecommerce",
  "internal_system",
  "other",
] as const;

export type ProjectType = (typeof projectTypes)[number];

export const qaMaturityLevels = ["unknown", "ad_hoc", "basic", "structured", "advanced"] as const;

export type QaMaturity = (typeof qaMaturityLevels)[number];

export const riskLevels = ["low", "medium", "high", "critical"] as const;

export type RiskLevel = (typeof riskLevels)[number];

export const projectStatuses = ["active", "paused", "archived"] as const;

export type ProjectStatus = (typeof projectStatuses)[number];

export type Project = {
  id: string;
  organizationId: string;
  name: string;
  type: ProjectType;
  description: string;
  targetUrl: string;
  qaMaturity: QaMaturity;
  riskLevel: RiskLevel;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
};

export type ProjectInput = {
  organizationId: string;
  name: string;
  type: ProjectType;
  description?: string;
  targetUrl?: string;
  qaMaturity?: QaMaturity;
  riskLevel?: RiskLevel;
  status?: ProjectStatus;
};
