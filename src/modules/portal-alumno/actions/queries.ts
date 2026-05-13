import { prisma } from "@/database/prisma";
import { CURSOS_EXTERNOS_PREVIEW } from "../data";

export async function getPortalAlumnoSummary() {
  const empresasDisponibles = await prisma.empresa.count();

  return {
    empresasDisponibles,
    ofertasPublicadas: 0,
    cursosDisponibles: CURSOS_EXTERNOS_PREVIEW.length,
  };
}

export async function getPortalEmpresasDisponibles(limit = 8) {
  const empresas = await prisma.empresa.findMany({
    take: limit,
    orderBy: { nombre: "asc" },
    include: {
      sectorRef: {
        select: {
          nombre: true,
        },
      },
      localidadRef: {
        select: {
          nombre: true,
        },
      },
      cicloFormativoRef: {
        select: {
          nombre: true,
          codigo: true,
        },
      },
    },
  });

  return empresas.map((empresa) => ({
    id: empresa.id,
    nombre: empresa.nombre,
    sector: empresa.sectorRef.nombre,
    localidad: empresa.localidadRef.nombre,
    cicloFormativo: empresa.cicloFormativoRef?.nombre ?? "Varios ciclos",
    cicloFormativoCodigo: empresa.cicloFormativoRef?.codigo ?? null,
  }));
}
