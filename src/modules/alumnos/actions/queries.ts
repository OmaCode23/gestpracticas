/**
 * src/modules/alumnos/actions/queries.ts
 *
 * Consultas estrictas y tipadas para alumnos.
 * Incluye filtros, búsqueda, paginación y ordenación.
 */

import { prisma } from "@/database/prisma";
import { Prisma } from "@prisma/client";

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

  const where: Prisma.AlumnoWhereInput = {
    ...(params.ciclo
      ? {
          cicloFormativoRef: {
            is: { nombre: params.ciclo },
          },
        }
      : {}),
    ...(params.curso ? { curso: params.curso } : {}),
    ...(params.search
      ? {
          OR: [
            { nombre: { contains: params.search, mode: "insensitive" } },
            { nia: { contains: params.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.alumno.findMany({
      where,
      include: {
        cicloFormativoRef: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
          },
        },
      },
      orderBy: { nombre: "asc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.alumno.count({ where }),
  ]);

  return {
    items: items.map((item) => ({
      ...item,
      cicloFormativoId: item.cicloFormativoRef?.id ?? item.cicloFormativoId ?? null,
      cicloFormativoNombre: item.cicloFormativoRef?.nombre ?? null,
      cicloFormativoCodigo: item.cicloFormativoRef?.codigo ?? null,
      cvUpdatedAt: item.cvUpdatedAt?.toISOString() ?? null,
    })),
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

export async function getAlumnoById(id: number) {
  const alumno = await prisma.alumno.findUnique({
    where: { id },
    include: {
      cicloFormativoRef: {
        select: {
          id: true,
          nombre: true,
          codigo: true,
        },
      },
    },
  });

  if (!alumno) return null;

  return {
    ...alumno,
    cicloFormativoId: alumno.cicloFormativoRef?.id ?? alumno.cicloFormativoId ?? null,
    cicloFormativoNombre: alumno.cicloFormativoRef?.nombre ?? null,
    cicloFormativoCodigo: alumno.cicloFormativoRef?.codigo ?? null,
    cvUpdatedAt: alumno.cvUpdatedAt?.toISOString() ?? null,
  };
}
