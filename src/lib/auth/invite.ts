import { randomBytes } from "node:crypto";
import type { Role } from "@/lib/authz/authorize";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";

export async function createInvite(input: {
  email: string;
  role: Role;
  clientId?: string | null;
  ttlHours?: number;
}): Promise<{ token: string }> {
  const token = randomBytes(24).toString("hex");
  const ttlHours = input.ttlHours ?? 72;
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

  await prisma.invite.create({
    data: {
      email: input.email,
      role: input.role,
      clientId: input.clientId ?? null,
      token,
      expiresAt,
    },
  });

  return { token };
}

export async function acceptInvite(input: {
  token: string;
  name: string;
  password: string;
}): Promise<{ userId: string }> {
  const passwordHash = await hashPassword(input.password);

  return prisma.$transaction(async (tx) => {
    const invite = await tx.invite.findUnique({ where: { token: input.token } });

    if (
      !invite ||
      invite.acceptedAt !== null ||
      invite.expiresAt.getTime() < Date.now()
    ) {
      throw new Error("invalid or expired invite");
    }

    const user = await tx.user.create({
      data: {
        email: invite.email,
        name: input.name,
        role: invite.role,
        clientId: invite.clientId,
        passwordHash,
      },
    });

    await tx.invite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });

    return { userId: user.id };
  });
}
