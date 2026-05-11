export type OrganizationPlan = "demo" | "free" | "pro" | "agency";

export type OrganizationMemberRole = "owner" | "admin" | "qa_lead" | "member" | "viewer";

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type OrganizationMembership = {
  userId: string;
  organizationId: string;
  role: OrganizationMemberRole;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  plan: OrganizationPlan;
  creditBalance: number;
  createdAt: string;
  updatedAt: string;
  memberships: OrganizationMembership[];
};
