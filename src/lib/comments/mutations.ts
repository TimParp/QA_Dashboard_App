import { prisma } from "@/lib/db";
import type { AuthUser, Role } from "@/lib/authz/authorize";
import { assertAuthorized } from "@/lib/authz/visibility";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { validateCommentBody } from "@/lib/comments/validation";

const STAFF_ROLES: readonly Role[] = ["ADMIN", "QA", "DEVELOPER"];

export async function addComment(user: AuthUser, issueId: string, body: string) {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: { id: true, project: { select: { id: true, clientId: true } } },
  });
  if (!issue) throw new NotFoundError("issue not found");
  assertAuthorized(user, "comment", { id: issue.project.id, clientId: issue.project.clientId });

  const error = validateCommentBody(body);
  if (error) throw new ValidationError(error);

  return prisma.comment.create({
    data: { issueId, authorId: user.id, body: body.trim() },
    select: { id: true },
  });
}

export async function deleteComment(user: AuthUser, commentId: string) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      authorId: true,
      issue: { select: { project: { select: { id: true, clientId: true } } } },
    },
  });
  if (!comment) throw new NotFoundError("comment not found");

  assertAuthorized(user, "comment", {
    id: comment.issue.project.id,
    clientId: comment.issue.project.clientId,
  });

  const isStaff = STAFF_ROLES.includes(user.role);
  const isAuthor = comment.authorId === user.id;
  if (!isStaff && !isAuthor) throw new ForbiddenError();

  await prisma.comment.delete({ where: { id: commentId } });
}
