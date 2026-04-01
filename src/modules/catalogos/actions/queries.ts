import { prisma } from "@/database/prisma";
import { CICLOS_FORMATIVOS_BASE } from "@/shared/catalogs/academico";
import { SECTORES } from "@/shared/catalogs/empresa";
import { LOCALIDADES } from "@/shared/catalogs/ubicacion";

export async function syncCatalogosBase() {
  await prisma.sector.createMany({
    data: SECTORES.map((nombre) => ({ nombre })),
    skipDuplicates: true,
  });

  await prisma.localidad.createMany({
    data: LOCALIDADES.map((nombre) => ({ nombre })),
    skipDuplicates: true,
  });

  await prisma.cicloFormativo.createMany({
    data: CICLOS_FORMATIVOS_BASE,
    skipDuplicates: true,
  });
}

export async function getEmpresaCatalogos() {
  await syncCatalogosBase();

  const [sectores, localidades, ciclosFormativos] = await Promise.all([
    prisma.sector.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      select: { nombre: true },
    }),
    prisma.localidad.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      select: { nombre: true },
    }),
    prisma.cicloFormativo.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true },
    }),
  ]);

  return {
    sectores: sectores.map((item) => item.nombre),
    localidades: localidades.map((item) => item.nombre),
    ciclosFormativos: ciclosFormativos.map((item) => ({
      id: item.id,
      nombre: item.nombre,
    })),
  };
}

export async function getCiclosFormativos() {
  return prisma.cicloFormativo.findMany({
    orderBy: { nombre: "asc" },
    select: {
      id: true,
      nombre: true,
      codigo: true,
      activo: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          alumnos: true,
          empresas: true,
        },
      },
    },
  });
}

export async function getCiclosFormativosActivos() {
  const ciclos = await prisma.cicloFormativo.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
    select: { nombre: true },
  });

  return ciclos.map((item) => item.nombre);
}

export async function getCiclosFormativosActivosOptions() {
  return prisma.cicloFormativo.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
    select: {
      id: true,
      nombre: true,
      codigo: true,
    },
  });
}
