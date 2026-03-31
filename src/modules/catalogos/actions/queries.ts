import { prisma } from "@/database/prisma";

export async function getEmpresaCatalogos() {
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
      select: { nombre: true },
    }),
  ]);

  return {
    sectores: sectores.map((item) => item.nombre),
    localidades: localidades.map((item) => item.nombre),
    ciclosFormativos: ciclosFormativos.map((item) => item.nombre),
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
