import { prisma } from "@/lib/db";
import type { AuthUser } from "@/lib/authz/authorize";
import { issueVisibilityWhere } from "@/lib/authz/visibility";

export async function getAttachmentForUser(user: AuthUser, id: string) {
  return prisma.attachment.findFirst({
    where: { id, issue: issueVisibilityWhere(user) },
    select: { id: true, s3Key: true, fileName: true, contentType: true, size: true },
  });
}

export async function listIssueAttachments(user: AuthUser, issueId: string) {
  return prisma.attachment.findMany({
    where: { issueId, issue: issueVisibilityWhere(user) },
    orderBy: { createdAt: "asc" },
    select: { id: true, fileName: true, contentType: true, size: true, uploadedById: true },
  });
}

export type IssueAttachment = Awaited<ReturnType<typeof listIssueAttachments>>[number];
