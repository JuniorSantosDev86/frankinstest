import type { Project } from "@/lib/projects/types";
import type { Organization, OrganizationMemberRole, User } from "@/lib/workspace/types";

const projectManagerRoles: OrganizationMemberRole[] = ["owner", "admin", "qa_lead"];

export function getMembership(user: User, organization: Organization) {
  return organization.memberships.find((membership) => membership.userId === user.id) ?? null;
}

export function canAccessOrganization(user: User, organization: Organization): boolean {
  return getMembership(user, organization) !== null;
}

export function canCreateProject(user: User, organization: Organization): boolean {
  const membership = getMembership(user, organization);

  return membership !== null && projectManagerRoles.includes(membership.role);
}

export function canAccessProject(
  user: User,
  project: Project,
  organization: Organization,
): boolean {
  return project.organizationId === organization.id && canAccessOrganization(user, organization);
}

export function canManageProject(
  user: User,
  project: Project,
  organization: Organization,
): boolean {
  const membership = getMembership(user, organization);

  return (
    project.organizationId === organization.id &&
    membership !== null &&
    projectManagerRoles.includes(membership.role)
  );
}
