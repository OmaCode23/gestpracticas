import ExcelJS from "exceljs";
import * as XLSX from "xlsx";
import { ALUMNO_FIELDS } from "@/modules/alumnos/fields";
import { EMPRESA_FIELDS } from "@/modules/empresas/fields";
import { FORMACION_FIELDS } from "@/modules/formacion/fields";
import {
  DEFAULT_MES_CAMBIO_CURSO,
  DEFAULT_NUMERO_CURSOS_VISIBLES,
  getCursosAcademicos,
} from "@/shared/catalogs/academico";
import type { CardConfig, ImportErrorResponse, SheetRow } from "./types";

type WorkbookCatalogs = {
  ciclosFormativos: string[];
  cursos: string[];
  sectores: string[];
  localidades: string[];
};

function getRowValue(row: SheetRow, column: string) {
  if (column in row) {
    return row[column] ?? "";
  }

  const normalizedTarget = normalizeHeader(column);

  for (const [key, value] of Object.entries(row)) {
    if (normalizeHeader(key) === normalizedTarget) {
      return value ?? "";
    }
  }

  return "";
}

function mapRowsByFieldConfig(
  rows: SheetRow[],
  fields: Array<{ key: string; label: string }>
) {
  return rows.map((row) =>
    fields.reduce<Record<string, string>>((acc, field) => {
      acc[field.key] = getRowValue(row, field.label);
      return acc;
    }, {})
  );
}

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
    .replace(/\./g, "")
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

type WorkbookOptions = {
  title?: string;
  subtitle?: string;
  sheetName?: string;
  template?: boolean;
};

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

async function loadWorkbookCatalogs(): Promise<WorkbookCatalogs> {
  const [catalogosResponse, settingsResponse] = await Promise.all([
    fetch("/api/catalogos/empresas", { cache: "no-store" }),
    fetch("/api/settings/academico", { cache: "no-store" }),
  ]);

  const catalogosJson = await catalogosResponse.json();
  const settingsJson = await settingsResponse.json();

  const ciclosFormativos = catalogosJson?.ok
    ? (catalogosJson.data.ciclosFormativos as Array<{ nombre: string }>).map(
        (item) => item.nombre
      )
    : [];
  const sectores = catalogosJson?.ok
    ? (
        (catalogosJson.data.sectores as Array<{ id: number; nombre: string }> | undefined) ?? []
      ).map((item) => item.nombre)
    : [];
  const localidades = catalogosJson?.ok
    ? (
        (catalogosJson.data.localidades as Array<{ id: number; nombre: string }> | undefined) ?? []
      ).map((item) => item.nombre)
    : [];
  const cursos = settingsJson?.ok
    ? getCursosAcademicos(
        settingsJson.data.numeroCursosVisibles,
        new Date(),
        settingsJson.data.mesCambioCurso
      )
    : getCursosAcademicos(
        DEFAULT_NUMERO_CURSOS_VISIBLES,
        new Date(),
        DEFAULT_MES_CAMBIO_CURSO
      );

  return {
    ciclosFormativos,
    cursos,
    sectores,
    localidades,
  };
}

/**
 * Reune todas las validaciones previas a enviar el Excel al servidor.
 * Asi se detectan errores de estructura y catalogos antes de llamar a la API.
 */
export async function collectExcelValidationErrors(input: {
  config: CardConfig;
  headerRow: string[];
  rows: SheetRow[];
}) {
  const { config, headerRow, rows } = input;
  const errors: string[] = [];
  const catalogs = await loadWorkbookCatalogs();

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
      (column) => String(getRowValue(row, column)).trim() === ""
    );

    if (missingColumns.length > 0) {
      errors.push(
        `Fila ${excelRow}: faltan datos obligatorios en ${missingColumns.join(", ")}.`
      );
    }
  });

  if (config.entidad === "empresas") {
    errors.push(...collectEmpresaCatalogErrors(rows, catalogs));

    const duplicateCifs = findDuplicateValues(rows, "CIF");

    duplicateCifs.forEach((duplicate) => {
      errors.push(
        `CIF duplicado en el Excel: "${duplicate.value}" aparece en las filas ${duplicate.firstRow} y ${duplicate.duplicateRow}.`
      );
    });
  }

  if (config.entidad === "alumnos") {
    errors.push(...collectAlumnoCatalogErrors(rows, catalogs));

    const duplicateNias = findDuplicateValues(rows, "NIA");
    const duplicateNifs = findDuplicateValues(rows, "NIF");
    const duplicateNusses = findDuplicateValues(rows, "NUSS");

    duplicateNias.forEach((duplicate) => {
      errors.push(
        `NIA duplicado en el Excel: "${duplicate.value}" aparece en las filas ${duplicate.firstRow} y ${duplicate.duplicateRow}.`
      );
    });

    duplicateNifs.forEach((duplicate) => {
      errors.push(
        `NIF duplicado en el Excel: "${duplicate.value}" aparece en las filas ${duplicate.firstRow} y ${duplicate.duplicateRow}.`
      );
    });

    duplicateNusses.forEach((duplicate) => {
      errors.push(
        `NUSS duplicado en el Excel: "${duplicate.value}" aparece en las filas ${duplicate.firstRow} y ${duplicate.duplicateRow}.`
      );
    });
  }

  if (config.entidad === "formacion") {
    errors.push(...collectFormacionCatalogErrors(rows, catalogs));
  }

  return errors;
}

