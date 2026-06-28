"use client";

import { useState } from "react";

type ProjectOption = { id: string; name: string };

type Props = {
  action: (formData: FormData) => void;
  projects?: ProjectOption[];
  lockedProjectId?: string;
  defaultValues?: {
    title?: string;
    description?: string;
    type?: string;
    priority?: string;
    stepsToReproduce?: string;
    expectedResult?: string;
    actualResult?: string;
    environment?: string;
    pageOrFeature?: string;
    role?: string;
    severity?: string;
  };
  submitLabel: string;
};

export function IssueForm({ action, projects, lockedProjectId, defaultValues, submitLabel }: Props) {
  const [type, setType] = useState(defaultValues?.type ?? "BUG");

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-4">
      {lockedProjectId ? (
        <input type="hidden" name="projectId" value={lockedProjectId} />
      ) : projects ? (
        <label className="flex flex-col gap-1 text-sm">
          Project
          <select name="projectId" required className="rounded border px-3 py-2">
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="flex flex-col gap-1 text-sm">
        Type
        <select
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded border px-3 py-2"
        >
          <option value="BUG">Bug</option>
          <option value="FEATURE">Feature</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Title
        <input name="title" required defaultValue={defaultValues?.title} className="rounded border px-3 py-2" />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Description
        <textarea name="description" defaultValue={defaultValues?.description} rows={4} className="rounded border px-3 py-2" />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Priority
        <select name="priority" defaultValue={defaultValues?.priority ?? "MEDIUM"} className="rounded border px-3 py-2">
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
      </label>

      {type === "BUG" ? (
        <label className="flex flex-col gap-1 text-sm">
          Severity
          <select name="severity" defaultValue={defaultValues?.severity ?? "MEDIUM"} className="rounded border px-3 py-2">
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </label>
      ) : null}

      <label className="flex flex-col gap-1 text-sm">
        Page / Feature
        <input name="pageOrFeature" defaultValue={defaultValues?.pageOrFeature} className="rounded border px-3 py-2" />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Role
        <input name="role" defaultValue={defaultValues?.role} className="rounded border px-3 py-2" />
      </label>

      {type === "BUG" ? (
        <fieldset className="flex flex-col gap-3 rounded border p-3">
          <legend className="px-1 text-sm font-medium">Reproduction</legend>
          <label className="flex flex-col gap-1 text-sm">
            Steps to reproduce
            <textarea name="stepsToReproduce" defaultValue={defaultValues?.stepsToReproduce} rows={3} className="rounded border px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Expected result
            <input name="expectedResult" defaultValue={defaultValues?.expectedResult} className="rounded border px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Actual result
            <input name="actualResult" defaultValue={defaultValues?.actualResult} className="rounded border px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Environment (browser / OS / device / app version)
            <input name="environment" defaultValue={defaultValues?.environment} className="rounded border px-3 py-2" />
          </label>
        </fieldset>
      ) : null}

      <button type="submit" className="self-start rounded bg-black px-4 py-2 text-sm text-white">
        {submitLabel}
      </button>
    </form>
  );
}
