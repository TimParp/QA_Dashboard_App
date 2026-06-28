import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getAuthUser } from "@/lib/auth/session";
import { getIssueForUser, getAssignableUsers } from "@/lib/issues/queries";
import { authorize } from "@/lib/authz/authorize";
import { StatusBadge } from "../../_components/StatusBadge";
import { PriorityBadge } from "../../_components/PriorityBadge";
import { changeStatusAction, assignAction } from "./actions";

const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "REOPENED"];

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ issueId: string }>;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { issueId } = await params;
  const issue = await getIssueForUser(user, issueId);
  if (!issue) notFound();

  const projectRef = { id: issue.project.id, clientId: issue.project.clientId };
  const canTriage = authorize(user, "changeStatus", projectRef);
  const canEdit = authorize(user, "editIssue", projectRef);
  const assignable = canTriage ? await getAssignableUsers(user, issue.project.id) : [];

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{issue.title}</h1>
          <p className="text-sm text-gray-500">
            {issue.type} in{" "}
            <Link href={`/projects/${issue.project.id}`} className="underline">
              {issue.project.name}
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PriorityBadge priority={issue.priority} />
          <StatusBadge status={issue.status} />
        </div>
      </div>

      {issue.pageOrFeature || issue.role ? (
        <section className="flex flex-col gap-2 rounded border p-3 text-sm">
          <h2 className="font-medium">Details</h2>
          {issue.pageOrFeature ? <p><span className="text-gray-500">Page / Feature: </span>{issue.pageOrFeature}</p> : null}
          {issue.role ? <p><span className="text-gray-500">Role: </span>{issue.role}</p> : null}
        </section>
      ) : null}

      {issue.type === "BUG" && (issue.stepsToReproduce || issue.expectedResult || issue.actualResult || issue.environment) ? (
        <section className="flex flex-col gap-2 rounded border p-3 text-sm">
          <h2 className="font-medium">Reproduction</h2>
          {issue.stepsToReproduce ? <p><span className="text-gray-500">Steps: </span>{issue.stepsToReproduce}</p> : null}
          {issue.expectedResult ? <p><span className="text-gray-500">Expected: </span>{issue.expectedResult}</p> : null}
          {issue.actualResult ? <p><span className="text-gray-500">Actual: </span>{issue.actualResult}</p> : null}
          {issue.environment ? <p><span className="text-gray-500">Environment: </span>{issue.environment}</p> : null}
        </section>
      ) : null}

      <section className="text-sm text-gray-500">
        Reported by {issue.createdBy.name ?? issue.createdBy.email}
        {issue.assignedTo ? ` - assigned to ${issue.assignedTo.name ?? issue.assignedTo.email}` : " - unassigned"}
      </section>

      {canTriage ? (
        <section className="flex flex-wrap items-end gap-6 rounded border p-3">
          <form action={changeStatusAction.bind(null, issue.id)} className="flex items-end gap-2">
            <label className="flex flex-col gap-1 text-sm">
              Status
              <select name="status" defaultValue={issue.status} className="rounded border px-2 py-1">
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace("_", " ")}</option>
                ))}
              </select>
            </label>
            <button type="submit" className="rounded border px-3 py-1.5 text-sm">Update status</button>
          </form>

          <form action={assignAction.bind(null, issue.id)} className="flex items-end gap-2">
            <label className="flex flex-col gap-1 text-sm">
              Assignee
              <select name="assigneeId" defaultValue={issue.assignedTo?.id ?? ""} className="rounded border px-2 py-1">
                <option value="">Unassigned</option>
                {assignable.map((u) => (
                  <option key={u.id} value={u.id}>{u.name ?? u.email}</option>
                ))}
              </select>
            </label>
            <button type="submit" className="rounded border px-3 py-1.5 text-sm">Assign</button>
          </form>
        </section>
      ) : null}

      {canEdit ? (
        <Link href={`/issues/${issue.id}/edit`} className="self-start text-sm underline">
          Edit issue
        </Link>
      ) : null}
    </div>
  );
}
