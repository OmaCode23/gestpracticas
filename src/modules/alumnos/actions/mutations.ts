/**
 * src/modules/alumnos/actions/mutations.ts
 */

import { prisma } from "@/database/prisma";
import type { AlumnoCrudInput, AlumnoCrudUpdateInput } from "../types";
import { deleteAlumnoCvLo } from "./cv";

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

async function getCicloFormativoOrThrow(cicloFormativoId: number) {
  const cicloFormativo = await prisma.cicloFormativo.findFirst({
    where: {
      id: cicloFormativoId,
      activo: true,
    },
    select: {
      id: true,
      nombre: true,
    },
  });

  if (!cicloFormativo) {
    throw new Error("CICLO_FORMATIVO_INVALIDO");
  }

  return cicloFormativo;
}

export async function createAlumno(data: AlumnoCrudInput) {
  const cicloFormativo = await getCicloFormativoOrThrow(data.cicloFormativoId);

  return prisma.alumno.create({
    data: {
      nombre: data.nombre.trim(),
      nia: data.nia.trim(),
      nif: normalizeOptionalString(data.nif?.toUpperCase()),
      nuss: normalizeOptionalString(data.nuss),
      telefono: normalizeRequiredString(data.telefono),
      email: normalizeRequiredEmail(data.email),
      ciclo: cicloFormativo.nombre,
      cicloFormativoId: cicloFormativo.id,
      cursoCiclo: data.cursoCiclo,
      curso: data.curso.trim(),
    },
  });
}

export async function updateAlumno(id: number, data: AlumnoCrudUpdateInput) {
  const cicloFormativo =
    data.cicloFormativoId !== undefined
      ? await getCicloFormativoOrThrow(data.cicloFormativoId)
      : null;

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
      ...(cicloFormativo
        ? {
            ciclo: cicloFormativo.nombre,
            cicloFormativoId: cicloFormativo.id,
          }
        : {}),
      ...(data.cursoCiclo !== undefined ? { cursoCiclo: data.cursoCiclo } : {}),
      ...(data.curso !== undefined ? { curso: data.curso.trim() } : {}),
    },
  });
}

export async function deleteAlumno(id: number) {
  return prisma.$transaction(async (tx) => {
    const alumno = await tx.alumno.findUnique({
      where: { id },
      select: { cvOid: true },
    });

    if (alumno?.cvOid) {
      await deleteAlumnoCvLo(tx, alumno.cvOid);
    }

    return tx.alumno.delete({ where: { id } });
  });
}
