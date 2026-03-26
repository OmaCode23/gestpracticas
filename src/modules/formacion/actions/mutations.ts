/**
 * src/modules/formacion/actions/mutations.ts
 *
 * Mutaciones estrictas para crear, actualizar y eliminar formaciones en empresa.
 * Incluye normalización de campos opcionales y sanitización básica.
 */

import { prisma } from "@/database/prisma";
import type { FormacionCreateInput, FormacionUpdateInput } from "../types";

function normalizeOptionalString(value?: string) {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export async function createFormacion(data: FormacionCreateInput) {
  return prisma.formacionEmpresa.create({
    data: {
      empresaId: data.empresaId,
      alumnoId: data.alumnoId,
      curso: data.curso.trim(),
      periodo: data.periodo.trim(),
      descripcion: normalizeOptionalString(data.descripcion),
      contacto: normalizeOptionalString(data.contacto),
    },
    include: {
      empresa: {
        select: {
          id: true,
          nombre: true,
          sector: true,
          localidad: true,
        },
      },
      alumno: {
        select: {
          id: true,
          nombre: true,
          nia: true,
          ciclo: true,
          curso: true,
        },
      },
    },
  });
}

export async function updateFormacion(id: number, data: FormacionUpdateInput) {
  return prisma.formacionEmpresa.update({
    where: { id },
    data: {
      ...(data.empresaId !== undefined ? { empresaId: data.empresaId } : {}),
      ...(data.alumnoId !== undefined ? { alumnoId: data.alumnoId } : {}),
      ...(data.curso !== undefined ? { curso: data.curso.trim() } : {}),
      ...(data.periodo !== undefined ? { periodo: data.periodo.trim() } : {}),
      ...(data.descripcion !== undefined
        ? { descripcion: normalizeOptionalString(data.descripcion) }
        : {}),
      ...(data.contacto !== undefined
        ? { contacto: normalizeOptionalString(data.contacto) }
        : {}),
    },
    include: {
      empresa: {
        select: {
          id: true,
          nombre: true,
          sector: true,
          localidad: true,
        },
      },
      alumno: {
        select: {
          id: true,
          nombre: true,
          nia: true,
          ciclo: true,
          curso: true,
        },
      },
    },
  });
}

export async function deleteFormacion(id: number) {
  return prisma.formacionEmpresa.delete({
    where: { id },
  });
}


