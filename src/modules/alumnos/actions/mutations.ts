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

function normalizeRequiredString(value: string) {
  return value.trim();
}

function normalizeRequiredEmail(value: string) {
  return normalizeRequiredString(value).toLowerCase();
}

export async function createAlumno(data: AlumnoInput) {
  return prisma.alumno.create({
    data: {
      nombre: data.nombre.trim(),
      nia: data.nia.trim(),
      nif: normalizeOptionalString(data.nif?.toUpperCase()),
      nuss: normalizeOptionalString(data.nuss),
      telefono: normalizeRequiredString(data.telefono),
      email: normalizeRequiredEmail(data.email),
      ciclo: data.ciclo.trim(),
      cursoCiclo: data.cursoCiclo,
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
      ...(data.nif !== undefined ? { nif: normalizeOptionalString(data.nif?.toUpperCase()) } : {}),
      ...(data.nuss !== undefined ? { nuss: normalizeOptionalString(data.nuss) } : {}),
      ...(data.telefono !== undefined
        ? { telefono: normalizeRequiredString(data.telefono) }
        : {}),
      ...(data.email !== undefined ? { email: normalizeRequiredEmail(data.email) } : {}),
      ...(data.ciclo !== undefined ? { ciclo: data.ciclo.trim() } : {}),
      ...(data.cursoCiclo !== undefined ? { cursoCiclo: data.cursoCiclo } : {}),
      ...(data.curso !== undefined ? { curso: data.curso.trim() } : {}),
    },
  });
}

export async function deleteAlumno(id: number) {
  return prisma.alumno.delete({ where: { id } });
}
