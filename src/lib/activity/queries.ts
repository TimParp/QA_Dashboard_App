import { prisma } from "@/lib/db";
import type { AuthUser } from "@/lib/authz/authorize";
import { issueVisibilityWhere } from "@/lib/authz/visibility";
import { ASSIGNMENT_CHANGED } from "@/lib/activity/constants";

export async function listIssueActivity(user: AuthUser, issueId: string) {
  const entries = await prisma.activityLog.findMany({
    where: { issueId, issue: issueVisibilityWhere(user) },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      action: true,
      fromValue: true,
      toValue: true,
      createdAt: true,
      actorId: true,
      actor: { select: { id: true, name: true, email: true } },
    },
  });

  const userIds = new Set<string>();
  for (const e of entries) {
    if (e.action === ASSIGNMENT_CHANGED) {
      if (e.fromValue) userIds.add(e.fromValue);
      if (e.toValue) userIds.add(e.toValue);
    }
  }

  const users = userIds.size > 0
    ? await prisma.user.findMany({
        where: { id: { in: [...userIds] } },
        select: { id: true, name: true, email: true },
      })
    : [];
  const nameById = new Map(users.map((u) => [u.id, u.name ?? u.email]));

  return entries.map((e) => ({
    ...e,
    fromName: e.action === ASSIGNMENT_CHANGED && e.fromValue ? nameById.get(e.fromValue) ?? null : null,
    toName: e.action === ASSIGNMENT_CHANGED && e.toValue ? nameById.get(e.toValue) ?? null : null,
  }));
}

export type IssueActivity = Awaited<ReturnType<typeof listIssueActivity>>[number];
