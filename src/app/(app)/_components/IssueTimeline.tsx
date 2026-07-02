import type { IssueComment } from "@/lib/comments/queries";
import type { IssueActivity } from "@/lib/activity/queries";
import { ISSUE_CREATED, STATUS_CHANGED, ASSIGNMENT_CHANGED } from "@/lib/activity/constants";
import { deleteCommentAction } from "../issues/[issueId]/actions";

type Props = {
  comments: IssueComment[];
  activity: IssueActivity[];
  currentUserId: string;
  isStaff: boolean;
  issueId: string;
};

function activityText(a: IssueActivity): string {
  const actor = a.actor.name ?? a.actor.email;
  if (a.action === ISSUE_CREATED) return `${actor} created this issue`;
  if (a.action === STATUS_CHANGED) {
    const from = (a.fromValue ?? "").replace("_", " ");
    const to = (a.toValue ?? "").replace("_", " ");
    return `${actor} changed status ${from} -> ${to}`;
  }
  if (a.action === ASSIGNMENT_CHANGED) {
    return a.toName ? `${actor} assigned this issue to ${a.toName}` : `${actor} unassigned this issue`;
  }
  return `${actor} updated this issue`;
}

export function IssueTimeline({ comments, activity, currentUserId, isStaff, issueId }: Props) {
  const items = [
    ...comments.map((c) => ({ kind: "comment" as const, at: c.createdAt.getTime(), comment: c })),
    ...activity.map((a) => ({ kind: "activity" as const, at: a.createdAt.getTime(), activity: a })),
  ].sort((x, y) => x.at - y.at);

  if (items.length === 0) {
    return <p className="text-gray-500">No activity yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => {
        if (item.kind === "activity") {
          const a = item.activity;
          return (
            <li key={`a-${a.id}`} className="text-xs text-gray-500">
              {activityText(a)} - {a.createdAt.toLocaleString()}
            </li>
          );
        }
        const c = item.comment;
        const canDelete = isStaff || c.authorId === currentUserId;
        return (
          <li key={`c-${c.id}`} className="rounded border p-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{c.author.name ?? c.author.email}</span>
              <span className="text-xs text-gray-500">{c.createdAt.toLocaleString()}</span>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm">{c.body}</p>
            {canDelete ? (
              <form action={deleteCommentAction.bind(null, issueId, c.id)} className="mt-1">
                <button type="submit" className="text-xs text-red-600 underline">Delete</button>
              </form>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
