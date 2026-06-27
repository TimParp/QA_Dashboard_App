import "dotenv/config";
import { prisma } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth/password";
import { createInvite } from "../src/lib/auth/invite";

async function main() {
  const adminEmail = "admin@example.com";
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Admin",
      role: "ADMIN",
      passwordHash: await hashPassword("admin1234"),
    },
  });

  const client =
    (await prisma.client.findFirst({ where: { name: "DroneTrax" } })) ??
    (await prisma.client.create({ data: { name: "DroneTrax" } }));
  const project =
    (await prisma.project.findFirst({
      where: { name: "DroneTrax", clientId: client.id },
    })) ??
    (await prisma.project.create({
      data: { name: "DroneTrax", clientId: client.id },
    }));
  await prisma.projectMembership.upsert({
    where: { userId_projectId: { userId: admin.id, projectId: project.id } },
    update: {},
    create: { userId: admin.id, projectId: project.id },
  });

  console.log("Seed complete.");
  console.log("Admin login: admin@example.com / admin1234");

  const existingInvite = await prisma.invite.findFirst({
    where: { email: "dev@example.com", acceptedAt: null },
  });
  if (!existingInvite) {
    const { token } = await createInvite({
      email: "dev@example.com",
      role: "DEVELOPER",
    });
    console.log(`Developer invite: http://localhost:3000/invite/${token}`);
  }
}

main()
  .then(async () => { await prisma.$disconnect(); process.exit(0); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
