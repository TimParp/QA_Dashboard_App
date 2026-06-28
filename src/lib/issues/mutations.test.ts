import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { testPrisma, resetDb } from "@/test/db";
import { createIssue, updateIssue, changeStatus, assignIssue } from "@/lib/issues/mutations";
import { ForbiddenError } from "@/lib/errors";
import type { AuthUser } from "@/lib/authz/authorize";

async function seed() {
  const c1 = await testPrisma.client.create({ data: { name: "C1" } });
  const p1 = await testPrisma.project.create({ data: { name: "P1", clientId: c1.id } });
  const dev = await testPrisma.user.create({ data: { email: "d@x.com", role: "DEVELOPER", name: "Dev" } });
  await testPrisma.projectMembership.create({ data: { userId: dev.id, projectId: p1.id } });
  const clientUser = await testPrisma.user.create({ data: { email: "c@x.com", role: "CLIENT", name: "Cli", clientId: c1.id } });
  return { c1, p1, dev, clientUser };
}

beforeEach(async () => { await resetDb(); });
afterAll(async () => { await testPrisma.$disconnect(); });

function authUser(u: { id: string; role: "ADMIN" | "QA" | "DEVELOPER" | "CLIENT"; clientId?: string | null; projectIds?: string[] }): AuthUser {
  return { id: u.id, role: u.role, clientId: u.clientId ?? null, projectIds: u.projectIds ?? [] };
}

