import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) throw new Error("TEST_DATABASE_URL is not set in .env");
process.env.DATABASE_URL = connectionString;

export const testPrisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

export async function resetDb() {
  // Order matters because of FKs; delete children before parents.
  await testPrisma.notification.deleteMany();
  await testPrisma.activityLog.deleteMany();
  await testPrisma.comment.deleteMany();
  await testPrisma.attachment.deleteMany();
  await testPrisma.issue.deleteMany();
  await testPrisma.projectMembership.deleteMany();
  await testPrisma.project.deleteMany();
  await testPrisma.invite.deleteMany();
  await testPrisma.user.deleteMany();
  await testPrisma.client.deleteMany();
}
