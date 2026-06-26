const STYLES: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-amber-100 text-amber-800",
  RESOLVED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-200 text-gray-700",
  REOPENED: "bg-purple-100 text-purple-800",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${STYLES[status] ?? "bg-gray-100"}`}>
      {status.replace("_", " ")}
    </span>
  );
}
