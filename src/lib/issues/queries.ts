import { prisma } from "@/lib/db";
import type { AuthUser } from "@/lib/authz/authorize";
import {
  issueVisibilityWhere,
  projectVisibilityWhere,
} from "@/lib/authz/visibility";
import type { IssueFilter } from "@/lib/issues/schemas";

function filterWhere(filter: IssueFilter) {
  return {
    ...(filter.projectId ? { projectId: filter.projectId } : {}),
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.priority ? { priority: filter.priority } : {}),
    ...(filter.type ? { type: filter.type } : {}),
    ...(filter.assignedToId ? { assignedToId: filter.assignedToId } : {}),
  };
}

export async function listIssues(user: AuthUser, filter: IssueFilter) {
  const issues = await prisma.issue.findMany({
    where: { AND: [issueVisibilityWhere(user), filterWhere(filter)] },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      type: true,
      status: true,
      priority: true,
      projectId: true,
      createdAt: true,
      project: { select: { name: true } },
      assignedTo: { select: { name: true } },
    },
  });
  return issues.map((i) => ({
    id: i.id,
    title: i.title,
    type: i.type,
    status: i.status,
    priority: i.priority,
    projectId: i.projectId,
    projectName: i.project.name,
    assignedToName: i.assignedTo?.name ?? null,
    createdAt: i.createdAt,
  }));
}

export async function getIssueCounts(user: AuthUser, filter: IssueFilter) {
  const grouped = await prisma.issue.groupBy({
    by: ["status"],
    where: { AND: [issueVisibilityWhere(user), filterWhere(filter)] },
    _count: { _all: true },
  });
  return grouped.map((g) => ({ status: g.status, count: g._count._all }));
}

export async function getIssueForUser(user: AuthUser, issueId: string) {
  const issue = await prisma.issue.findFirst({
    where: { AND: [{ id: issueId }, issueVisibilityWhere(user)] },
    include: {
      project: { select: { id: true, name: true, clientId: true } },
      createdBy: { select: { name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });
  return issue;
}

export async function getUserProjects(user: AuthUser) {
  const projects = await prisma.project.findMany({
    where: projectVisibilityWhere(user),
    orderBy: { name: "asc" },
    select: { id: true, name: true, client: { select: { name: true } } },
  });
  return projects.map((p) => ({
    id: p.id,
    name: p.name,
    clientName: p.client.name,
  }));
}

export async function getAssignableUsers(user: AuthUser, projectId: string) {
  const members = await prisma.user.findMany({
    where: {
      role: { in: ["ADMIN", "QA", "DEVELOPER"] },
      memberships: { some: { projectId } },
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });
  return members;
}

export type IssueListItem = Awaited<ReturnType<typeof listIssues>>[number];
export type IssueDetail = NonNullable<Awaited<ReturnType<typeof getIssueForUser>>>;