describe("createIssue", () => {
  it("lets a member dev create an issue", async () => {
    const s = await seed();
    const dev = authUser({ id: s.dev.id, role: "DEVELOPER", projectIds: [s.p1.id] });
    const { id } = await createIssue(dev, {
      projectId: s.p1.id, title: "T", description: "D", type: "BUG", priority: "MEDIUM",
    });
    const issue = await testPrisma.issue.findUnique({ where: { id } });
    expect(issue?.title).toBe("T");
    expect(issue?.createdById).toBe(s.dev.id);
  });

  it("lets a client create an issue on their own project", async () => {
    const s = await seed();
    const client = authUser({ id: s.clientUser.id, role: "CLIENT", clientId: s.c1.id });
    const { id } = await createIssue(client, {
      projectId: s.p1.id, title: "T2", description: "D", type: "FEATURE", priority: "LOW",
    });
    expect(id).toBeTruthy();
  });

  it("rejects a non-member dev", async () => {
    const s = await seed();
    const outsider = authUser({ id: s.dev.id, role: "DEVELOPER", projectIds: [] });
    await expect(
      createIssue(outsider, { projectId: s.p1.id, title: "X", description: "D", type: "BUG", priority: "MEDIUM" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("changeStatus / assignIssue", () => {
  it("lets a member dev change status", async () => {
    const s = await seed();
    const dev = authUser({ id: s.dev.id, role: "DEVELOPER", projectIds: [s.p1.id] });
    const { id } = await createIssue(dev, { projectId: s.p1.id, title: "T", description: "D", type: "BUG", priority: "MEDIUM" });
    await changeStatus(dev, id, "IN_PROGRESS");
    const issue = await testPrisma.issue.findUnique({ where: { id } });
    expect(issue?.status).toBe("IN_PROGRESS");
  });

  it("forbids a client from changing status", async () => {
    const s = await seed();
    const dev = authUser({ id: s.dev.id, role: "DEVELOPER", projectIds: [s.p1.id] });
    const { id } = await createIssue(dev, { projectId: s.p1.id, title: "T", description: "D", type: "BUG", priority: "MEDIUM" });
    const client = authUser({ id: s.clientUser.id, role: "CLIENT", clientId: s.c1.id });
    await expect(changeStatus(client, id, "RESOLVED")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("assigns to a project member and rejects a non-member assignee", async () => {
    const s = await seed();
    const dev = authUser({ id: s.dev.id, role: "DEVELOPER", projectIds: [s.p1.id] });
    const { id } = await createIssue(dev, { projectId: s.p1.id, title: "T", description: "D", type: "BUG", priority: "MEDIUM" });
    await assignIssue(dev, id, s.dev.id);
    const issue = await testPrisma.issue.findUnique({ where: { id } });
    expect(issue?.assignedToId).toBe(s.dev.id);

    const stranger = await testPrisma.user.create({ data: { email: "s@x.com", role: "DEVELOPER", name: "Stranger" } });
    await expect(assignIssue(dev, id, stranger.id)).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("updateIssue", () => {
  it("lets a member dev update an issue", async () => {
    const s = await seed();
    const dev = authUser({ id: s.dev.id, role: "DEVELOPER", projectIds: [s.p1.id] });
    const { id } = await createIssue(dev, { projectId: s.p1.id, title: "T", description: "D", type: "BUG", priority: "MEDIUM" });
    await updateIssue(dev, { issueId: id, title: "Updated", description: "D2", type: "FEATURE", priority: "HIGH" });
    const issue = await testPrisma.issue.findUnique({ where: { id } });
    expect(issue?.title).toBe("Updated");
    expect(issue?.type).toBe("FEATURE");
    expect(issue?.priority).toBe("HIGH");
  });

  it("forbids a client from updating an issue", async () => {
    const s = await seed();
    const dev = authUser({ id: s.dev.id, role: "DEVELOPER", projectIds: [s.p1.id] });
    const { id } = await createIssue(dev, { projectId: s.p1.id, title: "T", description: "D", type: "BUG", priority: "MEDIUM" });
    const client = authUser({ id: s.clientUser.id, role: "CLIENT", clientId: s.c1.id });
    await expect(
      updateIssue(client, { issueId: id, title: "X", description: "D", type: "BUG", priority: "LOW" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("issue extra fields", () => {
  it("persists pageOrFeature, role, and severity on create", async () => {
    const s = await seed();
    const dev = authUser({ id: s.dev.id, role: "DEVELOPER", projectIds: [s.p1.id] });
    const { id } = await createIssue(dev, {
      projectId: s.p1.id, title: "T", description: "D", type: "BUG", priority: "MEDIUM",
      pageOrFeature: "Checkout page", role: "Fleet manager", severity: "HIGH",
    });
    const issue = await testPrisma.issue.findUnique({ where: { id } });
    expect(issue?.pageOrFeature).toBe("Checkout page");
    expect(issue?.role).toBe("Fleet manager");
    expect(issue?.severity).toBe("HIGH");
  });

  it("stores null when the extra fields are omitted", async () => {
    const s = await seed();
    const dev = authUser({ id: s.dev.id, role: "DEVELOPER", projectIds: [s.p1.id] });
    const { id } = await createIssue(dev, {
      projectId: s.p1.id, title: "T", description: "D", type: "FEATURE", priority: "LOW",
    });
    const issue = await testPrisma.issue.findUnique({ where: { id } });
    expect(issue?.pageOrFeature).toBeNull();
    expect(issue?.role).toBeNull();
    expect(issue?.severity).toBeNull();
  });

  it("updates pageOrFeature, role, and severity", async () => {
    const s = await seed();
    const dev = authUser({ id: s.dev.id, role: "DEVELOPER", projectIds: [s.p1.id] });
    const { id } = await createIssue(dev, {
      projectId: s.p1.id, title: "T", description: "D", type: "BUG", priority: "MEDIUM",
      pageOrFeature: "Old", role: "Old", severity: "LOW",
    });
    await updateIssue(dev, {
      issueId: id, title: "T", description: "D", type: "BUG", priority: "MEDIUM",
      pageOrFeature: "New page", role: "New role", severity: "CRITICAL",
    });
    const issue = await testPrisma.issue.findUnique({ where: { id } });
    expect(issue?.pageOrFeature).toBe("New page");
    expect(issue?.role).toBe("New role");
    expect(issue?.severity).toBe("CRITICAL");
  });
});
