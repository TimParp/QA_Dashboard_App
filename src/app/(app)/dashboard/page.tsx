import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthUser } from "@/lib/auth/session";
import { listIssues, getIssueCounts, getUserProjects } from "@/lib/issues/queries";
import { issueFilterSchema } from "@/lib/issues/schemas";
import { IssueRow } from "../_components/IssueRow";
import { IssueFilters } from "../_components/IssueFilters";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const raw = await searchParams;
  const filter = issueFilterSchema.parse({
    status: typeof raw.status === "string" ? raw.status : undefined,
    priority: typeof raw.priority === "string" ? raw.priority : undefined,
    type: typeof raw.type === "string" ? raw.type : undefined,
  });

  const [issues, counts, projects] = await Promise.all([
    listIssues(user, filter),
    getIssueCounts(user, {}),
    getUserProjects(user),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <Link href="/issues/new" className="rounded bg-black px-3 py-1.5 text-sm text-white">
          New Issue
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        {counts.map((c) => (
          <span key={c.status} className="rounded border px-2 py-1">
            {c.status.replace("_", " ")}: {c.count}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-500">Projects:</span>
        {projects.map((p) => (
          <Link key={p.id} href={`/projects/${p.id}`} className="rounded border px-2 py-1 text-sm hover:bg-gray-50">
            {p.name}
          </Link>
        ))}
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
