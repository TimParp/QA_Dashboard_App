import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { testPrisma, resetDb } from "@/test/db";
import { createInvite, acceptInvite } from "@/lib/auth/invite";
import { verifyPassword } from "@/lib/auth/password";

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await testPrisma.$disconnect();
});

describe("invite flow", () => {
  it("creates an invite with a token", async () => {
    const { token } = await createInvite({ email: "dev@example.com", role: "DEVELOPER" });
    expect(token.length).toBeGreaterThan(10);
    const invite = await testPrisma.invite.findUnique({ where: { token } });
    expect(invite?.email).toBe("dev@example.com");
  });

  it("accepts an invite and creates a usable user", async () => {
    const { token } = await createInvite({ email: "dev@example.com", role: "DEVELOPER" });
    const { userId } = await acceptInvite({ token, name: "Dev One", password: "secret123" });

    const user = await testPrisma.user.findUnique({ where: { id: userId } });
    expect(user?.email).toBe("dev@example.com");
    expect(user?.role).toBe("DEVELOPER");
    expect(await verifyPassword("secret123", user!.passwordHash!)).toBe(true);

    const invite = await testPrisma.invite.findUnique({ where: { token } });
    expect(invite?.acceptedAt).not.toBeNull();
  });

  it("rejects a token that was already accepted", async () => {
    const { token } = await createInvite({ email: "dev@example.com", role: "DEVELOPER" });
    await acceptInvite({ token, name: "Dev One", password: "secret123" });
    await expect(
      acceptInvite({ token, name: "Dup", password: "secret123" }),
    ).rejects.toThrow("invalid or expired invite");
  });

  it("rejects an expired invite", async () => {
    const { token } = await createInvite({ email: "x@example.com", role: "QA", ttlHours: -1 });
    await expect(
      acceptInvite({ token, name: "X", password: "secret123" }),
    ).rejects.toThrow("invalid or expired invite");
  });
});
