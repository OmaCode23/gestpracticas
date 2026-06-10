/**
 * src/modules/formacion/actions/mutations.ts
 *
 * Mutaciones estrictas para crear, actualizar y eliminar formaciones en empresa.
 * Incluye normalizacion de campos opcionales y sanitizacion basica.
 */

import { prisma } from "@/database/prisma";
import { normalizeEmpresaCatalogos } from "@/shared/utils/empresaCatalogos";
import type { FormacionInput, FormacionUpdateInput } from "../types";

function normalizeOptionalString(value?: string) {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export async function createFormacion(data: FormacionInput) {
  const formacion = await prisma.formacionEmpresa.create({
    data: {
      empresaId: data.empresaId,
      alumnoId: data.alumnoId,
      curso: data.curso.trim(),
      periodo: data.periodo.trim(),
      descripcion: normalizeOptionalString(data.descripcion),
      tutorLaboral: normalizeOptionalString(data.tutorLaboral),
      emailTutorLaboral: normalizeOptionalString(data.emailTutorLaboral),
    },
    include: {
      empresa: {
        select: {
          id: true,
          nombre: true,
          sectorId: true,
          sectorRef: {
            select: {
              nombre: true,
            },
          },
          localidadId: true,
          localidadRef: {
            select: {
              nombre: true,
            },
          },
          cicloFormativoId: true,
          cicloFormativoRef: {
            select: {
              nombre: true,
            },
          },
        },
      },
      alumno: {
        select: {
          id: true,
          nombre: true,
          nia: true,
          nif: true,
          nuss: true,
          cicloFormativoId: true,
          cursoCiclo: true,
          curso: true,
          cicloFormativoRef: {
            select: {
              id: true,
              nombre: true,
              codigo: true,
            },
          },
        },
      },
    },
  });

  return {
    ...formacion,
    empresa: normalizeEmpresaCatalogos(formacion.empresa),
    alumno: formacion.alumno
      ? {
          ...formacion.alumno,
        }
      : null,
  };
}

export async function updateFormacion(id: number, data: FormacionUpdateInput) {
  const formacion = await prisma.formacionEmpresa.update({
    where: { id },
    data: {
      ...(data.empresaId !== undefined ? { empresaId: data.empresaId } : {}),
      ...(data.alumnoId !== undefined ? { alumnoId: data.alumnoId } : {}),
      ...(data.curso !== undefined ? { curso: data.curso.trim() } : {}),
      ...(data.periodo !== undefined ? { periodo: data.periodo.trim() } : {}),
      ...(data.descripcion !== undefined
        ? { descripcion: normalizeOptionalString(data.descripcion) }
        : {}),
      ...(data.tutorLaboral !== undefined
        ? { tutorLaboral: normalizeOptionalString(data.tutorLaboral) }
        : {}),
      ...(data.emailTutorLaboral !== undefined
        ? { emailTutorLaboral: normalizeOptionalString(data.emailTutorLaboral) }
        : {}),
    },
    include: {
      empresa: {
        select: {
          id: true,
          nombre: true,
          sectorId: true,
          sectorRef: {
            select: {
              nombre: true,
            },
          },
          localidadId: true,
          localidadRef: {
            select: {
              nombre: true,
            },
          },
          cicloFormativoId: true,
          cicloFormativoRef: {
            select: {
              nombre: true,
            },
          },
        },
      },
      alumno: {
        select: {
          id: true,
          nombre: true,
          nia: true,
          nif: true,
          nuss: true,
          cicloFormativoId: true,
          cursoCiclo: true,
          curso: true,
          cicloFormativoRef: {
            select: {
              id: true,
              nombre: true,
              codigo: true,
            },
          },
        },
      },
    },
  });

  return {
    ...formacion,
    empresa: normalizeEmpresaCatalogos(formacion.empresa),
    alumno: formacion.alumno
      ? {
          ...formacion.alumno,
        }
      : null,
  };
}

export async function deleteFormacion(id: number) {
  return prisma.formacionEmpresa.delete({
    where: { id },
  });
}
