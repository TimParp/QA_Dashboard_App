"use server";

import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/session";
import { createIssue } from "@/lib/issues/mutations";
import { createIssueSchema } from "@/lib/issues/schemas";
import { addAttachments } from "@/lib/attachments/mutations";
import { readUploadFiles } from "@/lib/attachments/form";
import { validateFiles } from "@/lib/attachments/validation";
import { ValidationError } from "@/lib/errors";
import { optionalString } from "@/lib/forms";

export async function createIssueAction(formData: FormData) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const input = createIssueSchema.parse({
    projectId: String(formData.get("projectId") ?? ""),
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

  const uploads = await readUploadFiles(formData);

  const validationError = validateFiles(
    uploads.map((f) => ({ name: f.name, type: f.type, size: f.size })),
    0,
  );
  if (validationError) throw new ValidationError(validationError);

  const { id } = await createIssue(user, input);

  if (uploads.length > 0) {
    await addAttachments(user, id, uploads);
  }

  redirect(`/issues/${id}`);
}
