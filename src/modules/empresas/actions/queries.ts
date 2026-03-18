/**
 * modules/empresas/actions/queries.ts
 *
 * Funciones que consultan la base de datos directamente con Prisma.
 * Solo se llaman desde Server Components o API Routes (no desde el cliente).
 *
 * Al ser Server-side, podemos importar prisma sin problema.
 */

import { prisma } from "@/database/prisma";
import type { EmpresaFilters, PaginatedEmpresas } from "../types";

const PER_PAGE = 5;

export async function getEmpresas(filters: EmpresaFilters): Promise<PaginatedEmpresas> {
  const page = Math.max(1, filters.page ?? 1)

  const where = {
    ...(filters.sector ? { sector: filters.sector } : {}),
    ...(filters.localidad ? { localidad: filters.localidad } : {}),
    ...(filters.search
      ? {
        OR: [
          {
            nombre: {
              contains: filters.search,
              mode: "insensitive" as const,
            },
          },
          {
            cif: {
              contains: filters.search,
              mode: "insensitive" as const,
            },
          },
        ],
      }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.empresa.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.empresa.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    perPage: PER_PAGE,
    totalPages: Math.ceil(total / PER_PAGE),
  };
};

export async function getEmpresaById(id: number) {
  return prisma.empresa.findUnique({
    where: { id },
  });
}
