import { prisma } from "@/database/prisma";
import type { CursoExternoInput, CursoExternoUpdateInput } from "../types";

function normalizeOptionalString(value?: string) {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function normalizeOptionalUrl(value?: string) {
  const normalized = normalizeOptionalString(value);
  return typeof normalized === "string" ? normalized : normalized ?? null;
}

export async function createCursoExterno(data: CursoExternoInput) {
  return prisma.cursoExterno.create({
    data: {
      titulo: data.titulo.trim(),
      proveedor: data.proveedor.trim(),
      area: data.area.trim(),
      nivel: data.nivel.trim(),
      modalidad: data.modalidad.trim(),
      duracion: normalizeOptionalString(data.duracion) ?? null,
      descripcion: normalizeOptionalString(data.descripcion) ?? null,
      enlace: normalizeOptionalUrl(data.enlace),
      activo: data.activo,
    },
  });
}

export async function updateCursoExterno(id: number, data: CursoExternoUpdateInput) {
  return prisma.cursoExterno.update({
    where: { id },
    data: {
      ...(data.titulo !== undefined ? { titulo: data.titulo.trim() } : {}),
      ...(data.proveedor !== undefined ? { proveedor: data.proveedor.trim() } : {}),
      ...(data.area !== undefined ? { area: data.area.trim() } : {}),
      ...(data.nivel !== undefined ? { nivel: data.nivel.trim() } : {}),
      ...(data.modalidad !== undefined ? { modalidad: data.modalidad.trim() } : {}),
      ...(data.duracion !== undefined
        ? { duracion: normalizeOptionalString(data.duracion) }
        : {}),
      ...(data.descripcion !== undefined
        ? { descripcion: normalizeOptionalString(data.descripcion) }
        : {}),
      ...(data.enlace !== undefined ? { enlace: normalizeOptionalUrl(data.enlace) } : {}),
      ...(data.activo !== undefined ? { activo: data.activo } : {}),
    },
  });
}

export async function deleteCursoExterno(id: number) {
  return prisma.cursoExterno.delete({ where: { id } });
}
