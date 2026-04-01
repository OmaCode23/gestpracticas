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
  const page = Math.max(1, filters.page ?? 1);
  const perPage = filters.all ? undefined : filters.limit ?? PER_PAGE;

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
      include: {
        cicloFormativoRef: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      ...(perPage
        ? {
            skip: (page - 1) * perPage,
            take: perPage,
          }
        : {}),
    }),
    prisma.empresa.count({ where }),
  ]);

  return {
    items: items.map((item) => ({
      ...item,
      cicloFormativo: item.cicloFormativoRef?.nombre ?? null,
      cicloFormativoId: item.cicloFormativoRef?.id ?? item.cicloFormativoId ?? null,
    })),
    total,
    page,
    perPage: perPage ?? total,
    totalPages: perPage ? Math.ceil(total / perPage) : (total > 0 ? 1 : 0),
  };
};

export async function getEmpresaById(id: number) {
  const empresa = await prisma.empresa.findUnique({
    where: { id },
    include: {
      cicloFormativoRef: {
        select: {
          id: true,
          nombre: true,
        },
      },
    },
  });

  if (!empresa) return null;

  return {
    ...empresa,
    cicloFormativo: empresa.cicloFormativoRef?.nombre ?? null,
    cicloFormativoId: empresa.cicloFormativoRef?.id ?? empresa.cicloFormativoId ?? null,
  };
}
