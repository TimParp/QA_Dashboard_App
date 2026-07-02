import type { Prisma } from "@prisma/client";

export async function recordActivity(
  tx: Prisma.TransactionClient,
  entry: {
    issueId: string;
    actorId: string;
    action: string;
    fromValue?: string | null;
    toValue?: string | null;
  },
): Promise<void> {
  await tx.activityLog.create({
    data: {
      issueId: entry.issueId,
      actorId: entry.actorId,
      action: entry.action,
      fromValue: entry.fromValue ?? null,
      toValue: entry.toValue ?? null,
    },
  });
}
