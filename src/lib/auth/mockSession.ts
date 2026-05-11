import type { Organization, User } from "@/lib/workspace/types";

const demoTimestamp = "2026-05-11T09:00:00.000Z";

export const demoUser: User = {
  id: "user_demo_qa_lead",
  name: "Marina Demo",
  email: "marina.demo@frankintest.local",
  avatarUrl: undefined,
  createdAt: demoTimestamp,
  updatedAt: demoTimestamp,
};

export const demoPersonalOrganization: Organization = {
  id: "org_demo_personal",
  name: "Workspace pessoal",
  slug: "workspace-pessoal",
  plan: "demo",
  creditBalance: 125,
  createdAt: demoTimestamp,
  updatedAt: demoTimestamp,
  memberships: [
    {
      userId: demoUser.id,
      organizationId: "org_demo_personal",
      role: "owner",
    },
  ],
};

export type MockSession = {
  user: User;
  activeOrganization: Organization;
  authMode: "local-demo";
};

export function getMockSession(): MockSession {
  return {
    user: demoUser,
    activeOrganization: demoPersonalOrganization,
    authMode: "local-demo",
  };
}
