/**
 * src/modules/alumnos/actions/mutations.ts
 */

import { prisma } from "@/database/prisma";
import type { AlumnoCreateInput, AlumnoUpdateInput } from "../types";

export async function createAlumno(data: AlumnoCreateInput) {
  return prisma.alumno.create({
    data,
  });
}

export async function updateAlumno(id: number, data: AlumnoUpdateInput) {
  return prisma.alumno.update({
    where: { id },
    data,
  });
}

export async function deleteAlumno(id: number) {
  return prisma.alumno.delete({
    where: { id },
  });
}

