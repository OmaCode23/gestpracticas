/**
 * src/modules/alumnos/actions/queries.ts
 *
 * Consultas estrictas y tipadas para alumnos.
 * Incluye filtros, búsqueda, paginación y ordenación.
 */

import { prisma } from "@/database/prisma";

const PER_PAGE = 10;

export async function getAlumnosPaginated(params: {
  ciclo?: string;
  curso?: string;
  search?: string;
  page?: number;
  perPage?: number;
}) {
  const page = Math.max(1, params.page ?? 1);
  const perPage = params.perPage ?? PER_PAGE;

  const where: any = {
    AND: [
      params.ciclo ? { ciclo: params.ciclo } : {},
      params.curso ? { curso: params.curso } : {},
      params.search
        ? {
            OR: [
              { nombre: { contains: params.search, mode: "insensitive" } },
              { nia: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {},
    ],
  };

  const [items, total] = await Promise.all([
    prisma.alumno.findMany({
      where,
      orderBy: { nombre: "asc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.alumno.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

export async function getAlumnoById(id: number) {
  return prisma.alumno.findUnique({
    where: { id },
  });
}
