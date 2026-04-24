import { PrismaClient } from "@prisma/client";

/**
 * Singleton de PrismaClient para Next.js.
 *
 * En desarrollo, Next.js recarga los modulos con hot-reload; si se crea
 * un cliente por recarga se terminan agotando las conexiones.
 * Este patron conserva una unica instancia en `globalThis`.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
