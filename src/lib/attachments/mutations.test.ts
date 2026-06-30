import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import { testPrisma, resetDb } from "@/test/db";
import { addAttachments, deleteAttachment } from "@/lib/attachments/mutations";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import type { AuthUser } from "@/lib/authz/authorize";

const TMP = path.resolve(".test-uploads-mut");

beforeAll(() => {
  process.env.STORAGE_DRIVER = "local";
  process.env.LOCAL_STORAGE_DIR = TMP;
});
afterAll(async () => {
  await testPrisma.$disconnect();
  await fs.rm(TMP, { recursive: true, force: true });
});
beforeEach(async () => {
  await resetDb();
});

function authUser(u: {
  id: string;
  role: "ADMIN" | "QA" | "DEVELOPER" | "CLIENT";
  clientId?: string | null;
  projectIds?: string[];
}): AuthUser {
  return { id: u.id, role: u.role, clientId: u.clientId ?? null, projectIds: u.projectIds ?? [] };
}

function pngUpload(name = "a.png") {
  return { name, type: "image/png", size: 5, bytes: Buffer.from("hello") };
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

describe("addAttachments", () => {
  it("lets a client upload to an issue on their own project", async () => {
    const s = await seed();
    const client = authUser({ id: s.clientUser.id, role: "CLIENT", clientId: s.c1.id });
    const created = await addAttachments(client, s.issue.id, [pngUpload()]);
    expect(created).toHaveLength(1);
    const row = await testPrisma.attachment.findUnique({ where: { id: created[0].id } });
    expect(row?.fileName).toBe("a.png");
    expect(row?.uploadedById).toBe(s.clientUser.id);
  });

  it("rejects a client uploading to another client's project issue", async () => {
    const s = await seed();
    const c2 = await testPrisma.client.create({ data: { name: "C2" } });
    const p2 = await testPrisma.project.create({ data: { name: "P2", clientId: c2.id } });
    const issue2 = await testPrisma.issue.create({
      data: { projectId: p2.id, title: "T2", type: "BUG", priority: "MEDIUM", createdById: s.dev.id },
    });
    const client = authUser({ id: s.clientUser.id, role: "CLIENT", clientId: s.c1.id });
    await expect(addAttachments(client, issue2.id, [pngUpload()])).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("rejects the whole batch when one file is invalid", async () => {
    const s = await seed();
    const client = authUser({ id: s.clientUser.id, role: "CLIENT", clientId: s.c1.id });
    const bad = { name: "x.svg", type: "image/svg+xml", size: 5, bytes: Buffer.from("x") };
    await expect(addAttachments(client, s.issue.id, [pngUpload(), bad])).rejects.toBeInstanceOf(ValidationError);
    const count = await testPrisma.attachment.count({ where: { issueId: s.issue.id } });
    expect(count).toBe(0);
  });
});

describe("deleteAttachment", () => {
  it("lets the uploader delete their own attachment", async () => {
    const s = await seed();
    const client = authUser({ id: s.clientUser.id, role: "CLIENT", clientId: s.c1.id });
    const [created] = await addAttachments(client, s.issue.id, [pngUpload()]);
    await deleteAttachment(client, created.id);
    expect(await testPrisma.attachment.findUnique({ where: { id: created.id } })).toBeNull();
  });

  it("lets staff delete any attachment on a visible project", async () => {
    const s = await seed();
    const client = authUser({ id: s.clientUser.id, role: "CLIENT", clientId: s.c1.id });
    const [created] = await addAttachments(client, s.issue.id, [pngUpload()]);
    const dev = authUser({ id: s.dev.id, role: "DEVELOPER", projectIds: [s.p1.id] });
    await deleteAttachment(dev, created.id);
    expect(await testPrisma.attachment.findUnique({ where: { id: created.id } })).toBeNull();
  });

  it("forbids staff who cannot view the attachment's project from deleting", async () => {
    const s = await seed();
    const uploader = authUser({ id: s.clientUser.id, role: "CLIENT", clientId: s.c1.id });
    const [created] = await addAttachments(uploader, s.issue.id, [pngUpload()]);
    const outsideDev = await testPrisma.user.create({ data: { email: "od@x.com", role: "DEVELOPER", name: "OutDev" } });
    const outsider = authUser({ id: outsideDev.id, role: "DEVELOPER", projectIds: [] });
    await expect(deleteAttachment(outsider, created.id)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("forbids a non-uploader client from deleting", async () => {
    const s = await seed();
    const uploader = authUser({ id: s.clientUser.id, role: "CLIENT", clientId: s.c1.id });
    const [created] = await addAttachments(uploader, s.issue.id, [pngUpload()]);
    const other = await testPrisma.user.create({ data: { email: "c2@x.com", role: "CLIENT", name: "Cli2", clientId: s.c1.id } });
    const otherClient = authUser({ id: other.id, role: "CLIENT", clientId: s.c1.id });
    await expect(deleteAttachment(otherClient, created.id)).rejects.toBeInstanceOf(ForbiddenError);
  });
});
