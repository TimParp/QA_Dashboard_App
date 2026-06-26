"use server";

import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/session";
import { createIssue } from "@/lib/issues/mutations";
import { createIssueSchema } from "@/lib/issues/schemas";

export async function createIssueAction(formData: FormData) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const input = createIssueSchema.parse({
    projectId: String(formData.get("projectId") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    type: String(formData.get("type") ?? "BUG"),
    priority: String(formData.get("priority") ?? "MEDIUM"),
    stepsToReproduce: optional(formData.get("stepsToReproduce")),
    expectedResult: optional(formData.get("expectedResult")),
    actualResult: optional(formData.get("actualResult")),
    environment: optional(formData.get("environment")),
  });

  const { id } = await createIssue(user, input);
  redirect(`/issues/${id}`);
}

function optional(v: FormDataEntryValue | null): string | undefined {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length > 0 ? s : undefined;
}
