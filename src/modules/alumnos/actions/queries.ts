/**
 * src/modules/alumnos/actions/queries.ts
 *
 * Consultas estrictas y tipadas para alumnos.
 * Incluye filtros, búsqueda, paginación y ordenación.
 */

import { prisma } from "@/database/prisma";
import { Prisma } from "@prisma/client";
import { DEFAULT_RESULTADOS_POR_PAGINA } from "@/shared/catalogs/academico";

const PER_PAGE = DEFAULT_RESULTADOS_POR_PAGINA;

export async function getAlumnosPaginated(params: {
  ciclo?: string;
  curso?: string;
  search?: string;
  page?: number;
  perPage?: number;
  all?: boolean;
}) {
  const page = Math.max(1, params.page ?? 1);
  const perPage = params.perPage ?? PER_PAGE;
  const all = params.all ?? false;

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

  const items = await prisma.alumno.findMany({
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
    ...(all
      ? {}
      : {
          skip: (page - 1) * perPage,
          take: perPage,
        }),
  });
  const total = all ? items.length : await prisma.alumno.count({ where });

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
    perPage: all ? total : perPage,
    totalPages: all ? 1 : Math.ceil(total / perPage),
  };
}

export async function getAlumnosPickerOptions() {
  return prisma.alumno.findMany({
    select: {
      id: true,
      nombre: true,
      nia: true,
      nif: true,
      nuss: true,
    },
    orderBy: { nombre: "asc" },
  });
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
