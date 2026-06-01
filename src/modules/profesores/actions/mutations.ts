import { prisma } from "@/database/prisma";
import type { ProfesorInput, ProfesorUpdateInput } from "../types";

function normalizeOptionalString(value?: string) {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function normalizeOptionalEmail(value?: string) {
  const normalized = normalizeOptionalString(value);
  return typeof normalized === "string" ? normalized.toLowerCase() : normalized;
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

  return prisma.profesor.create({
    data: {
      nombre: data.nombre.trim(),
      nif: normalizeOptionalString(data.nif) ?? null,
      especialidad: normalizeOptionalString(data.especialidad) ?? null,
      telefono: normalizeOptionalString(data.telefono) ?? null,
      email: normalizeOptionalEmail(data.email) ?? null,
      cicloFormativoId: cicloFormativo?.id ?? null,
    },
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

  return prisma.profesor.createMany({
    data: data.map((item) => ({
      nombre: item.nombre.trim(),
      nif: normalizeOptionalString(item.nif) ?? null,
      especialidad: normalizeOptionalString(item.especialidad) ?? null,
      telefono: normalizeOptionalString(item.telefono) ?? null,
      email: normalizeOptionalEmail(item.email) ?? null,
      cicloFormativoId: typeof item.cicloFormativoId === "number" ? item.cicloFormativoId : null,
    })),
  });
}

export async function updateProfesor(id: number, data: ProfesorUpdateInput) {
  const cicloFormativo =
    typeof data.cicloFormativoId === "number"
      ? await getCicloFormativoOrThrow(data.cicloFormativoId)
      : data.cicloFormativoId === null
        ? null
        : undefined;

  return prisma.profesor.update({
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
      ...(data.email !== undefined ? { email: normalizeOptionalEmail(data.email) } : {}),
      ...(cicloFormativo !== undefined
        ? { cicloFormativoId: cicloFormativo?.id ?? null }
        : {}),
    },
  });
}

export async function deleteProfesor(id: number) {
  return prisma.profesor.delete({ where: { id } });
}
