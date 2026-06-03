import { prisma } from "@/database/prisma";
import {
  assertAcademicEmailAvailable,
  assertAcademicEmailDomain,
} from "@/shared/identity/academic-email";
import { syncAcademicUserIdentity, syncAcademicUserRemoval } from "@/shared/identity/academic-user";
import type { ProfesorInput, ProfesorUpdateInput } from "../types";

function normalizeOptionalString(value?: string) {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

async function getCicloFormativoOrThrow(cicloFormativoId: number) {
  const ciclo = await prisma.cicloFormativo.findFirst({
    where: { id: cicloFormativoId, activo: true },
    select: { id: true },
  });

  if (!ciclo) throw new Error("CICLO_FORMATIVO_INVALIDO");

  return ciclo;
}

export async function createProfesor(data: ProfesorInput) {
  const cicloFormativo =
    typeof data.cicloFormativoId === "number"
      ? await getCicloFormativoOrThrow(data.cicloFormativoId)
      : null;
  await assertAcademicEmailDomain(data.email, "PROFESOR");
  const email = await assertAcademicEmailAvailable({
    email: data.email,
    entity: "PROFESOR",
  });

  return prisma.$transaction(async (tx) => {
    const profesor = await tx.profesor.create({
      data: {
        nombre: data.nombre.trim(),
        nif: normalizeOptionalString(data.nif) ?? null,
        especialidad: normalizeOptionalString(data.especialidad) ?? null,
        telefono: normalizeOptionalString(data.telefono) ?? null,
        email,
        cicloFormativoId: cicloFormativo?.id ?? null,
      },
    });

    await syncAcademicUserIdentity(tx, {
      entity: "PROFESOR",
      nombre: profesor.nombre,
      email: profesor.email,
    });

    return profesor;
  });
}

export async function createProfesoresBatch(data: ProfesorInput[]) {
  const requestedCicloIds = Array.from(
    new Set(
      data
        .map((item) => (typeof item.cicloFormativoId === "number" ? item.cicloFormativoId : null))
        .filter((id): id is number => id !== null)
    )
  );

  const ciclosFormativos =
    requestedCicloIds.length > 0
      ? await prisma.cicloFormativo.findMany({
          where: { id: { in: requestedCicloIds }, activo: true },
          select: { id: true },
        })
      : [];

  const ciclosActivos = new Set(ciclosFormativos.map((c) => c.id));

  if (requestedCicloIds.some((id) => !ciclosActivos.has(id))) {
    throw new Error("CICLO_FORMATIVO_INVALIDO");
  }

  await Promise.all(data.map((item) => assertAcademicEmailDomain(item.email, "PROFESOR")));
  const normalizedEmails = await Promise.all(
    data.map((item) =>
      assertAcademicEmailAvailable({
        email: item.email,
        entity: "PROFESOR",
      })
    )
  );

  return prisma.$transaction(async (tx) => {
    const payload = data.map((item, index) => ({
      nombre: item.nombre.trim(),
      nif: normalizeOptionalString(item.nif) ?? null,
      especialidad: normalizeOptionalString(item.especialidad) ?? null,
      telefono: normalizeOptionalString(item.telefono) ?? null,
      email: normalizedEmails[index],
      cicloFormativoId: typeof item.cicloFormativoId === "number" ? item.cicloFormativoId : null,
    }));

    const result = await tx.profesor.createMany({
      data: payload,
    });

    for (const item of payload) {
      await syncAcademicUserIdentity(tx, {
        entity: "PROFESOR",
        nombre: item.nombre,
        email: item.email,
      });
    }

    return result;
  });
}

export async function updateProfesor(id: number, data: ProfesorUpdateInput) {
  const cicloFormativo =
    typeof data.cicloFormativoId === "number"
      ? await getCicloFormativoOrThrow(data.cicloFormativoId)
      : data.cicloFormativoId === null
        ? null
        : undefined;
  if (data.email !== undefined) {
    await assertAcademicEmailDomain(data.email, "PROFESOR");
  }
  const email =
    data.email !== undefined
      ? await assertAcademicEmailAvailable({
          email: data.email,
          entity: "PROFESOR",
          excludeId: id,
        })
      : undefined;

  return prisma.$transaction(async (tx) => {
    const previousProfesor = await tx.profesor.findUnique({
      where: { id },
      select: { email: true },
    });

    const profesor = await tx.profesor.update({
      where: { id },
      data: {
        ...(data.nombre !== undefined ? { nombre: data.nombre.trim() } : {}),
        ...(data.nif !== undefined ? { nif: normalizeOptionalString(data.nif) } : {}),
        ...(data.especialidad !== undefined
          ? { especialidad: normalizeOptionalString(data.especialidad) }
          : {}),
        ...(data.telefono !== undefined
          ? { telefono: normalizeOptionalString(data.telefono) }
          : {}),
        ...(email !== undefined ? { email } : {}),
        ...(cicloFormativo !== undefined
          ? { cicloFormativoId: cicloFormativo?.id ?? null }
          : {}),
      },
    });

    await syncAcademicUserIdentity(tx, {
      entity: "PROFESOR",
      nombre: profesor.nombre,
      email: profesor.email,
      previousEmail: previousProfesor?.email,
    });

    return profesor;
  });
}

export async function deleteProfesor(id: number) {
  return prisma.$transaction(async (tx) => {
    const profesor = await tx.profesor.findUnique({
      where: { id },
      select: { email: true },
    });

    if (profesor?.email) {
      await syncAcademicUserRemoval(tx, {
        entity: "PROFESOR",
        email: profesor.email,
      });
    }

    return tx.profesor.delete({ where: { id } });
  });
}
