import { prisma } from "@/database/prisma";
import { createEmpresasBatch } from "@/modules/empresas/actions/mutations";
import { empresaSchema } from "@/modules/empresas/types/schema";
import type { EmpresaInput } from "@/modules/empresas/types";
import { createImportExportLog } from "./logs";

/**
 * Fila cruda recibida desde el cliente para la importacion de empresas.
 */
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

/**
 * Resultado final del proceso de importacion, con exito o con incidencias detalladas.
 */
export type EmpresaImportResult =
  | { ok: true; message: string; importedCount: number }
  | { ok: false; message: string; importedCount: number; errors: string[] };

/**
 * Garantiza que todas las propiedades opcionales lleguen con string y no con null/undefined,
 * para poder validarlas de forma uniforme con Zod.
 */
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

/**
 * Detecta CIF duplicados dentro del propio Excel antes de consultar la base de datos.
 */
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

/**
 * Orquesta la importacion de empresas:
 * 1. Normaliza filas.
 * 2. Valida contenido.
 * 3. Comprueba duplicados en Excel y en base de datos.
 * 4. Inserta el lote y registra la operacion en el historial.
 */
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

  // Se valida fila a fila para poder devolver mensajes concretos al usuario.
  normalizedRows.forEach((row, index) => {
    const parsed = empresaSchema.safeParse(row);

    if (!parsed.success) {
      errors.push(`Fila ${index + 2}: ${parsed.error.errors[0].message}`);
    }
  });

  const cifs = normalizedRows.map((row) => row.cif.trim().toUpperCase()).filter(Boolean);

  if (cifs.length > 0) {
    // Antes de insertar, se comprueba si alguno de los CIF ya existe en la BD.
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
