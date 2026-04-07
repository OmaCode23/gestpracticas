/**
 * src/modules/formacion/actions/queries.ts
 *
 * Consultas estrictas y tipadas para formaciones en empresa.
 * Incluye filtros, búsqueda, paginación y relaciones.
 */

import { prisma } from "@/database/prisma";
import { Prisma } from "@prisma/client";
import { DEFAULT_RESULTADOS_POR_PAGINA } from "@/shared/catalogs/academico";
import { normalizeEmpresaCatalogos } from "@/shared/utils/empresaCatalogos";

const PER_PAGE = DEFAULT_RESULTADOS_POR_PAGINA;

export async function getFormacionesPaginated(params: {
  curso?: string;
  ciclo?: string;
  cursoCiclo?: number;
  search?: string;
  page?: number;
  perPage?: number;
  all?: boolean;
}) {
  const page = Math.max(1, params.page ?? 1);
  const perPage = params.perPage ?? PER_PAGE;
  const all = params.all ?? false;

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
      params.cursoCiclo
        ? {
            alumno: {
              is: {
                cursoCiclo: params.cursoCiclo,
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
            sectorId: true,
            sectorRef: {
              select: {
                nombre: true,
              },
            },
            localidadId: true,
            localidadRef: {
              select: {
                nombre: true,
              },
            },
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
      ...(all
        ? {}
        : {
            skip: (page - 1) * perPage,
            take: perPage,
          }),
    }),

    prisma.formacionEmpresa.count({ where }),
  ]);

  return {
    items: items.map((item) => ({
      ...item,
      empresa: normalizeEmpresaCatalogos(item.empresa),
      alumno: item.alumno
        ? {
            ...item.alumno,
            cicloFormativoId:
              item.alumno.cicloFormativoRef?.id ?? item.alumno.cicloFormativoId ?? null,
            cicloFormativoNombre: item.alumno.cicloFormativoRef?.nombre ?? null,
            cicloFormativoCodigo: item.alumno.cicloFormativoRef?.codigo ?? null,
          }
        : null,
    })),
    total,
    page,
    perPage: all ? total : perPage,
    totalPages: all ? 1 : Math.ceil(total / perPage),
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
          sectorId: true,
          sectorRef: {
            select: {
              nombre: true,
            },
          },
          localidadId: true,
          localidadRef: {
            select: {
              nombre: true,
            },
          },
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
    empresa: normalizeEmpresaCatalogos(item.empresa),
    alumno: item.alumno
      ? {
          ...item.alumno,
          cicloFormativoId:
            item.alumno.cicloFormativoRef?.id ?? item.alumno.cicloFormativoId ?? null,
          cicloFormativoNombre: item.alumno.cicloFormativoRef?.nombre ?? null,
          cicloFormativoCodigo: item.alumno.cicloFormativoRef?.codigo ?? null,
        }
      : null,
  };
}
