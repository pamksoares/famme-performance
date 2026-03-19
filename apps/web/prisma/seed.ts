import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("senha123", 12);

  const user = await prisma.user.upsert({
    where: { email: "pamella@famme.app" },
    update: {},
    create: {
      email: "pamella@famme.app",
      passwordHash,
      name: "Pamella",
      modality: "CROSSFIT",
      plan: "PRO",
    },
  });

  await prisma.cycleEntry.upsert({
    where: { id: "seed-cycle" },
    update: {},
    create: {
      id: "seed-cycle",
      userId: user.id,
      startDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 dias atrás
      cycleLengthDays: 28,
    },
  });

  console.log("✓ Seed concluído — user:", user.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
