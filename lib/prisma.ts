// lib/prisma.ts

import { PrismaClient } from "@prisma/client";

// Reutilizamos la misma instancia de PrismaClient entre recargas en desarrollo,
// guardándola en el objeto global de Node.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}