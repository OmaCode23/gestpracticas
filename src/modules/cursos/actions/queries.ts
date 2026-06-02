import { prisma } from "@/database/prisma";
import { getResultadosPorPaginaConfigurados } from "@/modules/settings/actions/queries";
import type { CursoExterno, CursoExternoFilters, PaginatedCursosExternos } from "../types";

function normalizeCurso(curso: CursoExterno): CursoExterno {
  return curso;
}

export async function getCursosExternos(
  filters: CursoExternoFilters
): Promise<PaginatedCursosExternos> {
  const page = Math.max(1, filters.page ?? 1);
  const perPage =
    filters.all ? undefined : filters.limit ?? (await getResultadosPorPaginaConfigurados());

  const andClauses = [
    ...(filters.activo !== undefined ? [{ activo: filters.activo }] : []),
    ...(filters.search
      ? [
          {
            OR: [
              { titulo: { contains: filters.search, mode: "insensitive" as const } },
              { proveedor: { contains: filters.search, mode: "insensitive" as const } },
              { area: { contains: filters.search, mode: "insensitive" as const } },
              { nivel: { contains: filters.search, mode: "insensitive" as const } },
              { modalidad: { contains: filters.search, mode: "insensitive" as const } },
            ],
          },
        ]
      : []),
  ];

  const where = andClauses.length > 0 ? { AND: andClauses } : {};

  const items = await prisma.cursoExterno.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { titulo: "asc" }],
    ...(perPage ? { skip: (page - 1) * perPage, take: perPage } : {}),
  });

  const total = perPage ? await prisma.cursoExterno.count({ where }) : items.length;

  return {
    items: items.map(normalizeCurso),
    total,
    page,
    perPage: perPage ?? total,
    totalPages: perPage ? Math.ceil(total / perPage) : total > 0 ? 1 : 0,
  };
}

export async function getCursoExternoById(id: number) {
  return prisma.cursoExterno.findUnique({ where: { id } });
}

export async function getCursosExternosPublicados(limit?: number) {
  return prisma.cursoExterno.findMany({
    where: { activo: true },
    orderBy: [{ createdAt: "desc" }, { titulo: "asc" }],
    ...(limit ? { take: limit } : {}),
  });
}

export async function countCursosExternosPublicados() {
  return prisma.cursoExterno.count({ where: { activo: true } });
}
