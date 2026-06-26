import Link from "next/link";
import { StatusBadge } from "./StatusBadge";
import { PriorityBadge } from "./PriorityBadge";

type Props = {
  id: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  projectName: string;
  assignedToName: string | null;
};

export function IssueRow(p: Props) {
  return (
    <Link
      href={`/issues/${p.id}`}
      className="flex items-center justify-between gap-4 border-b px-2 py-3 hover:bg-gray-50"
    >
      <div className="min-w-0">
        <div className="truncate font-medium">{p.title}</div>
        <div className="text-xs text-gray-500">
          {p.type} in {p.projectName}
          {p.assignedToName ? ` - assigned to ${p.assignedToName}` : ""}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <PriorityBadge priority={p.priority} />
        <StatusBadge status={p.status} />
      </div>
    </Link>
  );
}
