/**
 * modules/empresas/actions/queries.ts
 *
 * Funciones que consultan la base de datos directamente con Prisma.
 * Solo se llaman desde Server Components o API Routes (no desde el cliente).
 *
 * Al ser Server-side, podemos importar prisma sin problema.
 */

import { prisma } from "@/database/prisma";
import { getResultadosPorPaginaConfigurados } from "@/modules/settings/actions/queries";
import { normalizeEmpresaCatalogos } from "@/shared/utils/empresaCatalogos";
import type { EmpresaFilters, PaginatedEmpresas } from "../types";

export async function getEmpresas(filters: EmpresaFilters): Promise<PaginatedEmpresas> {
  const defaultPerPage = await getResultadosPorPaginaConfigurados();
  const page = Math.max(1, filters.page ?? 1);
  const perPage = filters.all ? undefined : filters.limit ?? defaultPerPage;
  const andClauses = [
    ...(filters.sector
      ? [
          {
            sectorRef: {
              is: {
                nombre: filters.sector,
              },
            },
          },
        ]
      : []),
    ...(filters.localidad
      ? [
          {
            localidadRef: {
              is: {
                nombre: filters.localidad,
              },
            },
          },
        ]
      : []),
    ...(filters.search
      ? [
          {
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
          },
        ]
      : []),
  ];
  const where = andClauses.length > 0 ? { AND: andClauses } : {};

  const [items, total] = await Promise.all([
    prisma.empresa.findMany({
      where,
      include: {
        sectorRef: {
          select: {
            id: true,
            nombre: true,
          },
        },
        localidadRef: {
          select: {
            id: true,
            nombre: true,
          },
        },
        cicloFormativoRef: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
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
    items: items.map(normalizeEmpresaCatalogos),
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
      sectorRef: {
        select: {
          id: true,
          nombre: true,
        },
      },
      localidadRef: {
        select: {
          id: true,
          nombre: true,
        },
      },
      cicloFormativoRef: {
        select: {
          id: true,
          nombre: true,
          codigo: true,
        },
      },
    },
  });

  if (!empresa) return null;

  return normalizeEmpresaCatalogos(empresa);
}
