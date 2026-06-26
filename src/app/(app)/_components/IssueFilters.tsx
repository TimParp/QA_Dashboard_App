"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "REOPENED"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const TYPES = ["BUG", "FEATURE"];

export function IssueFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`${pathname}?${next.toString()}`);
  }

  function select(key: string, options: string[], label: string) {
    return (
      <select
        value={params.get(key) ?? ""}
        onChange={(e) => setParam(key, e.target.value)}
        className="rounded border px-2 py-1 text-sm"
      >
        <option value="">{label}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o.replace("_", " ")}</option>
        ))}
      </select>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {select("status", STATUSES, "All statuses")}
      {select("priority", PRIORITIES, "All priorities")}
      {select("type", TYPES, "All types")}
    </div>
  );
}
