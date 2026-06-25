import type { Prisma } from "@prisma/client";
import {
  authorize,
  type Action,
  type AuthUser,
  type ProjectRef,
} from "@/lib/authz/authorize";
import { ForbiddenError } from "@/lib/errors";

function denyAll() {
  return { id: { in: [] as string[] } };
}

export function issueVisibilityWhere(user: AuthUser): Prisma.IssueWhereInput {
  if (user.role === "ADMIN") return {};
  if (user.role === "CLIENT") {
    if (!user.clientId) return denyAll();
    return { project: { clientId: user.clientId } };
  }
  if (user.projectIds.length === 0) return denyAll();
  return { projectId: { in: user.projectIds } };
}

export function projectVisibilityWhere(user: AuthUser): Prisma.ProjectWhereInput {
  if (user.role === "ADMIN") return {};
  if (user.role === "CLIENT") {
    if (!user.clientId) return denyAll();
    return { clientId: user.clientId };
  }
  if (user.projectIds.length === 0) return denyAll();
  return { id: { in: user.projectIds } };
}

export function assertAuthorized(
  user: AuthUser,
  action: Action,
  project: ProjectRef | null,
): void {
  if (!authorize(user, action, project)) {
    throw new ForbiddenError();
  }
}
