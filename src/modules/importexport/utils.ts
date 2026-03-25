import * as XLSX from "xlsx";
import type { CardConfig, ImportErrorResponse, SheetRow } from "./types";

export function normalizePhone(value: string) {
  return value.replace(/\s+/g, "").trim();
}

export function normalizeHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function createEmptyRow(columns: string[]) {
  return columns.reduce<SheetRow>((acc, column) => {
    acc[column] = "";
    return acc;
  }, {});
}

export function formatDateStamp(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function formatLogDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function buildSheetRows(rawRows: Record<string, unknown>[], config: CardConfig) {
  const columnMap = new Map(config.columnas.map((column) => [normalizeHeader(column), column]));

  return rawRows
    .map((rawRow) => {
      const normalized = createEmptyRow(config.columnas);

      for (const [key, value] of Object.entries(rawRow)) {
        const targetColumn = columnMap.get(normalizeHeader(key));

        if (targetColumn) {
          normalized[targetColumn] = String(value ?? "").trim();
        }
      }

      return normalized;
    })
    .filter((row) =>
      config.columnas.some((column) => {
        return row[column].trim() !== "";
      })
    );
}

export function findDuplicateValues(rows: SheetRow[], column: string) {
  const seen = new Map<string, number>();
  const duplicates: Array<{ value: string; firstRow: number; duplicateRow: number }> = [];

  rows.forEach((row, index) => {
    const value = row[column]?.trim();

    if (!value) return;

    const normalizedValue = value.toUpperCase();
    const excelRow = index + 2;

    if (seen.has(normalizedValue)) {
      duplicates.push({
        value,
        firstRow: seen.get(normalizedValue)!,
        duplicateRow: excelRow,
      });
      return;
    }

    seen.set(normalizedValue, excelRow);
  });

  return duplicates;
}

export function getMissingHeaders(headers: string[], config: CardConfig) {
  const normalizedHeaders = new Set(headers.map((header) => normalizeHeader(header)));

  return config.requiredColumns.filter(
    (column) => !normalizedHeaders.has(normalizeHeader(column))
  );
}

export function collectExcelValidationErrors(input: {
  config: CardConfig;
  headerRow: string[];
  rows: SheetRow[];
}) {
  const { config, headerRow, rows } = input;
  const errors: string[] = [];

  const missingHeaders = getMissingHeaders(headerRow, config);
  if (missingHeaders.length > 0) {
    errors.push(
      `Faltan columnas obligatorias en la cabecera: ${missingHeaders.join(", ")}.`
    );
  }

  if (rows.length === 0) {
    errors.push("El archivo no contiene filas con datos.");
    return errors;
  }

  rows.forEach((row, index) => {
    const excelRow = index + 2;
    const missingColumns = config.requiredColumns.filter(
      (column) => row[column].trim() === ""
    );

    if (missingColumns.length > 0) {
      errors.push(
        `Fila ${excelRow}: faltan datos obligatorios en ${missingColumns.join(", ")}.`
      );
    }
  });

  if (config.entidad === "empresas") {
    const duplicateCifs = findDuplicateValues(rows, "CIF");

    duplicateCifs.forEach((duplicate) => {
      errors.push(
        `CIF duplicado en el Excel: "${duplicate.value}" aparece en las filas ${duplicate.firstRow} y ${duplicate.duplicateRow}.`
      );
    });
  }

  return errors;
}

export function mapEmpresaRows(rows: SheetRow[]) {
  return rows.map((row) => ({
    cif: row.CIF,
    nombre: row.Nombre,
    direccion: row.Direccion,
    localidad: row.Localidad,
    sector: row.Sector,
    cicloFormativo: row["Ciclo Formativo"],
    telefono: normalizePhone(row.Telefono),
    email: row["Correo Empresa"],
    contacto: row.Contacto,
    emailContacto: row["Correo Contacto"],
  }));
}

export function downloadWorkbook(rows: SheetRow[], columns: string[], fileName: string) {
  const exportRows = rows.length > 0 ? rows : [createEmptyRow(columns)];
  const worksheet = XLSX.utils.json_to_sheet(exportRows, { header: columns });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");
  XLSX.writeFile(workbook, fileName);
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Ha ocurrido un error inesperado.";
}

export function getErrorDetails(error: ImportErrorResponse) {
  return Array.isArray(error.details) ? error.details : [];
}
