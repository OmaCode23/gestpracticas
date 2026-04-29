import type { Prisma } from "@prisma/client";

export type AlumnoFilterParams = {
  ciclo?: string;
  curso?: string;
  search?: string;
};

export function buildAlumnoWhere(params: AlumnoFilterParams = {}): Prisma.AlumnoWhereInput {
  const ciclo = params.ciclo?.trim();
  const curso = params.curso?.trim();
  const search = params.search?.trim();

  return {
    ...(ciclo
      ? {
          cicloFormativoRef: {
            is: { nombre: ciclo },
          },
        }
      : {}),
    ...(curso ? { curso } : {}),
    ...(search
      ? {
          OR: [
            { nombre: { contains: search, mode: "insensitive" } },
            { nia: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}
