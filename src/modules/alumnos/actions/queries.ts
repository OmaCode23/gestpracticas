/**
 * src/modules/alumnos/actions/queries.ts
 */

import { prisma } from "@/database/prisma";

const PAGE_SIZE = 10;

export async function getAlumnosPaginated(params: {
  ciclo?: string;
  curso?: string;
  search?: string;
  page?: number;
  perPage?: number;
}) {
  const { ciclo, curso, search, page = 1, perPage = PAGE_SIZE } = params;

  const where: any = {
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
  };

  const total = await prisma.alumno.count({ where });

  const data = await prisma.alumno.findMany({
    where,
    orderBy: { nombre: "asc" },
    skip: (page - 1) * perPage,
    take: perPage,
  });

  return { data, total };
}

export async function getAlumnoById(id: number) {
  return prisma.alumno.findUnique({
    where: { id },
  });
}
