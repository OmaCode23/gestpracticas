import { prisma } from "@/database/prisma";
import { getResultadosPorPaginaConfigurados } from "@/modules/settings/actions/queries";
import type { ProfesorFilters, PaginatedProfesores, Profesor } from "../types";

function normalizeProfesor(profesor: {
  id: number;
  nombre: string;
  nif: string | null;
  especialidad: string | null;
  telefono: string | null;
  email: string | null;
  cicloFormativoId: number | null;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
  cicloFormativoRef: { id: number; nombre: string; codigo: string | null } | null;
}): Profesor {
  return {
    id: profesor.id,
    nombre: profesor.nombre,
    nif: profesor.nif,
    especialidad: profesor.especialidad,
    telefono: profesor.telefono,
    email: profesor.email,
    cicloFormativoId: profesor.cicloFormativoRef?.id ?? null,
    cicloFormativo: profesor.cicloFormativoRef?.nombre ?? null,
    cicloFormativoCodigo: profesor.cicloFormativoRef?.codigo ?? null,
    activo: profesor.activo,
    createdAt: profesor.createdAt,
    updatedAt: profesor.updatedAt,
  };
}

export async function getProfesores(filters: ProfesorFilters): Promise<PaginatedProfesores> {
  const page = Math.max(1, filters.page ?? 1);
  const perPage =
    filters.all ? undefined : filters.limit ?? (await getResultadosPorPaginaConfigurados());

  const andClauses = [
    ...(filters.ciclo
      ? [
          {
            cicloFormativoRef: {
              is: { nombre: filters.ciclo },
            },
          },
        ]
      : []),
    ...(filters.search
      ? [
          {
            OR: [
              { nombre: { contains: filters.search, mode: "insensitive" as const } },
              { nif: { contains: filters.search, mode: "insensitive" as const } },
              { especialidad: { contains: filters.search, mode: "insensitive" as const } },
            ],
          },
        ]
      : []),
  ];

  const where = andClauses.length > 0 ? { AND: andClauses } : {};

  const items = await prisma.profesor.findMany({
    where,
    include: {
      cicloFormativoRef: {
        select: { id: true, nombre: true, codigo: true },
      },
    },
    orderBy: { nombre: "asc" },
    ...(perPage
      ? { skip: (page - 1) * perPage, take: perPage }
      : {}),
  });

  const total = perPage ? await prisma.profesor.count({ where }) : items.length;

  return {
    items: items.map(normalizeProfesor),
    total,
    page,
    perPage: perPage ?? total,
    totalPages: perPage ? Math.ceil(total / perPage) : (total > 0 ? 1 : 0),
  };
}

export async function getProfesorById(id: number): Promise<Profesor | null> {
  const profesor = await prisma.profesor.findUnique({
    where: { id },
    include: {
      cicloFormativoRef: {
        select: { id: true, nombre: true, codigo: true },
      },
    },
  });

  if (!profesor) return null;

  return normalizeProfesor(profesor);
}

export async function getProfesoresPickerOptions() {
  return prisma.profesor.findMany({
    select: { id: true, nombre: true },
    orderBy: { nombre: "asc" },
  });
}
