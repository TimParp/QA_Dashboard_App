"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth/session";
import { updateIssue, changeStatus, assignIssue } from "@/lib/issues/mutations";
import { updateIssueSchema } from "@/lib/issues/schemas";
import { optionalString } from "@/lib/forms";
import { addAttachments, deleteAttachment } from "@/lib/attachments/mutations";
import { readUploadFiles } from "@/lib/attachments/form";
import { addComment, deleteComment } from "@/lib/comments/mutations";

export async function updateIssueAction(issueId: string, formData: FormData) {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  const input = updateIssueSchema.parse({
    issueId,
    title: String(formData.get("title") ?? ""),
    type: String(formData.get("type") ?? "BUG"),
    priority: String(formData.get("priority") ?? "MEDIUM"),
    stepsToReproduce: optionalString(formData.get("stepsToReproduce")),
    expectedResult: optionalString(formData.get("expectedResult")),
    actualResult: optionalString(formData.get("actualResult")),
    environment: optionalString(formData.get("environment")),
    pageOrFeature: optionalString(formData.get("pageOrFeature")),
    role: optionalString(formData.get("role")),
  });
  await updateIssue(user, input);
  redirect(`/issues/${issueId}`);
}

export async function changeStatusAction(issueId: string, formData: FormData) {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  await changeStatus(user, issueId, String(formData.get("status") ?? ""));
  revalidatePath(`/issues/${issueId}`);
}

export async function assignAction(issueId: string, formData: FormData) {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  const raw = String(formData.get("assigneeId") ?? "");
  await assignIssue(user, issueId, raw.length > 0 ? raw : null);
  revalidatePath(`/issues/${issueId}`);
}

export async function addAttachmentAction(issueId: string, formData: FormData) {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  const uploads = await readUploadFiles(formData);
  await addAttachments(user, issueId, uploads);
  revalidatePath(`/issues/${issueId}`);
}

export async function deleteAttachmentAction(issueId: string, attachmentId: string) {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  await deleteAttachment(user, attachmentId);
  revalidatePath(`/issues/${issueId}`);
}

export async function addCommentAction(issueId: string, formData: FormData) {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  await addComment(user, issueId, String(formData.get("body") ?? ""));
  revalidatePath(`/issues/${issueId}`);
}

export async function deleteCommentAction(issueId: string, commentId: string) {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  await deleteComment(user, commentId);
  revalidatePath(`/issues/${issueId}`);
}
