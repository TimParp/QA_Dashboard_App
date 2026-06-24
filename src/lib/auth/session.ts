import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";
import type { AuthUser, Role } from "@/lib/authz/authorize";

export async function getAuthUser(): Promise<AuthUser | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  const user = await prisma.user.findUnique({
    where: { id },
    include: { memberships: { select: { projectId: true } } },
  });
  if (!user) return null;

  return {
    id: user.id,
    role: user.role as Role,
    clientId: user.clientId,
    projectIds: user.memberships.map((m) => m.projectId),
  };
}