/**
 * Adapta las filas tipadas del Excel al payload esperado por la importacion de empresas.
 */
export function mapEmpresaRows(rows: SheetRow[]) {
  return mapRowsByFieldConfig(rows, EMPRESA_FIELDS).map((row) => ({
    ...row,
    telefono: normalizePhone(row.telefono),
  }));
}

export function mapAlumnoRows(rows: SheetRow[]) {
  return mapRowsByFieldConfig(rows, ALUMNO_FIELDS).map((row) => ({
    ...row,
    telefono: normalizePhone(row.telefono),
  }));
}

export function mapFormacionRows(rows: SheetRow[]) {
  return mapRowsByFieldConfig(rows, FORMACION_FIELDS);
}

/**
 * Valida que los valores ligados a catalogos compartidos existan realmente.
 */
function collectEmpresaCatalogErrors(rows: SheetRow[], catalogs: WorkbookCatalogs) {
  const localidades = new Set(catalogs.localidades);
  const sectores = new Set(catalogs.sectores);
  const ciclos = new Set(catalogs.ciclosFormativos);
  const errors: string[] = [];

  rows.forEach((row, index) => {
    const excelRow = index + 2;
    const localidad = String(getRowValue(row, "Localidad")).trim();
    const sector = String(getRowValue(row, "Sector")).trim();
    const cicloFormativo = String(getRowValue(row, "Ciclo Formativo")).trim();

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

function collectAlumnoCatalogErrors(rows: SheetRow[], catalogs: WorkbookCatalogs) {
  const ciclos = new Set(catalogs.ciclosFormativos);
  const cursos = new Set(catalogs.cursos);
  const errors: string[] = [];

  rows.forEach((row, index) => {
    const excelRow = index + 2;
    const ciclo = String(getRowValue(row, "Ciclo")).trim();
    const curso = String(getRowValue(row, "Curso")).trim();

    if (ciclo && !ciclos.has(ciclo)) {
      errors.push(`Fila ${excelRow}: el ciclo formativo "${ciclo}" no existe en el catalogo.`);
    }

    if (curso && !cursos.has(curso)) {
      errors.push(`Fila ${excelRow}: el curso "${curso}" no existe en la configuracion academica.`);
    }
  });

  return errors;
}

function collectFormacionCatalogErrors(rows: SheetRow[], catalogs: WorkbookCatalogs) {
  const cursos = new Set(catalogs.cursos);
  const errors: string[] = [];

  rows.forEach((row, index) => {
    const excelRow = index + 2;
    const curso = String(getRowValue(row, "Curso")).trim();

    if (curso && !cursos.has(curso)) {
      errors.push(`Fila ${excelRow}: el curso "${curso}" no existe en la configuracion academica.`);
    }
  });

  return errors;
}

/**
 * Indica si la plantilla exportada debe incluir una hoja extra con catalogos de apoyo.
 */
function hasCatalogColumns(columns: string[]) {
  return ["Localidad", "Sector", "Ciclo Formativo", "Ciclo", "Curso"].some((column) =>
    columns.includes(column)
  );
}

/**
 * Construye la hoja auxiliar de catalogos para ayudar al usuario a rellenar plantillas.
 */
function buildCatalogRows(catalogs: WorkbookCatalogs) {
  const totalRows = Math.max(
    catalogs.ciclosFormativos.length,
    catalogs.sectores.length,
    catalogs.localidades.length,
    catalogs.cursos.length,
    1
  );

  return Array.from({ length: totalRows }, (_, index) => ({
    "Ciclos Formativos": catalogs.ciclosFormativos[index] ?? "",
    Sectores: catalogs.sectores[index] ?? "",
    "Localidades o Municipios": catalogs.localidades[index] ?? "",
    "Cursos Academicos": catalogs.cursos[index] ?? "",
  }));
}

function computeColumnWidths(columns: string[], rows: SheetRow[]) {
  return columns.map((column) => {
    const maxContentLength = rows.reduce((max, row) => {
      return Math.max(max, String(row[column] ?? "").length);
    }, column.length);

    return {
      wch: Math.min(Math.max(maxContentLength + 3, 14), 36),
    };
  });
}

function triggerWorkbookDownload(buffer: ArrayBuffer, fileName: string) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function styleWorkbookHeaderRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = {
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF9F1D3E" },
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FFE5E7EB" } },
      left: { style: "thin", color: { argb: "FFE5E7EB" } },
      bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
      right: { style: "thin", color: { argb: "FFE5E7EB" } },
    };
  });
}

