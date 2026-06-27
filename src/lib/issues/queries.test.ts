import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { testPrisma, resetDb } from "@/test/db";
import {
  listIssues,
  getIssueForUser,
  getUserProjects,
  getAssignableUsers,
} from "@/lib/issues/queries";
import type { AuthUser } from "@/lib/authz/authorize";
import { ForbiddenError } from "@/lib/errors";

async function seed() {
  const c1 = await testPrisma.client.create({ data: { name: "Client One" } });
  const c2 = await testPrisma.client.create({ data: { name: "Client Two" } });
  const p1 = await testPrisma.project.create({ data: { name: "P1", clientId: c1.id } });
  const p2 = await testPrisma.project.create({ data: { name: "P2", clientId: c2.id } });
  const dev = await testPrisma.user.create({
    data: { email: "dev@x.com", role: "DEVELOPER", name: "Dev" },
  });
  await testPrisma.projectMembership.create({
    data: { userId: dev.id, projectId: p1.id },
  });
  const i1 = await testPrisma.issue.create({
    data: { title: "Bug in P1", description: "d", type: "BUG", projectId: p1.id, createdById: dev.id },
  });
  const i2 = await testPrisma.issue.create({
    data: { title: "Bug in P2", description: "d", type: "BUG", projectId: p2.id, createdById: dev.id },
  });
  return { c1, c2, p1, p2, dev, i1, i2 };
}

beforeEach(async () => {
  await resetDb();
});
afterAll(async () => {
  await testPrisma.$disconnect();
});

describe("listIssues", () => {
  it("returns only issues in the user's member projects", async () => {
    const s = await seed();
    const dev: AuthUser = { id: s.dev.id, role: "DEVELOPER", clientId: null, projectIds: [s.p1.id] };
    const issues = await listIssues(dev, {});
    expect(issues.map((i) => i.id)).toEqual([s.i1.id]);
  });

  it("returns everything for an admin", async () => {
    const s = await seed();
    const admin: AuthUser = { id: "admin", role: "ADMIN", clientId: null, projectIds: [] };
    const issues = await listIssues(admin, {});
    expect(issues.length).toBe(2);
  });

  it("applies a status filter", async () => {
    const s = await seed();
    await testPrisma.issue.update({ where: { id: s.i1.id }, data: { status: "RESOLVED" } });
    const admin: AuthUser = { id: "admin", role: "ADMIN", clientId: null, projectIds: [] };
    const open = await listIssues(admin, { status: "OPEN" });
    expect(open.map((i) => i.id)).toEqual([s.i2.id]);
  });

  it("returns empty when filtering by a project the user cannot access", async () => {
    const s = await seed();
    const dev: AuthUser = { id: s.dev.id, role: "DEVELOPER", clientId: null, projectIds: [s.p1.id] };
    const issues = await listIssues(dev, { projectId: s.p2.id });
    expect(issues).toEqual([]);
  });

  it("scopes a client to only their own client's issues", async () => {
    const s = await seed();
    const clientTwo: AuthUser = { id: "cu2", role: "CLIENT", clientId: s.c2.id, projectIds: [] };
    const issues = await listIssues(clientTwo, {});
    expect(issues.map((i) => i.id)).toEqual([s.i2.id]);
  });
});

describe("getIssueForUser", () => {
  it("returns the issue when visible", async () => {
    const s = await seed();
    const dev: AuthUser = { id: s.dev.id, role: "DEVELOPER", clientId: null, projectIds: [s.p1.id] };
    const issue = await getIssueForUser(dev, s.i1.id);
    expect(issue?.title).toBe("Bug in P1");
  });
  it("returns null when not visible (cross-project)", async () => {
    const s = await seed();
    const dev: AuthUser = { id: s.dev.id, role: "DEVELOPER", clientId: null, projectIds: [s.p1.id] };
    const issue = await getIssueForUser(dev, s.i2.id);
    expect(issue).toBeNull();
  });
  it("returns null for a client viewing another client's issue", async () => {
    const s = await seed();
    const clientOne: AuthUser = { id: "cu1", role: "CLIENT", clientId: s.c1.id, projectIds: [] };
    const issue = await getIssueForUser(clientOne, s.i2.id);
    expect(issue).toBeNull();
  });
});

describe("getUserProjects", () => {
  it("lists only the projects a client can see", async () => {
    const s = await seed();
    const client: AuthUser = { id: "cu", role: "CLIENT", clientId: s.c1.id, projectIds: [] };
    const projects = await getUserProjects(client);
    expect(projects.map((p) => p.id)).toEqual([s.p1.id]);
  });
});

describe("getAssignableUsers", () => {
  it("returns internal members of the project", async () => {
    const s = await seed();
    const admin: AuthUser = { id: "admin", role: "ADMIN", clientId: null, projectIds: [] };
    const users = await getAssignableUsers(admin, s.p1.id);
    expect(users.map((u) => u.id)).toContain(s.dev.id);
  });

  it("throws for a developer who cannot see the project", async () => {
    const s = await seed();
    const dev: AuthUser = { id: s.dev.id, role: "DEVELOPER", clientId: null, projectIds: [s.p1.id] };
    await expect(getAssignableUsers(dev, s.p2.id)).rejects.toThrow(ForbiddenError);
  });

  it("throws for a client even on their own project", async () => {
    const s = await seed();
    const client: AuthUser = { id: "cu1", role: "CLIENT", clientId: s.c1.id, projectIds: [] };
    await expect(getAssignableUsers(client, s.p1.id)).rejects.toThrow(ForbiddenError);
  });
});
