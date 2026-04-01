/**
 * src/modules/formacion/actions/queries.ts
 *
 * Consultas estrictas y tipadas para formaciones en empresa.
 * Incluye filtros, búsqueda, paginación y relaciones.
 */

import { prisma } from "@/database/prisma";
import { Prisma } from "@prisma/client";

const PER_PAGE = 10;

export async function getFormacionesPaginated(params: {
  curso?: string;
  ciclo?: string;
  search?: string;
  page?: number;
  perPage?: number;
}) {
  const page = Math.max(1, params.page ?? 1);
  const perPage = params.perPage ?? PER_PAGE;

  const where: Prisma.FormacionEmpresaWhereInput = {
    AND: [
      params.curso ? { curso: params.curso } : {},
      params.ciclo
        ? {
            alumno: {
              is: {
                cicloFormativoRef: {
                  is: {
                    nombre: params.ciclo,
                  },
                },
              },
            },
          }
        : {},
      params.search
        ? {
            OR: [
              {
                empresa: {
                  nombre: {
                    contains: params.search,
                    mode: "insensitive",
                  },
                },
              },
              {
                alumno: {
                  nombre: {
                    contains: params.search,
                    mode: "insensitive",
                  },
                },
              },
              {
                alumno: {
                  nia: {
                    contains: params.search,
                    mode: "insensitive",
                  },
                },
              },
            ],
          }
        : {},
    ],
  };

  const [items, total] = await Promise.all([
    prisma.formacionEmpresa.findMany({
      where,
      include: {
        empresa: {
          select: {
            id: true,
            nombre: true,
            sector: true,
            localidad: true,
            cicloFormativoId: true,
            cicloFormativoRef: {
              select: {
                nombre: true,
              },
            },
          },
        },
        alumno: {
          select: {
            id: true,
            nombre: true,
            nia: true,
            nif: true,
            nuss: true,
            cicloFormativoId: true,
            cursoCiclo: true,
            curso: true,
            cicloFormativoRef: {
              select: {
                id: true,
                nombre: true,
                codigo: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),

    prisma.formacionEmpresa.count({ where }),
  ]);

  return {
    items: items.map((item) => ({
      ...item,
      empresa: {
        ...item.empresa,
        cicloFormativo: item.empresa.cicloFormativoRef?.nombre ?? null,
      },
      alumno: item.alumno
        ? {
            ...item.alumno,
            cicloFormativoId:
              item.alumno.cicloFormativoRef?.id ?? item.alumno.cicloFormativoId ?? null,
            cicloFormativoNombre: item.alumno.cicloFormativoRef?.nombre ?? null,
            cicloFormativoCodigo: item.alumno.cicloFormativoRef?.codigo ?? null,
            ciclo: item.alumno.cicloFormativoRef?.nombre ?? "",
          }
        : null,
    })),
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

export async function getFormacionById(id: number) {
  const item = await prisma.formacionEmpresa.findUnique({
    where: { id },
    include: {
      empresa: {
        select: {
          id: true,
          nombre: true,
          sector: true,
          localidad: true,
          cicloFormativoId: true,
          cicloFormativoRef: {
            select: {
              nombre: true,
            },
          },
        },
      },
      alumno: {
        select: {
          id: true,
          nombre: true,
          nia: true,
          nif: true,
          nuss: true,
          cicloFormativoId: true,
          cursoCiclo: true,
          curso: true,
          cicloFormativoRef: {
            select: {
              id: true,
              nombre: true,
              codigo: true,
            },
          },
        },
      },
    },
  });

  if (!item) return null;

  return {
    ...item,
    empresa: {
      ...item.empresa,
      cicloFormativo: item.empresa.cicloFormativoRef?.nombre ?? null,
    },
    alumno: item.alumno
      ? {
          ...item.alumno,
          cicloFormativoId:
            item.alumno.cicloFormativoRef?.id ?? item.alumno.cicloFormativoId ?? null,
          cicloFormativoNombre: item.alumno.cicloFormativoRef?.nombre ?? null,
          cicloFormativoCodigo: item.alumno.cicloFormativoRef?.codigo ?? null,
          ciclo: item.alumno.cicloFormativoRef?.nombre ?? "",
        }
      : null,
  };
}
