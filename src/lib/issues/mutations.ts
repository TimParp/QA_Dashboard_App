import { prisma } from "@/lib/db";
import type { AuthUser } from "@/lib/authz/authorize";
import { assertAuthorized } from "@/lib/authz/visibility";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import {
  createIssueSchema,
  updateIssueSchema,
  issueStatusEnum,
  type CreateIssueInput,
  type UpdateIssueInput,
} from "@/lib/issues/schemas";

async function loadIssueProject(issueId: string) {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: { id: true, projectId: true, project: { select: { id: true, clientId: true } } },
  });
  if (!issue) throw new NotFoundError("issue not found");
  return issue;
}

export async function createIssue(user: AuthUser, input: CreateIssueInput) {
  const data = createIssueSchema.parse(input);
  const project = await prisma.project.findUnique({
    where: { id: data.projectId },
    select: { id: true, clientId: true },
  });
  if (!project) throw new NotFoundError("project not found");
  assertAuthorized(user, "createIssue", { id: project.id, clientId: project.clientId });

  const issue = await prisma.issue.create({
    data: {
      projectId: data.projectId,
      title: data.title,
      description: data.description,
      type: data.type,
      priority: data.priority,
      stepsToReproduce: data.stepsToReproduce ?? null,
      expectedResult: data.expectedResult ?? null,
      actualResult: data.actualResult ?? null,
      environment: data.environment ?? null,
      pageOrFeature: data.pageOrFeature ?? null,
      role: data.role ?? null,
      severity: data.severity ?? null,
      createdById: user.id,
    },
    select: { id: true },
  });
  return issue;
}

export async function updateIssue(user: AuthUser, input: UpdateIssueInput) {
  const data = updateIssueSchema.parse(input);
  const issue = await loadIssueProject(data.issueId);
  assertAuthorized(user, "editIssue", {
    id: issue.project.id,
    clientId: issue.project.clientId,
  });
  await prisma.issue.update({
    where: { id: data.issueId },
    data: {
      title: data.title,
      description: data.description,
      type: data.type,
      priority: data.priority,
      stepsToReproduce: data.stepsToReproduce ?? null,
      expectedResult: data.expectedResult ?? null,
      actualResult: data.actualResult ?? null,
      environment: data.environment ?? null,
      pageOrFeature: data.pageOrFeature ?? null,
      role: data.role ?? null,
      severity: data.severity ?? null,
    },
  });
}

export async function changeStatus(user: AuthUser, issueId: string, status: string) {
  const parsed = issueStatusEnum.parse(status);
  const issue = await loadIssueProject(issueId);
  assertAuthorized(user, "changeStatus", {
    id: issue.project.id,
    clientId: issue.project.clientId,
  });
  await prisma.issue.update({ where: { id: issueId }, data: { status: parsed } });
}

export async function assignIssue(
  user: AuthUser,
  issueId: string,
  assigneeId: string | null,
) {
  const issue = await loadIssueProject(issueId);
  assertAuthorized(user, "assignIssue", {
    id: issue.project.id,
    clientId: issue.project.clientId,
  });

  if (assigneeId) {
    const membership = await prisma.projectMembership.findFirst({
      where: { projectId: issue.projectId, userId: assigneeId, user: { role: { in: ["ADMIN", "QA", "DEVELOPER"] } } },
      select: { id: true },
    });
    if (!membership) throw new ForbiddenError("assignee is not a member of this project");
  }

  await prisma.issue.update({ where: { id: issueId }, data: { assignedToId: assigneeId } });
}
