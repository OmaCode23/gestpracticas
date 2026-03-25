import { prisma } from "@/database/prisma";
import { createEmpresasBatch } from "@/modules/empresas/actions/mutations";
import { empresaSchema } from "@/modules/empresas/types/schema";
import type { EmpresaInput } from "@/modules/empresas/types";
import { createImportExportLog } from "./logs";

export type EmpresaImportRow = {
  cif: string;
  nombre: string;
  direccion?: string;
  localidad: string;
  sector: string;
  cicloFormativo?: string;
  telefono?: string;
  email?: string;
  contacto?: string;
  emailContacto?: string;
};

export type EmpresaImportResult =
  | { ok: true; message: string; importedCount: number }
  | { ok: false; message: string; importedCount: number; errors: string[] };

function normalizeImportRow(row: EmpresaImportRow): EmpresaInput {
  return {
    cif: row.cif ?? "",
    nombre: row.nombre ?? "",
    direccion: row.direccion ?? "",
    localidad: row.localidad ?? "",
    sector: row.sector ?? "",
    cicloFormativo: row.cicloFormativo ?? "",
    telefono: row.telefono ?? "",
    email: row.email ?? "",
    contacto: row.contacto ?? "",
    emailContacto: row.emailContacto ?? "",
  };
}

function buildDuplicateErrors(rows: EmpresaInput[]) {
  const seen = new Map<string, number>();
  const errors: string[] = [];

  rows.forEach((row, index) => {
    const cif = row.cif.trim().toUpperCase();

    if (!cif) return;

    const excelRow = index + 2;
    const firstRow = seen.get(cif);

    if (firstRow) {
      errors.push(
        `CIF duplicado en el Excel: "${cif}" aparece en las filas ${firstRow} y ${excelRow}.`
      );
      return;
    }

    seen.set(cif, excelRow);
  });

  return errors;
}

export async function importEmpresas(rows: EmpresaImportRow[]): Promise<EmpresaImportResult> {
  const normalizedRows = rows.map(normalizeImportRow);
  const errors: string[] = [];

  if (normalizedRows.length === 0) {
    const message = "El archivo no contiene filas con datos para importar.";
    await createImportExportLog({
      entidad: "Empresas",
      accion: "Importacion",
      registros: 0,
      estado: "Fallido",
      detalle: message,
    });
    return { ok: false, message, importedCount: 0, errors: [message] };
  }

  errors.push(...buildDuplicateErrors(normalizedRows));

  normalizedRows.forEach((row, index) => {
    const parsed = empresaSchema.safeParse(row);

    if (!parsed.success) {
      errors.push(`Fila ${index + 2}: ${parsed.error.errors[0].message}`);
    }
  });

  const cifs = normalizedRows.map((row) => row.cif.trim().toUpperCase()).filter(Boolean);

  if (cifs.length > 0) {
    const existingCompanies = await prisma.empresa.findMany({
      where: { cif: { in: cifs } },
      select: { cif: true },
    });

    const existingCifs = new Set(existingCompanies.map((company) => company.cif.toUpperCase()));

    normalizedRows.forEach((row, index) => {
      const cif = row.cif.trim().toUpperCase();
      if (existingCifs.has(cif)) {
        errors.push(`Fila ${index + 2}: ya existe una empresa con el CIF ${cif}.`);
      }
    });
  }

  if (errors.length > 0) {
    const message = `Importacion cancelada. Revisa ${errors.length} incidencia(s).`;
    await createImportExportLog({
      entidad: "Empresas",
      accion: "Importacion",
      registros: 0,
      estado: "Fallido",
      detalle: errors.join("\n"),
    });
    return { ok: false, message, importedCount: 0, errors };
  }

  const result = await createEmpresasBatch(normalizedRows);
  const message = `Importacion completada (${result.count} registros).`;

  await createImportExportLog({
    entidad: "Empresas",
    accion: "Importacion",
    registros: result.count,
    estado: "Completado",
    detalle: `${result.count} registro(s) importado(s) correctamente.`,
  });

  return { ok: true, message, importedCount: result.count };
}
