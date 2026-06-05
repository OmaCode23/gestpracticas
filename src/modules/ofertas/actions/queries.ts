import { OfertaEstado } from "@prisma/client";
import { prisma } from "@/database/prisma";
import { getResultadosPorPaginaConfigurados } from "@/modules/settings/actions/queries";
import type { OfertaPractica, OfertaPracticaFilters, PaginatedOfertasPracticas } from "../types";

type OfertaDbRecord = {
  id: number;
  titulo: string;
  empresa: string;
  empresaId: number | null;
  cicloFormativoId: number | null;
  plazas: number;
  requisitos: string | null;
  periodo: string | null;
  descripcion: string | null;
  estado: OfertaEstado;
  createdAt: Date;
  updatedAt: Date;
  cicloFormativoRef: {
    id: number;
    nombre: string;
    codigo: string | null;
  } | null;
  empresaRef: {
    id: number;
    nombre: string;
  } | null;
};

const OFERTA_INCLUDE = {
  empresaRef: {
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
} as const;

function normalizeOferta(oferta: OfertaDbRecord): OfertaPractica {
  return {
    id: oferta.id,
    titulo: oferta.titulo,
    empresaId: oferta.empresaRef?.id ?? oferta.empresaId ?? null,
    empresa: oferta.empresaRef?.nombre ?? oferta.empresa,
    cicloFormativoId: oferta.cicloFormativoRef?.id ?? oferta.cicloFormativoId ?? null,
    cicloFormativo: oferta.cicloFormativoRef?.nombre ?? null,
    cicloFormativoCodigo: oferta.cicloFormativoRef?.codigo ?? null,
    plazas: oferta.plazas,
    requisitos: oferta.requisitos,
    periodo: oferta.periodo,
    descripcion: oferta.descripcion,
    estado: oferta.estado,
    createdAt: oferta.createdAt,
    updatedAt: oferta.updatedAt,
  };
}

export async function getOfertasPracticas(
  filters: OfertaPracticaFilters
): Promise<PaginatedOfertasPracticas> {
  const page = Math.max(1, filters.page ?? 1);
  const perPage =
    filters.all ? undefined : filters.limit ?? (await getResultadosPorPaginaConfigurados());

  const andClauses = [
    ...(filters.estado ? [{ estado: filters.estado }] : []),
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
              { titulo: { contains: filters.search, mode: "insensitive" as const } },
              { empresa: { contains: filters.search, mode: "insensitive" as const } },
              {
                empresaRef: {
                  is: { nombre: { contains: filters.search, mode: "insensitive" as const } },
                },
              },
              { requisitos: { contains: filters.search, mode: "insensitive" as const } },
              { periodo: { contains: filters.search, mode: "insensitive" as const } },
            ],
          },
        ]
      : []),
  ];

  const where = andClauses.length > 0 ? { AND: andClauses } : {};

  const items = await prisma.ofertaPractica.findMany({
    where,
    include: OFERTA_INCLUDE,
    orderBy: [{ createdAt: "desc" }, { titulo: "asc" }],
    ...(perPage ? { skip: (page - 1) * perPage, take: perPage } : {}),
  });

  const total = perPage ? await prisma.ofertaPractica.count({ where }) : items.length;

  return {
    items: items.map(normalizeOferta),
    total,
    page,
    perPage: perPage ?? total,
    totalPages: perPage ? Math.ceil(total / perPage) : total > 0 ? 1 : 0,
  };
}

export async function getOfertaPracticaById(id: number): Promise<OfertaPractica | null> {
  const oferta = await prisma.ofertaPractica.findUnique({
    where: { id },
    include: OFERTA_INCLUDE,
  });

  return oferta ? normalizeOferta(oferta) : null;
}

export async function getOfertasPracticasPublicadas(limit?: number) {
  const ofertas = await prisma.ofertaPractica.findMany({
    where: { estado: OfertaEstado.PUBLICADA },
    include: OFERTA_INCLUDE,
    orderBy: [{ createdAt: "desc" }, { titulo: "asc" }],
    ...(limit ? { take: limit } : {}),
  });

  return ofertas.map(normalizeOferta);
}

export async function countOfertasPracticasPublicadas() {
  return prisma.ofertaPractica.count({ where: { estado: OfertaEstado.PUBLICADA } });
}
