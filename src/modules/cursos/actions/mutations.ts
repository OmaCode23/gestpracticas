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

async function getCursoProveedorOrThrow(proveedorId: number) {
  const proveedor = await prisma.cursoProveedor.findFirst({
    where: { id: proveedorId, activo: true },
    select: { id: true, nombre: true },
  });

  if (!proveedor) throw new Error("CURSO_PROVEEDOR_INVALIDO");

  return proveedor;
}

async function getCursoAreaOrThrow(areaId: number) {
  const area = await prisma.cursoArea.findFirst({
    where: { id: areaId, activo: true },
    select: { id: true, nombre: true },
  });

  if (!area) throw new Error("CURSO_AREA_INVALIDA");

  return area;
}

export async function createCursoExterno(data: CursoExternoInput) {
  const [proveedor, area] = await Promise.all([
    getCursoProveedorOrThrow(data.proveedorId),
    getCursoAreaOrThrow(data.areaId),
  ]);

  return prisma.cursoExterno.create({
    data: {
      titulo: data.titulo.trim(),
      proveedor: proveedor.nombre,
      proveedorId: proveedor.id,
      area: area.nombre,
      areaId: area.id,
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
  const proveedor =
    typeof data.proveedorId === "number"
      ? await getCursoProveedorOrThrow(data.proveedorId)
      : undefined;
  const area =
    typeof data.areaId === "number" ? await getCursoAreaOrThrow(data.areaId) : undefined;

  return prisma.cursoExterno.update({
    where: { id },
    data: {
      ...(data.titulo !== undefined ? { titulo: data.titulo.trim() } : {}),
      ...(proveedor !== undefined
        ? { proveedor: proveedor.nombre, proveedorId: proveedor.id }
        : {}),
      ...(area !== undefined ? { area: area.nombre, areaId: area.id } : {}),
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