function styleWorkbookBodyRows(worksheet: ExcelJS.Worksheet, fromRow: number, toRow: number) {
  for (let rowIndex = fromRow; rowIndex <= toRow; rowIndex += 1) {
    const row = worksheet.getRow(rowIndex);
    row.eachCell((cell) => {
      cell.alignment = {
        vertical: "top",
        wrapText: true,
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FFF1F5F9" } },
        left: { style: "thin", color: { argb: "FFF1F5F9" } },
        bottom: { style: "thin", color: { argb: "FFF1F5F9" } },
        right: { style: "thin", color: { argb: "FFF1F5F9" } },
      };
    });
  }
}

function prepareTemplateEntryArea(
  worksheet: ExcelJS.Worksheet,
  columns: string[],
  fromRow: number,
  toRow: number
) {
  for (let columnIndex = 1; columnIndex <= columns.length; columnIndex += 1) {
    const column = worksheet.getColumn(columnIndex);
    column.alignment = {
      vertical: "top",
      wrapText: true,
    };
  }

  for (let rowIndex = fromRow; rowIndex <= toRow; rowIndex += 1) {
    const row = worksheet.getRow(rowIndex);
    row.height = 22;

    for (let columnIndex = 1; columnIndex <= columns.length; columnIndex += 1) {
      const cell = row.getCell(columnIndex);
      cell.alignment = {
        vertical: "top",
        wrapText: true,
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FFF1F5F9" } },
        left: { style: "thin", color: { argb: "FFF1F5F9" } },
        bottom: { style: "thin", color: { argb: "FFF1F5F9" } },
        right: { style: "thin", color: { argb: "FFF1F5F9" } },
      };
    }
  }
}

function applyEmpresaTemplateValidations(
  worksheet: ExcelJS.Worksheet,
  columns: string[],
  dataStartRow: number,
  dataEndRow: number,
  catalogs: WorkbookCatalogs
) {
  const localidadIndex = columns.indexOf("Localidad");
  const sectorIndex = columns.indexOf("Sector");
  const cicloEmpresaIndex = columns.indexOf("Ciclo Formativo");
  const cicloAlumnoIndex = columns.indexOf("Ciclo");
  const cursoIndex = columns.indexOf("Curso");

  const applyValidation = (
    columnIndex: number,
    formula: string,
    errorTitle: string,
    error: string
  ) => {
    for (let rowIndex = dataStartRow; rowIndex <= dataEndRow; rowIndex += 1) {
      worksheet.getCell(rowIndex, columnIndex + 1).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [formula],
        showErrorMessage: true,
        errorStyle: "error",
        errorTitle,
        error,
      };
    }
  };

  if (localidadIndex >= 0) {
    applyValidation(
      localidadIndex,
      `Catalogos!$C$2:$C$${Math.max(catalogs.localidades.length, 1) + 1}`,
      "Localidad no valida",
      "Selecciona una localidad de la lista desplegable."
    );
  }

  if (sectorIndex >= 0) {
    applyValidation(
      sectorIndex,
      `Catalogos!$B$2:$B$${Math.max(catalogs.sectores.length, 1) + 1}`,
      "Sector no valido",
      "Selecciona un sector de la lista desplegable."
    );
  }

  if (cicloEmpresaIndex >= 0) {
    applyValidation(
      cicloEmpresaIndex,
      `Catalogos!$A$2:$A$${Math.max(catalogs.ciclosFormativos.length, 1) + 1}`,
      "Ciclo formativo no valido",
      "Selecciona un ciclo formativo de la lista desplegable."
    );
  }

  if (cicloAlumnoIndex >= 0) {
    applyValidation(
      cicloAlumnoIndex,
      `Catalogos!$A$2:$A$${Math.max(catalogs.ciclosFormativos.length, 1) + 1}`,
      "Ciclo formativo no valido",
      "Selecciona un ciclo formativo de la lista desplegable."
    );
  }

  if (cursoIndex >= 0) {
    applyValidation(
      cursoIndex,
      `Catalogos!$D$2:$D$${Math.max(catalogs.cursos.length, 1) + 1}`,
      "Curso no valido",
      "Selecciona un curso academico de la lista desplegable."
    );
  }
}

