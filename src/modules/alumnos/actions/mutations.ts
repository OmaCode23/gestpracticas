/**
 * src/modules/alumnos/actions/mutations.ts
 */

import { prisma } from "@/database/prisma";
import {
  assertAcademicEmailAvailable,
  assertAcademicEmailDomain,
} from "@/shared/identity/academic-email";
import { syncAcademicUserIdentity, syncAcademicUserRemoval } from "@/shared/identity/academic-user";
import type { AlumnoCrudInput, AlumnoCrudUpdateInput } from "../types";
import { deleteAlumnoCvLo } from "./cv";

function normalizeOptionalString(value?: string) {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function normalizeRequiredString(value: string) {
  return value.trim();
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

async function getCicloFormativoForUpdateOrThrow(id: number, cicloFormativoId: number) {
  const alumnoActual = await prisma.alumno.findUnique({
    where: { id },
    select: {
      cicloFormativoId: true,
    },
  });

  if (alumnoActual?.cicloFormativoId === cicloFormativoId) {
    const cicloActual = await prisma.cicloFormativo.findUnique({
      where: { id: cicloFormativoId },
      select: {
        id: true,
        nombre: true,
      },
    });

    if (cicloActual) {
      return cicloActual;
    }
  }

  return getCicloFormativoOrThrow(cicloFormativoId);
}

export async function createAlumno(data: AlumnoCrudInput) {
  const cicloFormativo = await getCicloFormativoOrThrow(data.cicloFormativoId);
  const cleanedNif = normalizeOptionalString(data.nif?.toUpperCase());
  await assertAcademicEmailDomain(data.email, "ALUMNO");
  const email = await assertAcademicEmailAvailable({
    email: data.email,
    entity: "ALUMNO",
  });

  return prisma.$transaction(async (tx) => {
    const alumno = await tx.alumno.create({
      data: {
        nombre: data.nombre.trim(),
        nia: data.nia.trim(),
        nif: cleanedNif,
        nuss: normalizeOptionalString(data.nuss),
        telefono: normalizeRequiredString(data.telefono),
        email,
        cicloFormativoId: cicloFormativo.id,
        cursoCiclo: data.cursoCiclo,
        curso: data.curso.trim(),
      },
    });

    await syncAcademicUserIdentity(tx, {
      entity: "ALUMNO",
      nombre: alumno.nombre,
      email: alumno.email,
    });

    return alumno;
  });
}

export async function updateAlumno(id: number, data: AlumnoCrudUpdateInput) {
  const cicloFormativo =
    data.cicloFormativoId !== undefined
      ? await getCicloFormativoForUpdateOrThrow(id, data.cicloFormativoId)
      : null;
  if (data.email !== undefined) {
    await assertAcademicEmailDomain(data.email, "ALUMNO");
  }
  const email =
    data.email !== undefined
      ? await assertAcademicEmailAvailable({
          email: data.email,
          entity: "ALUMNO",
          excludeId: id,
        })
      : undefined;

  return prisma.$transaction(async (tx) => {
    const previousAlumno = await tx.alumno.findUnique({
      where: { id },
      select: { email: true },
    });

    const alumno = await tx.alumno.update({
      where: { id },
      data: {
        ...(data.nombre !== undefined ? { nombre: data.nombre.trim() } : {}),
        ...(data.nia !== undefined ? { nia: data.nia.trim() } : {}),
        ...(data.nif !== undefined ? { nif: normalizeOptionalString(data.nif?.toUpperCase()) } : {}),
        ...(data.nuss !== undefined ? { nuss: normalizeOptionalString(data.nuss) } : {}),
        ...(data.telefono !== undefined
          ? { telefono: normalizeRequiredString(data.telefono) }
          : {}),
        ...(email !== undefined ? { email } : {}),
        ...(cicloFormativo
          ? {
              cicloFormativoId: cicloFormativo.id,
            }
          : {}),
        ...(data.cursoCiclo !== undefined ? { cursoCiclo: data.cursoCiclo } : {}),
        ...(data.curso !== undefined ? { curso: data.curso.trim() } : {}),
      },
    });

    await syncAcademicUserIdentity(tx, {
      entity: "ALUMNO",
      nombre: alumno.nombre,
      email: alumno.email,
      previousEmail: previousAlumno?.email,
    });

    return alumno;
  });
}

export async function deleteAlumno(id: number) {
  return prisma.$transaction(async (tx) => {
    const alumno = await tx.alumno.findUnique({
      where: { id },
      select: { cvOid: true, email: true },
    });

    if (alumno?.cvOid) {
      await deleteAlumnoCvLo(tx, alumno.cvOid);
    }

    if (alumno?.email) {
      await syncAcademicUserRemoval(tx, {
        entity: "ALUMNO",
        email: alumno.email,
      });
    }

    return tx.alumno.delete({ where: { id } });
  });
}
