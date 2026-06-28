"use server";

import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/session";
import { createIssue } from "@/lib/issues/mutations";
import { createIssueSchema } from "@/lib/issues/schemas";
import { optionalString } from "@/lib/forms";

export async function createIssueAction(formData: FormData) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const input = createIssueSchema.parse({
    projectId: String(formData.get("projectId") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    type: String(formData.get("type") ?? "BUG"),
    priority: String(formData.get("priority") ?? "MEDIUM"),
    stepsToReproduce: optionalString(formData.get("stepsToReproduce")),
    expectedResult: optionalString(formData.get("expectedResult")),
    actualResult: optionalString(formData.get("actualResult")),
    environment: optionalString(formData.get("environment")),
    pageOrFeature: optionalString(formData.get("pageOrFeature")),
    role: optionalString(formData.get("role")),
    severity: optionalString(formData.get("severity")),
  });

  const { id } = await createIssue(user, input);
  redirect(`/issues/${id}`);
}
