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

export async function createEmpresa(data: EmpresaInput) {
  return prisma.empresa.create({
    data: {
      nombre: data.nombre.trim(),
      cif: data.cif.trim(),
      direccion: normalizeOptionalString(data.direccion),
      localidad: data.localidad.trim(),
      sector: data.sector.trim(),
      cicloFormativo: normalizeOptionalString(data.cicloFormativo),
      telefono: normalizeOptionalString(data.telefono),
      email: normalizeOptionalEmail(data.email),
      contacto: normalizeOptionalString(data.contacto),
      emailContacto: normalizeOptionalEmail(data.emailContacto),
    },
  });
}

export async function updateEmpresa(id: number, data: EmpresaUpdateInput) {
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
      ...(data.cicloFormativo !== undefined
        ? { cicloFormativo: normalizeOptionalString(data.cicloFormativo) }
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
  return prisma.empresa.delete({
    where: { id },
  });
}
