import { prisma } from "@/database/prisma";
import { getResultadosPorPaginaConfigurados } from "@/modules/settings/actions/queries";
import type { CursoExterno, CursoExternoFilters, PaginatedCursosExternos } from "../types";

type CursoDbRecord = Omit<CursoExterno, "proveedor" | "area"> & {
  proveedor: string;
  area: string;
  proveedorRef: {
    id: number;
    nombre: string;
  } | null;
  areaRef: {
    id: number;
    nombre: string;
  } | null;
};

const CURSO_INCLUDE = {
  proveedorRef: {
    select: {
      id: true,
      nombre: true,
    },
  },
  areaRef: {
    select: {
      id: true,
      nombre: true,
    },
  },
} as const;

function normalizeCurso(curso: CursoDbRecord): CursoExterno {
  return {
    id: curso.id,
    titulo: curso.titulo,
    proveedorId: curso.proveedorRef?.id ?? curso.proveedorId ?? null,
    proveedor: curso.proveedorRef?.nombre ?? curso.proveedor,
    areaId: curso.areaRef?.id ?? curso.areaId ?? null,
    area: curso.areaRef?.nombre ?? curso.area,
    nivel: curso.nivel,
    modalidad: curso.modalidad,
    duracion: curso.duracion,
    descripcion: curso.descripcion,
    enlace: curso.enlace,
    activo: curso.activo,
    createdAt: curso.createdAt,
    updatedAt: curso.updatedAt,
  };
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
              {
                proveedorRef: {
                  is: { nombre: { contains: filters.search, mode: "insensitive" as const } },
                },
              },
              { area: { contains: filters.search, mode: "insensitive" as const } },
              {
                areaRef: {
                  is: { nombre: { contains: filters.search, mode: "insensitive" as const } },
                },
              },
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
    include: CURSO_INCLUDE,
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
  const curso = await prisma.cursoExterno.findUnique({
    where: { id },
    include: CURSO_INCLUDE,
  });

  return curso ? normalizeCurso(curso) : null;
}

export async function getCursosExternosPublicados(limit?: number) {
  const cursos = await prisma.cursoExterno.findMany({
    where: { activo: true },
    include: CURSO_INCLUDE,
    orderBy: [{ createdAt: "desc" }, { titulo: "asc" }],
    ...(limit ? { take: limit } : {}),
  });

  return cursos.map(normalizeCurso);
}

export async function countCursosExternosPublicados() {
  return prisma.cursoExterno.count({ where: { activo: true } });
}
