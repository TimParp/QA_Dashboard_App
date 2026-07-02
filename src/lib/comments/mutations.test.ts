import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { testPrisma, resetDb } from "@/test/db";
import { addComment, deleteComment } from "@/lib/comments/mutations";
import { ForbiddenError, ValidationError, NotFoundError } from "@/lib/errors";
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
  const clientUser = await testPrisma.user.create({ data: { email: "c@x.com", role: "CLIENT", name: "Cli", clientId: c1.id } });
  const issue = await testPrisma.issue.create({
    data: { projectId: p1.id, title: "T", type: "BUG", priority: "MEDIUM", createdById: clientUser.id },
  });
  return { c1, p1, dev, clientUser, issue };
}

describe("addComment", () => {
  it("lets a client comment on an issue in their own project", async () => {
    const s = await seed();
    const client = authUser({ id: s.clientUser.id, role: "CLIENT", clientId: s.c1.id });
    const { id } = await addComment(client, s.issue.id, "  hello  ");
    const row = await testPrisma.comment.findUnique({ where: { id } });
    expect(row?.body).toBe("hello");
    expect(row?.authorId).toBe(s.clientUser.id);
  });

  it("rejects a client commenting on another client's project issue", async () => {
    const s = await seed();
    const c2 = await testPrisma.client.create({ data: { name: "C2" } });
    const p2 = await testPrisma.project.create({ data: { name: "P2", clientId: c2.id } });
    const issue2 = await testPrisma.issue.create({
      data: { projectId: p2.id, title: "T2", type: "BUG", priority: "MEDIUM", createdById: s.dev.id },
    });
    const client = authUser({ id: s.clientUser.id, role: "CLIENT", clientId: s.c1.id });
    await expect(addComment(client, issue2.id, "hi")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("rejects an empty comment", async () => {
    const s = await seed();
    const dev = authUser({ id: s.dev.id, role: "DEVELOPER", projectIds: [s.p1.id] });
    await expect(addComment(dev, s.issue.id, "   ")).rejects.toBeInstanceOf(ValidationError);
  });
});

describe("deleteComment", () => {
  it("lets the author delete their own comment", async () => {
    const s = await seed();
    const client = authUser({ id: s.clientUser.id, role: "CLIENT", clientId: s.c1.id });
    const { id } = await addComment(client, s.issue.id, "mine");
    await deleteComment(client, id);
    expect(await testPrisma.comment.findUnique({ where: { id } })).toBeNull();
  });

  it("lets staff delete any comment on a visible project", async () => {
    const s = await seed();
    const client = authUser({ id: s.clientUser.id, role: "CLIENT", clientId: s.c1.id });
    const { id } = await addComment(client, s.issue.id, "theirs");
    const dev = authUser({ id: s.dev.id, role: "DEVELOPER", projectIds: [s.p1.id] });
    await deleteComment(dev, id);
    expect(await testPrisma.comment.findUnique({ where: { id } })).toBeNull();
  });

  it("forbids a non-author client from deleting", async () => {
    const s = await seed();
    const author = authUser({ id: s.clientUser.id, role: "CLIENT", clientId: s.c1.id });
    const { id } = await addComment(author, s.issue.id, "theirs");
    const other = await testPrisma.user.create({ data: { email: "c2@x.com", role: "CLIENT", name: "Cli2", clientId: s.c1.id } });
    const otherClient = authUser({ id: other.id, role: "CLIENT", clientId: s.c1.id });
    await expect(deleteComment(otherClient, id)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("throws NotFound for a missing comment", async () => {
    const s = await seed();
    const dev = authUser({ id: s.dev.id, role: "DEVELOPER", projectIds: [s.p1.id] });
    await expect(deleteComment(dev, "nonexistent")).rejects.toBeInstanceOf(NotFoundError);
  });
});
