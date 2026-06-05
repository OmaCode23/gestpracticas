import { prisma } from "@/database/prisma";
import type { OfertaPracticaInput, OfertaPracticaUpdateInput } from "../types";

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

async function getEmpresaOrThrow(empresaId: number) {
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { id: true, nombre: true },
  });

  if (!empresa) throw new Error("EMPRESA_INVALIDA");

  return empresa;
}

export async function createOfertaPractica(data: OfertaPracticaInput) {
  const [empresa, cicloFormativo] = await Promise.all([
    getEmpresaOrThrow(data.empresaId),
    typeof data.cicloFormativoId === "number"
      ? getCicloFormativoOrThrow(data.cicloFormativoId)
      : Promise.resolve(null),
  ]);

  return prisma.ofertaPractica.create({
    data: {
      titulo: data.titulo.trim(),
      empresa: empresa.nombre,
      empresaId: empresa.id,
      cicloFormativoId: cicloFormativo?.id ?? null,
      plazas: data.plazas,
      requisitos: normalizeOptionalString(data.requisitos) ?? null,
      periodo: normalizeOptionalString(data.periodo) ?? null,
      descripcion: normalizeOptionalString(data.descripcion) ?? null,
      estado: data.estado,
    },
  });
}

export async function updateOfertaPractica(id: number, data: OfertaPracticaUpdateInput) {
  const empresa =
    typeof data.empresaId === "number" ? await getEmpresaOrThrow(data.empresaId) : undefined;
  const cicloFormativo =
    typeof data.cicloFormativoId === "number"
      ? await getCicloFormativoOrThrow(data.cicloFormativoId)
      : data.cicloFormativoId === null
        ? null
        : undefined;

  return prisma.ofertaPractica.update({
    where: { id },
    data: {
      ...(data.titulo !== undefined ? { titulo: data.titulo.trim() } : {}),
      ...(empresa !== undefined ? { empresa: empresa.nombre, empresaId: empresa.id } : {}),
      ...(cicloFormativo !== undefined
        ? { cicloFormativoId: cicloFormativo?.id ?? null }
        : {}),
      ...(data.plazas !== undefined ? { plazas: data.plazas } : {}),
      ...(data.requisitos !== undefined
        ? { requisitos: normalizeOptionalString(data.requisitos) }
        : {}),
      ...(data.periodo !== undefined ? { periodo: normalizeOptionalString(data.periodo) } : {}),
      ...(data.descripcion !== undefined
        ? { descripcion: normalizeOptionalString(data.descripcion) }
        : {}),
      ...(data.estado !== undefined ? { estado: data.estado } : {}),
    },
  });
}

export async function deleteOfertaPractica(id: number) {
  return prisma.ofertaPractica.delete({ where: { id } });
}
