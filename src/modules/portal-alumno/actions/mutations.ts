import { OfertaEstado } from "@prisma/client";
import { prisma } from "@/database/prisma";

export async function registrarInteresOfertaPractica(alumnoId: number, ofertaId: number) {
  const oferta = await prisma.ofertaPractica.findFirst({
    where: {
      id: ofertaId,
      estado: OfertaEstado.PUBLICADA,
    },
    select: { id: true },
  });

  if (!oferta) {
    throw new Error("OFERTA_NO_DISPONIBLE");
  }

  return prisma.ofertaPracticaInteres.upsert({
    where: {
      alumnoId_ofertaId: {
        alumnoId,
        ofertaId,
      },
    },
    update: {},
    create: {
      alumnoId,
      ofertaId,
    },
  });
}

export async function registrarInscripcionCursoExterno(alumnoId: number, cursoId: number) {
  const curso = await prisma.cursoExterno.findFirst({
    where: {
      id: cursoId,
      activo: true,
    },
    select: { id: true },
  });

  if (!curso) {
    throw new Error("CURSO_NO_DISPONIBLE");
  }

  return prisma.cursoExternoInscripcion.upsert({
    where: {
      alumnoId_cursoId: {
        alumnoId,
        cursoId,
      },
    },
    update: {},
    create: {
      alumnoId,
      cursoId,
    },
  });
}
