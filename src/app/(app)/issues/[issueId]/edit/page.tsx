import { redirect, notFound } from "next/navigation";
import { getAuthUser } from "@/lib/auth/session";
import { getIssueForUser } from "@/lib/issues/queries";
import { assertAuthorized } from "@/lib/authz/visibility";
import { ForbiddenError } from "@/lib/errors";
import { IssueForm } from "../../../_components/IssueForm";
import { updateIssueAction } from "../actions";

export default async function EditIssuePage({
  params,
}: {
  params: Promise<{ issueId: string }>;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { issueId } = await params;
  const issue = await getIssueForUser(user, issueId);
  if (!issue) notFound();

  try {
    assertAuthorized(user, "editIssue", { id: issue.project.id, clientId: issue.project.clientId });
  } catch (e) {
    if (e instanceof ForbiddenError) notFound();
    throw e;
  }

  const action = updateIssueAction.bind(null, issueId);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Edit Issue</h1>
      <IssueForm
        action={action}
        lockedProjectId={issue.project.id}
        defaultValues={{
          title: issue.title,
          description: issue.description,
          type: issue.type,
          priority: issue.priority,
          stepsToReproduce: issue.stepsToReproduce ?? undefined,
          expectedResult: issue.expectedResult ?? undefined,
          actualResult: issue.actualResult ?? undefined,
          environment: issue.environment ?? undefined,
          pageOrFeature: issue.pageOrFeature ?? undefined,
          role: issue.role ?? undefined,
          severity: issue.severity ?? undefined,
        }}
        submitLabel="Save changes"
      />
    </div>
  );
}
