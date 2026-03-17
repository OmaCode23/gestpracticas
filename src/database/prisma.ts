/**
 * database/prisma.ts
 *
 * Singleton de PrismaClient para Next.js.
 *
 * En desarrollo, Next.js recarga los módulos con hot-reload, lo que
 * crearía múltiples instancias de PrismaClient y agotaría las
 * conexiones a la BD. Este patrón guarda la instancia en `globalThis`
 * para reutilizarla entre recargas.
 *
 * En producción siempre se crea una única instancia nueva.
 */

import { PrismaClient } from "@prisma/client";

// Extiende el tipo global para guardar el cliente en dev
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Muestra las queries en consola solo en desarrollo
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
