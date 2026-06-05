import { prisma } from "@/database/prisma";
import { CICLOS_FORMATIVOS_BASE } from "@/shared/catalogs/academico";
import { SECTORES } from "@/shared/catalogs/empresa";
import type { CicloFormativoInput, CicloFormativoUpdateInput } from "../types/ciclos";
import type { SectorInput, SectorUpdateInput } from "../types/sectores";

const CICLOS_BASE_BY_CODE = new Map(
  CICLOS_FORMATIVOS_BASE.map(({ codigo, nombre }) => [codigo, nombre])
);
const BASE_SECTOR_NAMES = new Set(SECTORES.map((nombre) => normalizeNombre(nombre)));

function normalizeNombre(value: string) {
  return value.trim();
}

function normalizeCodigo(value: string) {
  return value.trim().toUpperCase();
}

function getCicloBaseNombre(codigo?: string | null) {
  if (!codigo) return null;
  return CICLOS_BASE_BY_CODE.get(codigo) ?? null;
}

function isReservedCicloCode(codigo?: string | null) {
  return getCicloBaseNombre(codigo) !== null;
}

function isCanonicalBaseCiclo(ciclo: { nombre: string; codigo: string | null }) {
  const baseNombre = getCicloBaseNombre(ciclo.codigo);
  return baseNombre !== null && normalizeNombre(ciclo.nombre) === normalizeNombre(baseNombre);
}

async function getSectorUsageCounts(id: number) {
  const sector = await prisma.sector.findUnique({
    where: { id },
    select: {
      _count: {
        select: {
          empresas: true,
        },
      },
    },
  });

  return {
    empresasCount: sector?._count.empresas ?? 0,
  };
}

export async function createSector(data: SectorInput) {
  return prisma.sector.create({
    data: {
      nombre: normalizeNombre(data.nombre),
      activo: data.activo ?? true,
    },
  });
}

export async function updateSector(id: number, data: SectorUpdateInput) {
  const { empresasCount } = await getSectorUsageCounts(id);
  const isProtectedEdit = data.nombre !== undefined && empresasCount > 0;

  if (isProtectedEdit) {
    const error = new Error("SECTOR_EN_USO");
    (error as Error & { meta?: { empresasCount: number } }).meta = {
      empresasCount,
    };
    throw error;
  }

  return prisma.sector.update({
    where: { id },
    data: {
      ...(data.nombre !== undefined ? { nombre: normalizeNombre(data.nombre) } : {}),
      ...(data.activo !== undefined ? { activo: data.activo } : {}),
    },
  });
}

export async function restoreSectoresBase() {
  const sectores = await prisma.sector.findMany({
    select: {
      id: true,
      nombre: true,
      _count: {
        select: {
          empresas: true,
        },
      },
    },
  });

  const deletableIds = sectores
    .filter((sector) => !BASE_SECTOR_NAMES.has(normalizeNombre(sector.nombre)))
    .filter((sector) => sector._count.empresas === 0)
    .map((sector) => sector.id);

  const operations = [];

  if (deletableIds.length > 0) {
    operations.push(
      prisma.sector.deleteMany({
        where: {
          id: {
            in: deletableIds,
          },
        },
      })
    );
  }

  SECTORES.forEach((nombre) => {
    operations.push(
      prisma.sector.upsert({
        where: { nombre },
        update: {
          activo: true,
        },
        create: {
          nombre,
          activo: true,
        },
      })
    );
  });

  const transactionResults = await prisma.$transaction(operations);
  const deleteManyResult =
    deletableIds.length > 0
      ? (transactionResults[0] as { count?: number } | undefined)
      : undefined;
  const results = transactionResults.slice(deletableIds.length > 0 ? 1 : 0);

  return {
    total: results.length,
    items: results,
    deletedCustomCount: deleteManyResult?.count ?? 0,
  };
}

export async function deleteSector(id: number) {
  const { empresasCount } = await getSectorUsageCounts(id);

  if (empresasCount > 0) {
    const error = new Error("SECTOR_EN_USO");
    (error as Error & { meta?: { empresasCount: number } }).meta = {
      empresasCount,
    };
    throw error;
  }

  return prisma.sector.delete({
    where: { id },
  });
}

async function getCicloUsageCounts(id: number) {
  const ciclo = await prisma.cicloFormativo.findUnique({
    where: { id },
    select: {
      _count: {
        select: {
          alumnos: true,
          empresas: true,
        },
      },
    },
  });

  return {
    alumnosCount: ciclo?._count.alumnos ?? 0,
    empresasCount: ciclo?._count.empresas ?? 0,
  };
}

async function getCicloProtectionData(id: number) {
  const ciclo = await prisma.cicloFormativo.findUnique({
    where: { id },
    select: {
      id: true,
      nombre: true,
      codigo: true,
      _count: {
        select: {
          alumnos: true,
          empresas: true,
        },
      },
    },
  });

  return {
    ciclo,
    alumnosCount: ciclo?._count.alumnos ?? 0,
    empresasCount: ciclo?._count.empresas ?? 0,
  };
}

