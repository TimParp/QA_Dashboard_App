const STYLES: Record<string, string> = {
  LOW: "text-gray-500",
  MEDIUM: "text-blue-600",
  HIGH: "text-orange-600",
  CRITICAL: "text-red-600 font-semibold",
};

export function PriorityBadge({ priority }: { priority: string }) {
  return <span className={`text-xs ${STYLES[priority] ?? ""}`}>{priority}</span>;
}
