import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/session";
import { getUserProjects } from "@/lib/issues/queries";
import { IssueForm } from "../../_components/IssueForm";
import { createIssueAction } from "./actions";

export default async function NewIssuePage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const projects = await getUserProjects(user);
  if (projects.length === 0) {
    return <p className="text-sm text-gray-500">You have no projects to file an issue under.</p>;
  }

  const { projectId } = await searchParams;
  const locked = projectId && projects.some((p) => p.id === projectId) ? projectId : undefined;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">New Issue</h1>
      <IssueForm
        action={createIssueAction}
        projects={locked ? undefined : projects}
        lockedProjectId={locked}
        submitLabel="Create issue"
      />
    </div>
  );
}