export async function createCicloFormativo(data: CicloFormativoInput) {
  const nombre = normalizeNombre(data.nombre);
  const codigo = normalizeCodigo(data.codigo);
  const baseNombre = getCicloBaseNombre(codigo);

  if (baseNombre !== null && nombre !== normalizeNombre(baseNombre)) {
    throw new Error("CICLO_FORMATIVO_CODIGO_RESERVADO");
  }

  return prisma.cicloFormativo.create({
    data: {
      nombre,
      codigo,
      activo: data.activo ?? true,
    },
  });
}

export async function updateCicloFormativo(id: number, data: CicloFormativoUpdateInput) {
  const { ciclo, alumnosCount, empresasCount } = await getCicloProtectionData(id);
  const isProtectedFieldEdit = data.nombre !== undefined || data.codigo !== undefined;

  if (ciclo && isProtectedFieldEdit && isReservedCicloCode(ciclo.codigo)) {
    throw new Error("CICLO_FORMATIVO_BASE_NO_EDITABLE");
  }

  if (
    ciclo &&
    data.codigo !== undefined &&
    isReservedCicloCode(normalizeCodigo(data.codigo)) &&
    normalizeCodigo(data.codigo) !== ciclo.codigo
  ) {
    throw new Error("CICLO_FORMATIVO_CODIGO_RESERVADO");
  }

  const isProtectedEdit =
    isProtectedFieldEdit && (alumnosCount > 0 || empresasCount > 0);

  if (isProtectedEdit) {
    const error = new Error("CICLO_FORMATIVO_EN_USO");
    (error as Error & { meta?: { alumnosCount: number; empresasCount: number } }).meta = {
      alumnosCount,
      empresasCount,
    };
    throw error;
  }

  return prisma.cicloFormativo.update({
    where: { id },
    data: {
      ...(data.nombre !== undefined ? { nombre: normalizeNombre(data.nombre) } : {}),
      ...(data.codigo !== undefined ? { codigo: normalizeCodigo(data.codigo) } : {}),
      ...(data.activo !== undefined ? { activo: data.activo } : {}),
    },
  });
}

export async function restoreCiclosFormativosBase() {
  const ciclos = await prisma.cicloFormativo.findMany({
    select: {
      id: true,
      nombre: true,
      codigo: true,
      activo: true,
      _count: {
        select: {
          alumnos: true,
          empresas: true,
        },
      },
    },
  });

  const legacyReservedConflicts = ciclos.filter(
    (ciclo) => isReservedCicloCode(ciclo.codigo) && !isCanonicalBaseCiclo(ciclo)
  );

  const blockingConflicts = legacyReservedConflicts.filter(
    (ciclo) => ciclo._count.alumnos > 0 || ciclo._count.empresas > 0
  );

  if (blockingConflicts.length > 0) {
    const error = new Error("CICLO_FORMATIVO_BASE_CONFLICT");
    (
      error as Error & {
        meta?: {
          codigos: string[];
          items: Array<{
            id: number;
            nombre: string;
            codigo: string | null;
            alumnosCount: number;
            empresasCount: number;
          }>;
        };
      }
    ).meta = {
      codigos: blockingConflicts
        .map((item) => item.codigo)
        .filter((codigo): codigo is string => Boolean(codigo)),
      items: blockingConflicts.map((item) => ({
        id: item.id,
        nombre: item.nombre,
        codigo: item.codigo,
        alumnosCount: item._count.alumnos,
        empresasCount: item._count.empresas,
      })),
    };
    throw error;
  }

  const deletableIds = ciclos
    .filter((ciclo) => !isCanonicalBaseCiclo(ciclo))
    .filter((ciclo) => ciclo._count.alumnos === 0 && ciclo._count.empresas === 0)
    .map((ciclo) => ciclo.id);

  const operations = [];

  if (deletableIds.length > 0) {
    operations.push(
      prisma.cicloFormativo.deleteMany({
        where: {
          id: {
            in: deletableIds,
          },
        },
      })
    );
  }

  CICLOS_FORMATIVOS_BASE.forEach(({ nombre, codigo }) => {
    operations.push(
      prisma.cicloFormativo.upsert({
        where: { codigo },
        update: {
          nombre,
          activo: true,
        },
        create: {
          nombre,
          codigo,
          activo: true,
        },
      })
    );
  });

  const transactionResults = await prisma.$transaction(operations);
  const deleteManyResult =
    deletableIds.length > 0
      ? (transactionResults[0] as { count?: number } | undefined)
      : undefined;
  const results = transactionResults.slice(deletableIds.length > 0 ? 1 : 0);

  return {
    total: results.length,
    items: results,
    deletedCustomCount: deleteManyResult?.count ?? 0,
  };
}

export async function deleteCicloFormativo(id: number) {
  const { ciclo, alumnosCount, empresasCount } = await getCicloProtectionData(id);

  if (ciclo && isReservedCicloCode(ciclo.codigo)) {
    throw new Error("CICLO_FORMATIVO_BASE_NO_ELIMINABLE");
  }

  if (alumnosCount > 0 || empresasCount > 0) {
    const error = new Error("CICLO_FORMATIVO_EN_USO");
    (error as Error & { meta?: { alumnosCount: number; empresasCount: number } }).meta = {
      alumnosCount,
      empresasCount,
    };
    throw error;
  }

  return prisma.cicloFormativo.delete({
    where: { id },
  });
}
