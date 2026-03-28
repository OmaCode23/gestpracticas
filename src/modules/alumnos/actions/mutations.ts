/**
 * src/modules/alumnos/actions/mutations.ts
 */

import { prisma } from "@/database/prisma";
import type { AlumnoInput, AlumnoUpdateInput } from "../types";

function normalizeOptionalString(value?: string) {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function normalizeOptionalEmail(value?: string) {
  const normalized = normalizeOptionalString(value);
  return typeof normalized === "string" ? normalized.toLowerCase() : normalized;
}

export async function createAlumno(data: AlumnoInput) {
  return prisma.alumno.create({
    data: {
      nombre: data.nombre.trim(),
      nia: data.nia.trim(),
      nif: data.nif.trim().toUpperCase(),
      nuss: data.nuss.trim(),
      telefono: normalizeOptionalString(data.telefono),
      email: normalizeOptionalEmail(data.email),
      ciclo: data.ciclo.trim(),
      curso: data.curso.trim(),
    },
  });
}

export async function updateAlumno(id: number, data: AlumnoUpdateInput) {
  return prisma.alumno.update({
    where: { id },
    data: {
      ...(data.nombre !== undefined ? { nombre: data.nombre.trim() } : {}),
      ...(data.nia !== undefined ? { nia: data.nia.trim() } : {}),
      ...(data.nif !== undefined ? { nif: data.nif.trim().toUpperCase() } : {}),
      ...(data.nuss !== undefined ? { nuss: data.nuss.trim() } : {}),
      ...(data.telefono !== undefined
        ? { telefono: normalizeOptionalString(data.telefono) }
        : {}),
      ...(data.email !== undefined ? { email: normalizeOptionalEmail(data.email) } : {}),
      ...(data.ciclo !== undefined ? { ciclo: data.ciclo.trim() } : {}),
      ...(data.curso !== undefined ? { curso: data.curso.trim() } : {}),
    },
  });
}

export async function deleteAlumno(id: number) {
  return prisma.alumno.delete({ where: { id } });
}
