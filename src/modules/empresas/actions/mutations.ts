/**
 * modules/empresas/actions/mutations.ts
 *
 * Funciones que modifican datos en la BD (crear, editar, eliminar).
 * Se llaman SOLO desde las API Routes de empresas,
 * nunca directamente desde el cliente.
 */

import { prisma } from "@/database/prisma";
import type { EmpresaInput, EmpresaUpdateInput } from "../types";

function normalizeOptionalString(value?: string) {
  if (value === undefined) return undefined;

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function normalizeOptionalEmail(value?: string) {
  const normalized = normalizeOptionalString(value);
  return typeof normalized === "string" ? normalized.toLowerCase() : normalized;
}

export function normalizeEmpresaData(data: EmpresaInput) {
  return {
    nombre: data.nombre.trim(),
    cif: data.cif.trim().toUpperCase(),
    direccion: normalizeOptionalString(data.direccion),
    localidad: data.localidad.trim(),
    sector: data.sector.trim(),
    telefono: normalizeOptionalString(data.telefono),
    email: normalizeOptionalEmail(data.email),
    contacto: normalizeOptionalString(data.contacto),
    emailContacto: normalizeOptionalEmail(data.emailContacto),
  };
}

async function getCicloFormativoOrThrow(cicloFormativoId: number) {
  const cicloFormativo = await prisma.cicloFormativo.findFirst({
    where: {
      id: cicloFormativoId,
      activo: true,
    },
    select: {
      id: true,
    },
  });

  if (!cicloFormativo) {
    throw new Error("CICLO_FORMATIVO_INVALIDO");
  }

  return cicloFormativo;
}

export async function createEmpresa(data: EmpresaInput) {
  const cicloFormativo =
    typeof data.cicloFormativoId === "number"
      ? await getCicloFormativoOrThrow(data.cicloFormativoId)
      : null;

  return prisma.empresa.create({
    data: {
      ...normalizeEmpresaData(data),
      cicloFormativoId: cicloFormativo?.id ?? null,
    },
  });
}

export async function createEmpresasBatch(data: EmpresaInput[]) {
  const requestedIds = Array.from(
    new Set(
      data
        .map((item) =>
          typeof item.cicloFormativoId === "number" ? item.cicloFormativoId : null
        )
        .filter((value): value is number => value !== null)
    )
  );

  const ciclosFormativos =
    requestedIds.length > 0
      ? await prisma.cicloFormativo.findMany({
          where: {
            id: { in: requestedIds },
            activo: true,
          },
          select: { id: true },
        })
      : [];

  const ciclosActivos = new Set(ciclosFormativos.map((item) => item.id));

  if (requestedIds.some((id) => !ciclosActivos.has(id))) {
    throw new Error("CICLO_FORMATIVO_INVALIDO");
  }

  return prisma.empresa.createMany({
    data: data.map((item) => ({
      ...normalizeEmpresaData(item),
      cicloFormativoId:
        typeof item.cicloFormativoId === "number" ? item.cicloFormativoId : null,
    })),
  });
}

export async function updateEmpresa(id: number, data: EmpresaUpdateInput) {
  const cicloFormativo =
    typeof data.cicloFormativoId === "number"
      ? await getCicloFormativoOrThrow(data.cicloFormativoId)
      : data.cicloFormativoId === null
        ? null
        : undefined;

  return prisma.empresa.update({
    where: { id },
    data: {
      ...(data.nombre !== undefined ? { nombre: data.nombre.trim() } : {}),
      ...(data.cif !== undefined ? { cif: data.cif.trim() } : {}),
      ...(data.direccion !== undefined
        ? { direccion: normalizeOptionalString(data.direccion) }
        : {}),
      ...(data.localidad !== undefined ? { localidad: data.localidad.trim() } : {}),
      ...(data.sector !== undefined ? { sector: data.sector.trim() } : {}),
      ...(cicloFormativo !== undefined
        ? { cicloFormativoId: cicloFormativo?.id ?? null }
        : {}),
      ...(data.telefono !== undefined
        ? { telefono: normalizeOptionalString(data.telefono) }
        : {}),
      ...(data.email !== undefined ? { email: normalizeOptionalEmail(data.email) } : {}),
      ...(data.contacto !== undefined
        ? { contacto: normalizeOptionalString(data.contacto) }
        : {}),
      ...(data.emailContacto !== undefined
        ? { emailContacto: normalizeOptionalEmail(data.emailContacto) }
        : {}),
    },
  });
}

export async function deleteEmpresa(id: number) {
  const formacionesAsociadas = await prisma.formacionEmpresa.count({
    where: { empresaId: id },
  });

  if (formacionesAsociadas > 0) {
    throw new Error("EMPRESA_CON_FORMACIONES");
  }

  return prisma.empresa.delete({
    where: { id },
  });
}
