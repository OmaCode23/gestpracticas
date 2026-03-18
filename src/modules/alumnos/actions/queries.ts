/**
 * src/modules/alumnos/actions/queries.ts
 * 
 */

import { prisma } from "@/database/prisma";

export async function getAlumnos(params: {
  ciclo?: string;
  curso?: string;
  search?: string;
  page?: number;
}) {
  const { ciclo, curso, search, page = 1 } = params;

  const PAGE_SIZE = 10;

  return prisma.alumno.findMany({
    where: {
      AND: [
        ciclo ? { ciclo } : {},
        curso ? { curso } : {},
        search
          ? {
              OR: [
                { nombre: { contains: search, mode: "insensitive" } },
                { nia: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
      ],
    },
    orderBy: { nombre: "asc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });
}

export async function getAlumnoById(id: number) {
  return prisma.alumno.findUnique({
    where: { id },
  });
}
