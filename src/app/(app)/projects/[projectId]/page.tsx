import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getAuthUser } from "@/lib/auth/session";
import { listIssues, getUserProjects } from "@/lib/issues/queries";
import { issueFilterSchema } from "@/lib/issues/schemas";
import { IssueRow } from "../../_components/IssueRow";
import { IssueFilters } from "../../_components/IssueFilters";

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { projectId } = await params;
  const projects = await getUserProjects(user);
  const project = projects.find((p) => p.id === projectId);
  if (!project) notFound();

  const raw = await searchParams;
  const filter = issueFilterSchema.parse({
    projectId,
    status: typeof raw.status === "string" ? raw.status : undefined,
    priority: typeof raw.priority === "string" ? raw.priority : undefined,
    type: typeof raw.type === "string" ? raw.type : undefined,
  });

  const issues = await listIssues(user, filter);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{project.name}</h1>
          <p className="text-sm text-gray-500">{project.clientName}</p>
        </div>
        <Link
          href={`/issues/new?projectId=${projectId}`}
          className="rounded bg-black px-3 py-1.5 text-sm text-white"
        >
          New Issue
        </Link>
      </div>

      <IssueFilters />

      <div className="rounded border">
        {issues.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">No issues match these filters.</p>
        ) : (
          issues.map((i) => <IssueRow key={i.id} {...i} />)
        )}
      </div>
    </div>
  );
}
