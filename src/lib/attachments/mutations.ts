import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import type { AuthUser, Role } from "@/lib/authz/authorize";
import { assertAuthorized } from "@/lib/authz/visibility";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { getStorage } from "@/lib/storage";
import { validateFiles } from "@/lib/attachments/validation";

export type UploadFile = { name: string; type: string; size: number; bytes: Buffer };

const STAFF_ROLES: readonly Role[] = ["ADMIN", "QA", "DEVELOPER"];

export async function addAttachments(user: AuthUser, issueId: string, files: UploadFile[]) {
  if (files.length === 0) return [];

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: { id: true, project: { select: { id: true, clientId: true } } },
  });
  if (!issue) throw new NotFoundError("issue not found");
  assertAuthorized(user, "uploadAttachment", { id: issue.project.id, clientId: issue.project.clientId });

  const existingCount = await prisma.attachment.count({ where: { issueId } });
  const error = validateFiles(files, existingCount);
  if (error) throw new ValidationError(error);

  const prepared = files.map((file) => ({
    file,
    s3Key: `attachments/${issueId}/${randomBytes(16).toString("hex")}`,
  }));

  const storage = getStorage();
  const written: string[] = [];
  try {
    for (const p of prepared) {
      await storage.put(p.s3Key, p.file.bytes, p.file.type);
      written.push(p.s3Key);
    }
  } catch (e) {
    await Promise.allSettled(written.map((key) => storage.delete(key)));
    throw e;
  }

  return prisma.$transaction(
    prepared.map((p) =>
      prisma.attachment.create({
        data: {
          issueId,
          s3Key: p.s3Key,
          fileName: p.file.name,
          size: p.file.size,
          contentType: p.file.type,
          uploadedById: user.id,
        },
        select: { id: true },
      }),
    ),
  );
}

export async function deleteAttachment(user: AuthUser, attachmentId: string) {
  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
    select: {
      id: true,
      s3Key: true,
      uploadedById: true,
      issue: { select: { project: { select: { id: true, clientId: true } } } },
    },
  });
  if (!attachment) throw new NotFoundError("attachment not found");

  assertAuthorized(user, "uploadAttachment", {
    id: attachment.issue.project.id,
    clientId: attachment.issue.project.clientId,
  });

  const isStaff = STAFF_ROLES.includes(user.role);
  const isUploader = attachment.uploadedById === user.id;
  if (!isStaff && !isUploader) throw new ForbiddenError();

  await prisma.attachment.delete({ where: { id: attachmentId } });
  await getStorage().delete(attachment.s3Key);
}
