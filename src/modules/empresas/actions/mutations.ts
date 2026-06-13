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

async function getCicloFormativoForUpdateOrThrow(id: number, cicloFormativoId: number) {
  const empresaActual = await prisma.empresa.findUnique({
    where: { id },
    select: {
      cicloFormativoId: true,
    },
  });

  if (empresaActual?.cicloFormativoId === cicloFormativoId) {
    const cicloActual = await prisma.cicloFormativo.findUnique({
      where: { id: cicloFormativoId },
      select: {
        id: true,
      },
    });

    if (cicloActual) {
      return cicloActual;
    }
  }

  return getCicloFormativoOrThrow(cicloFormativoId);
}

async function getSectorOrThrow(nombre: string) {
  const sector = await prisma.sector.findFirst({
    where: {
      nombre,
      activo: true,
    },
    select: {
      id: true,
    },
  });

  if (!sector) {
    throw new Error("SECTOR_INVALIDO");
  }

  return sector;
}

async function getSectorForUpdateOrThrow(id: number, nombre: string) {
  const empresaActual = await prisma.empresa.findUnique({
    where: { id },
    select: {
      sectorId: true,
      sectorRef: {
        select: {
          nombre: true,
        },
      },
    },
  });

  if (empresaActual?.sectorRef?.nombre === nombre && empresaActual.sectorId) {
    const sectorActual = await prisma.sector.findUnique({
      where: { id: empresaActual.sectorId },
      select: {
        id: true,
      },
    });

    if (sectorActual) {
      return sectorActual;
    }
  }

  return getSectorOrThrow(nombre);
}

async function getLocalidadOrThrow(nombre: string) {
  const localidad = await prisma.localidad.findFirst({
    where: {
      nombre,
      activo: true,
    },
    select: {
      id: true,
    },
  });

  if (!localidad) {
    throw new Error("LOCALIDAD_INVALIDA");
  }

  return localidad;
}

export async function createEmpresa(data: EmpresaInput) {
  const [sector, localidad, cicloFormativo] = await Promise.all([
    getSectorOrThrow(data.sector.trim()),
    getLocalidadOrThrow(data.localidad.trim()),
    typeof data.cicloFormativoId === "number"
      ? getCicloFormativoOrThrow(data.cicloFormativoId)
      : Promise.resolve(null),
  ]);

  return prisma.empresa.create({
    data: {
      ...normalizeEmpresaData(data),
      sectorId: sector.id,
      localidadId: localidad.id,
      cicloFormativoId: cicloFormativo?.id ?? null,
    },
  });
}

export async function createEmpresasBatch(data: EmpresaInput[]) {
  const normalizedData = data.map((item) => ({
    ...item,
    sector: item.sector.trim(),
    localidad: item.localidad.trim(),
  }));

  const requestedCicloIds = Array.from(
    new Set(
      normalizedData
        .map((item) =>
          typeof item.cicloFormativoId === "number" ? item.cicloFormativoId : null
        )
        .filter((value): value is number => value !== null)
    )
  );
  const requestedSectores = Array.from(
    new Set(normalizedData.map((item) => item.sector).filter(Boolean))
  );
  const requestedLocalidades = Array.from(
    new Set(normalizedData.map((item) => item.localidad).filter(Boolean))
  );

  const ciclosFormativos =
    requestedCicloIds.length > 0
      ? await prisma.cicloFormativo.findMany({
          where: {
            id: { in: requestedCicloIds },
            activo: true,
          },
          select: { id: true },
        })
      : [];
  const sectores =
    requestedSectores.length > 0
      ? await prisma.sector.findMany({
          where: {
            nombre: { in: requestedSectores },
            activo: true,
          },
          select: { id: true, nombre: true },
        })
      : [];
  const localidades =
    requestedLocalidades.length > 0
      ? await prisma.localidad.findMany({
          where: {
            nombre: { in: requestedLocalidades },
            activo: true,
          },
          select: { id: true, nombre: true },
        })
      : [];

  const ciclosActivos = new Set(ciclosFormativos.map((item) => item.id));
  const sectoresActivos = new Map(sectores.map((item) => [item.nombre, item.id]));
  const localidadesActivas = new Map(localidades.map((item) => [item.nombre, item.id]));

  if (requestedCicloIds.some((id) => !ciclosActivos.has(id))) {
    throw new Error("CICLO_FORMATIVO_INVALIDO");
  }
  if (requestedSectores.some((nombre) => !sectoresActivos.has(nombre))) {
    throw new Error("SECTOR_INVALIDO");
  }
  if (requestedLocalidades.some((nombre) => !localidadesActivas.has(nombre))) {
    throw new Error("LOCALIDAD_INVALIDA");
  }

  return prisma.empresa.createMany({
    data: normalizedData.map((item) => ({
      ...normalizeEmpresaData(item),
      sectorId: sectoresActivos.get(item.sector)!,
      localidadId: localidadesActivas.get(item.localidad)!,
      cicloFormativoId:
        typeof item.cicloFormativoId === "number" ? item.cicloFormativoId : null,
    })),
  });
}

export async function updateEmpresa(id: number, data: EmpresaUpdateInput) {
  const [sector, localidad, cicloFormativo] = await Promise.all([
    data.sector !== undefined
      ? getSectorForUpdateOrThrow(id, data.sector.trim())
      : Promise.resolve(undefined),
    data.localidad !== undefined
      ? getLocalidadOrThrow(data.localidad.trim())
      : Promise.resolve(undefined),
    typeof data.cicloFormativoId === "number"
      ? getCicloFormativoForUpdateOrThrow(id, data.cicloFormativoId)
      : data.cicloFormativoId === null
        ? Promise.resolve(null)
        : Promise.resolve(undefined),
  ]);

  return prisma.empresa.update({
    where: { id },
    data: {
      ...(data.nombre !== undefined ? { nombre: data.nombre.trim() } : {}),
      ...(data.cif !== undefined ? { cif: data.cif.trim() } : {}),
      ...(data.direccion !== undefined
        ? { direccion: normalizeOptionalString(data.direccion) }
        : {}),
      ...(localidad !== undefined ? { localidadId: localidad?.id ?? null } : {}),
      ...(sector !== undefined ? { sectorId: sector?.id ?? null } : {}),
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