/**
 * Genera y descarga un libro Excel con la hoja principal de datos y, cuando procede,
 * una segunda hoja con catalogos de referencia.
 */
export async function downloadWorkbook(
  rows: SheetRow[],
  columns: string[],
  fileName: string,
  options: WorkbookOptions = {}
) {
  const exportRows = rows.length > 0 ? rows : [createEmptyRow(columns)];
  const catalogs = await loadWorkbookCatalogs();
  const workbook = new ExcelJS.Workbook();
  const title = options.title ?? "Exportacion";
  const subtitle =
    options.subtitle ?? `Generado el ${new Intl.DateTimeFormat("es-ES", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date())}`;
  const worksheet = workbook.addWorksheet(options.sheetName ?? "Datos", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 4 }],
  });

  worksheet.mergeCells(1, 1, 1, columns.length);
  worksheet.mergeCells(2, 1, 2, columns.length);
  worksheet.getCell(1, 1).value = title;
  worksheet.getCell(2, 1).value = subtitle;
  worksheet.getCell(1, 1).font = { bold: true, size: 15, color: { argb: "FF1A1F36" } };
  worksheet.getCell(2, 1).font = { italic: true, size: 10, color: { argb: "FF6D5A59" } };
  worksheet.getCell(1, 1).alignment = { horizontal: "left", vertical: "middle" };
  worksheet.getCell(2, 1).alignment = { horizontal: "left", vertical: "middle" };

  const headerRowIndex = 4;
  const headerRow = worksheet.getRow(headerRowIndex);
  headerRow.values = columns;
  styleWorkbookHeaderRow(headerRow);

  exportRows.forEach((row, index) => {
    const excelRow = worksheet.getRow(headerRowIndex + 1 + index);
    excelRow.values = columns.map((column) => row[column] ?? "");
  });

  styleWorkbookBodyRows(
    worksheet,
    headerRowIndex + 1,
    headerRowIndex + exportRows.length
  );

  computeColumnWidths(columns, exportRows).forEach((width, index) => {
    worksheet.getColumn(index + 1).width = width.wch;
  });

  worksheet.autoFilter = {
    from: { row: headerRowIndex, column: 1 },
    to: { row: headerRowIndex, column: columns.length },
  };

  if (hasCatalogColumns(columns)) {
    const catalogWorksheet = workbook.addWorksheet("Catalogos");
    const catalogHeaders = [
      "Ciclos Formativos",
      "Sectores",
      "Localidades o Municipios",
      "Cursos Academicos",
    ];
    catalogWorksheet.addRow(catalogHeaders);
    styleWorkbookHeaderRow(catalogWorksheet.getRow(1));
    buildCatalogRows(catalogs).forEach((row) => {
      catalogWorksheet.addRow([
        row["Ciclos Formativos"],
        row.Sectores,
        row["Localidades o Municipios"],
        row["Cursos Academicos"],
      ]);
    });
    catalogWorksheet.getColumn(1).width = 34;
    catalogWorksheet.getColumn(2).width = 24;
    catalogWorksheet.getColumn(3).width = 34;
    catalogWorksheet.getColumn(4).width = 22;

    if (options.template) {
      prepareTemplateEntryArea(worksheet, columns, headerRowIndex + 1, 300);
      applyEmpresaTemplateValidations(
        worksheet,
        columns,
        headerRowIndex + 1,
        300,
        catalogs
      );
    }
  } else if (options.template) {
    prepareTemplateEntryArea(worksheet, columns, headerRowIndex + 1, 300);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  triggerWorkbookDownload(buffer as ArrayBuffer, fileName);
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
