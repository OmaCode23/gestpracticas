import * as XLSX from "xlsx";
import type { CardConfig, ImportErrorResponse, SheetRow } from "./types";
import { CICLOS_FORMATIVOS } from "@/shared/catalogs/academico";
import { SECTORES } from "@/shared/catalogs/empresa";
import { LOCALIDADES } from "@/shared/catalogs/ubicacion";

/**
 * Elimina espacios intermedios para guardar telefonos con un formato consistente.
 */
export function normalizePhone(value: string) {
  return value.replace(/\s+/g, "").trim();
}

/**
 * Normaliza nombres de columnas para poder compararlas sin depender de tildes,
 * mayusculas o simbolos usados en el Excel.
 */
export function normalizeHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Genera una fila vacia a partir de las columnas esperadas.
 * Se usa tanto para plantillas como para normalizar datos importados.
 */
export function createEmptyRow(columns: string[]) {
  return columns.reduce<SheetRow>((acc, column) => {
    acc[column] = "";
    return acc;
  }, {});
}

/**
 * Devuelve la fecha en formato YYYY-MM-DD para nombres de fichero.
 */
export function formatDateStamp(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

/**
 * Formatea fechas ISO del historial para mostrarlas al usuario final.
 */
export function formatLogDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

/**
 * Reconstruye las filas del Excel adaptandolas exactamente a las columnas definidas
 * en la configuracion de la entidad.
 */
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

/**
 * Busca valores repetidos dentro de una columna concreta y devuelve las filas
 * implicadas usando numeracion de Excel (cabecera + datos).
 */
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

/**
 * Comprueba que la cabecera subida contiene todas las columnas obligatorias.
 */
export function getMissingHeaders(headers: string[], config: CardConfig) {
  const normalizedHeaders = new Set(headers.map((header) => normalizeHeader(header)));

  return config.requiredColumns.filter(
    (column) => !normalizedHeaders.has(normalizeHeader(column))
  );
}

/**
 * Reune todas las validaciones previas a enviar el Excel al servidor.
 * Asi se detectan errores de estructura y catalogos antes de llamar a la API.
 */
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
    errors.push(...collectEmpresaCatalogErrors(rows));

    const duplicateCifs = findDuplicateValues(rows, "CIF");

    duplicateCifs.forEach((duplicate) => {
      errors.push(
        `CIF duplicado en el Excel: "${duplicate.value}" aparece en las filas ${duplicate.firstRow} y ${duplicate.duplicateRow}.`
      );
    });
  }

  return errors;
}

/**
 * Adapta las filas tipadas del Excel al payload esperado por la importacion de empresas.
 */
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

export function mapAlumnoRows(rows: SheetRow[]) {
  return rows.map((row) => ({
    nia: row.NIA,
    nombre: row.Nombre,
    telefono: normalizePhone(row.Telefono),
    email: row.Correo,
    ciclo: row.Ciclo,
    curso: row.Curso,
  }));
}

export function mapFormacionRows(rows: SheetRow[]) {
  return rows.map((row) => ({
    empresa: row.Empresa,
    alumno: row.Alumno,
    periodo: row.Periodo,
    descripcion: row.Descripcion,
    contacto: row.Contacto,
    curso: row.Curso,
  }));
}

/**
 * Valida que los valores ligados a catalogos compartidos existan realmente.
 */
function collectEmpresaCatalogErrors(rows: SheetRow[]) {
  const localidades = new Set(LOCALIDADES);
  const sectores = new Set(SECTORES);
  const ciclos = new Set(CICLOS_FORMATIVOS);
  const errors: string[] = [];

  rows.forEach((row, index) => {
    const excelRow = index + 2;
    const localidad = row.Localidad.trim();
    const sector = row.Sector.trim();
    const cicloFormativo = row["Ciclo Formativo"].trim();

    if (localidad && !localidades.has(localidad)) {
      errors.push(
        `Fila ${excelRow}: la localidad "${localidad}" no existe en el catalogo.`
      );
    }

    if (sector && !sectores.has(sector)) {
      errors.push(`Fila ${excelRow}: el sector "${sector}" no existe en el catalogo.`);
    }

    if (cicloFormativo && !ciclos.has(cicloFormativo)) {
      errors.push(
        `Fila ${excelRow}: el ciclo formativo "${cicloFormativo}" no existe en el catalogo.`
      );
    }
  });

  return errors;
}

/**
 * Indica si la plantilla exportada debe incluir una hoja extra con catalogos de apoyo.
 */
function hasEmpresaCatalogColumns(columns: string[]) {
  return ["Localidad", "Sector", "Ciclo Formativo"].every((column) =>
    columns.includes(column)
  );
}

/**
 * Construye la hoja auxiliar de catalogos para ayudar al usuario a rellenar plantillas.
 */
function buildCatalogRows() {
  const totalRows = Math.max(
    CICLOS_FORMATIVOS.length,
    SECTORES.length,
    LOCALIDADES.length
  );

  return Array.from({ length: totalRows }, (_, index) => ({
    "Ciclos Formativos": CICLOS_FORMATIVOS[index] ?? "",
    Sectores: SECTORES[index] ?? "",
    "Localidades o Municipios": LOCALIDADES[index] ?? "",
  }));
}

/**
 * Genera y descarga un libro Excel con la hoja principal de datos y, cuando procede,
 * una segunda hoja con catalogos de referencia.
 */
export function downloadWorkbook(rows: SheetRow[], columns: string[], fileName: string) {
  const exportRows = rows.length > 0 ? rows : [createEmptyRow(columns)];
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(exportRows, { header: columns });

  XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");

  if (hasEmpresaCatalogColumns(columns)) {
    const catalogWorksheet = XLSX.utils.json_to_sheet(buildCatalogRows(), {
      header: ["Ciclos Formativos", "Sectores", "Localidades o Municipios"],
    });

    XLSX.utils.book_append_sheet(workbook, catalogWorksheet, "Catalogos");
  }

  XLSX.writeFile(workbook, fileName);
}

/**
 * Convierte cualquier error desconocido en un mensaje presentable en UI.
 */
export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Ha ocurrido un error inesperado.";
}

/**
 * Extrae los detalles de validacion cuando la API los devuelve en formato esperado.
 */
export function getErrorDetails(error: ImportErrorResponse) {
  if (!error.ok && Array.isArray(error.details)) {
    return error.details;
  }

  return [];
}
