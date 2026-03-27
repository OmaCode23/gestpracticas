import { prisma } from "@/database/prisma";
import { CICLOS_FORMATIVOS, CICLO_LABEL } from "@/shared/catalogs/academico";
import { SECTORES } from "@/shared/catalogs/empresa";
import { LOCALIDADES } from "@/shared/catalogs/ubicacion";

function getCodigoCiclo(nombre: string) {
  const code = CICLO_LABEL[nombre];
  return code && code !== nombre ? code : null;
}

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
    data: CICLOS_FORMATIVOS.map((nombre) => ({
      nombre,
      codigo: getCodigoCiclo(nombre),
    })),
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
      select: { nombre: true },
    }),
  ]);

  return {
    sectores: sectores.map((item) => item.nombre),
    localidades: localidades.map((item) => item.nombre),
    ciclosFormativos: ciclosFormativos.map((item) => item.nombre),
  };
}
