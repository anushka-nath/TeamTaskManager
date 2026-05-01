import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

async function disconnect() {
  await prisma.$disconnect();
}

process.on("beforeExit", disconnect);
process.on("SIGINT", async () => {
  await disconnect();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await disconnect();
  process.exit(0);
});
