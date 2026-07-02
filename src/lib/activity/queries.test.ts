import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { testPrisma, resetDb } from "@/test/db";
import { createIssue, changeStatus, assignIssue } from "@/lib/issues/mutations";
import { listIssueActivity } from "@/lib/activity/queries";
import { ISSUE_CREATED, STATUS_CHANGED, ASSIGNMENT_CHANGED } from "@/lib/activity/constants";
import type { AuthUser } from "@/lib/authz/authorize";

beforeEach(async () => { await resetDb(); });
afterAll(async () => { await testPrisma.$disconnect(); });

function authUser(u: { id: string; role: "ADMIN" | "QA" | "DEVELOPER" | "CLIENT"; clientId?: string | null; projectIds?: string[] }): AuthUser {
  return { id: u.id, role: u.role, clientId: u.clientId ?? null, projectIds: u.projectIds ?? [] };
}

async function seed() {
  const c1 = await testPrisma.client.create({ data: { name: "C1" } });
  const p1 = await testPrisma.project.create({ data: { name: "P1", clientId: c1.id } });
  const dev = await testPrisma.user.create({ data: { email: "d@x.com", role: "DEVELOPER", name: "Dev" } });
  await testPrisma.projectMembership.create({ data: { userId: dev.id, projectId: p1.id } });
  return { c1, p1, dev };
}

describe("listIssueActivity", () => {
  it("returns entries oldest-first and resolves assignment ids to names", async () => {
    const s = await seed();
    const dev = authUser({ id: s.dev.id, role: "DEVELOPER", projectIds: [s.p1.id] });
    const { id } = await createIssue(dev, { projectId: s.p1.id, title: "T", type: "BUG", priority: "MEDIUM" });
    await changeStatus(dev, id, "IN_PROGRESS");
    await assignIssue(dev, id, s.dev.id);

    const activity = await listIssueActivity(dev, id);
    expect(activity.map((a) => a.action)).toEqual([ISSUE_CREATED, STATUS_CHANGED, ASSIGNMENT_CHANGED]);

    const assign = activity.find((a) => a.action === ASSIGNMENT_CHANGED)!;
    expect(assign.fromName).toBeNull();
    expect(assign.toName).toBe("Dev");
  });

  it("hides activity on projects the user cannot see", async () => {
    const s = await seed();
    const dev = authUser({ id: s.dev.id, role: "DEVELOPER", projectIds: [s.p1.id] });
    const { id } = await createIssue(dev, { projectId: s.p1.id, title: "T", type: "BUG", priority: "MEDIUM" });

    const outsider = authUser({ id: "outsider", role: "CLIENT", clientId: "other-client" });
    expect(await listIssueActivity(outsider, id)).toHaveLength(0);
  });
});
