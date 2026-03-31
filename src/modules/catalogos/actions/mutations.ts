import { prisma } from "@/database/prisma";
import { CICLOS_FORMATIVOS_BASE } from "@/shared/catalogs/academico";
import type { CicloFormativoInput, CicloFormativoUpdateInput } from "../types/ciclos";

function normalizeNombre(value: string) {
  return value.trim();
}

function normalizeCodigo(value: string) {
  return value.trim().toUpperCase();
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

export async function createCicloFormativo(data: CicloFormativoInput) {
  return prisma.cicloFormativo.create({
    data: {
      nombre: normalizeNombre(data.nombre),
      codigo: normalizeCodigo(data.codigo),
      activo: data.activo ?? true,
    },
  });
}

export async function updateCicloFormativo(id: number, data: CicloFormativoUpdateInput) {
  const { alumnosCount, empresasCount } = await getCicloUsageCounts(id);
  const isProtectedEdit =
    (data.nombre !== undefined || data.codigo !== undefined) &&
    (alumnosCount > 0 || empresasCount > 0);

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
  const results = await prisma.$transaction(
    CICLOS_FORMATIVOS_BASE.map(({ nombre, codigo }) =>
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
    )
  );

  return {
    total: results.length,
    items: results,
  };
}

export async function deleteCicloFormativo(id: number) {
  const { alumnosCount, empresasCount } = await getCicloUsageCounts(id);

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
