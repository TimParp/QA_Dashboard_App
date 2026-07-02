import { prisma } from "@/lib/db";
import type { AuthUser } from "@/lib/authz/authorize";
import { issueVisibilityWhere } from "@/lib/authz/visibility";

export async function listIssueComments(user: AuthUser, issueId: string) {
  return prisma.comment.findMany({
    where: { issueId, issue: issueVisibilityWhere(user) },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      body: true,
      createdAt: true,
      authorId: true,
      author: { select: { id: true, name: true, email: true } },
    },
  });
}

export type IssueComment = Awaited<ReturnType<typeof listIssueComments>>[number];
