import { prisma } from "@/database/prisma";
import { alumnoSchema } from "@/modules/alumnos/types/schema";
import type { AlumnoInput } from "@/modules/alumnos/types";
import { createEmpresasBatch } from "@/modules/empresas/actions/mutations";
import type { EmpresaInput } from "@/modules/empresas/types";
import { empresaSchema } from "@/modules/empresas/types/schema";
import { formacionSchema } from "@/modules/formacion/types/schema";
import { createImportExportLog } from "./logs";
import type { ZodError } from "zod";

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

export type AlumnoImportRow = {
  nia: string;
  nif?: string;
  nuss?: string;
  nombre: string;
  telefono: string;
  email: string;
  ciclo: string;
  cursoCiclo: string | number;
  curso: string;
};

export type FormacionImportRow = {
  empresa: string;
  alumno: string;
  periodo: string;
  descripcion?: string;
  tutorLaboral?: string;
  emailTutorLaboral?: string;
  curso: string;
};

export type ImportResult =
  | { ok: true; message: string; importedCount: number }
  | { ok: false; message: string; importedCount: number; errors: string[] };

function buildRowValidationErrors(excelRow: number, error: ZodError) {
  return error.errors.map((issue) => `Fila ${excelRow}: ${issue.message}`);
}

function normalizeEmpresaImportRow(row: EmpresaImportRow): EmpresaInput {
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

function normalizeAlumnoImportRow(row: AlumnoImportRow) {
  return {
    nia: row.nia ?? "",
    nif: row.nif ?? "",
    nuss: row.nuss ?? "",
    nombre: row.nombre ?? "",
    telefono: row.telefono ?? "",
    email: row.email ?? "",
    ciclo: row.ciclo ?? "",
    cursoCiclo: row.cursoCiclo ?? "",
    curso: row.curso ?? "",
  };
}

function normalizeKey(value: string) {
  return value.trim().toLocaleLowerCase("es-ES");
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

export async function importEmpresas(rows: EmpresaImportRow[]): Promise<ImportResult> {
  const normalizedRows = rows.map(normalizeEmpresaImportRow);
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
      errors.push(...buildRowValidationErrors(index + 2, parsed.error));
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

export async function importAlumnos(rows: AlumnoImportRow[]): Promise<ImportResult> {
  const normalizedRows = rows.map(normalizeAlumnoImportRow);
  const parsedRows: AlumnoInput[] = [];
  const errors: string[] = [];

  if (normalizedRows.length === 0) {
    const message = "El archivo no contiene filas con datos para importar.";
    await createImportExportLog({
      entidad: "Alumnos",
      accion: "Importacion",
      registros: 0,
      estado: "Fallido",
      detalle: message,
    });
    return { ok: false, message, importedCount: 0, errors: [message] };
  }

  const seen = new Map<string, number>();

  normalizedRows.forEach((row, index) => {
    const excelRow = index + 2;
    const nia = row.nia.trim().toUpperCase();
    const firstRow = seen.get(nia);

    if (firstRow) {
      errors.push(`NIA duplicado en el Excel: "${nia}" aparece en las filas ${firstRow} y ${excelRow}.`);
    } else if (nia) {
      seen.set(nia, excelRow);
    }

    const parsed = alumnoSchema.safeParse(row);
    if (!parsed.success) {
      errors.push(...buildRowValidationErrors(excelRow, parsed.error));
    } else {
      parsedRows.push(parsed.data);
    }
  });

  const nias = normalizedRows.map((row) => row.nia.trim().toUpperCase()).filter(Boolean);

  if (nias.length > 0) {
    const existingAlumnos = await prisma.alumno.findMany({
      where: { nia: { in: nias } },
      select: { nia: true },
    });

    const existingNias = new Set(existingAlumnos.map((alumno) => alumno.nia.toUpperCase()));

    normalizedRows.forEach((row, index) => {
      const nia = row.nia.trim().toUpperCase();
      if (existingNias.has(nia)) {
        errors.push(`Fila ${index + 2}: ya existe un alumno con el NIA ${nia}.`);
      }
    });
  }

  if (errors.length > 0) {
    const message = `Importacion cancelada. Revisa ${errors.length} incidencia(s).`;
    await createImportExportLog({
      entidad: "Alumnos",
      accion: "Importacion",
      registros: 0,
      estado: "Fallido",
      detalle: errors.join("\n"),
    });
    return { ok: false, message, importedCount: 0, errors };
  }

  const result = await prisma.alumno.createMany({
    data: parsedRows.map((row) => ({
      nombre: row.nombre.trim(),
      nia: row.nia.trim(),
      nif: row.nif.trim() || null,
      nuss: row.nuss.trim() || null,
      telefono: row.telefono.trim(),
      email: row.email.trim().toLowerCase(),
      ciclo: row.ciclo.trim(),
      cursoCiclo: row.cursoCiclo,
      curso: row.curso.trim(),
    })),
  });

  const message = `Importacion completada (${result.count} registros).`;

  await createImportExportLog({
    entidad: "Alumnos",
    accion: "Importacion",
    registros: result.count,
    estado: "Completado",
    detalle: `${result.count} registro(s) importado(s) correctamente.`,
  });

  return { ok: true, message, importedCount: result.count };
}

export async function importFormaciones(rows: FormacionImportRow[]): Promise<ImportResult> {
  const errors: string[] = [];

  if (rows.length === 0) {
    const message = "El archivo no contiene filas con datos para importar.";
    await createImportExportLog({
      entidad: "Form. Empresa",
      accion: "Importacion",
      registros: 0,
      estado: "Fallido",
      detalle: message,
    });
    return { ok: false, message, importedCount: 0, errors: [message] };
  }

  const [empresas, alumnos] = await Promise.all([
    prisma.empresa.findMany({
      select: { id: true, nombre: true },
    }),
    prisma.alumno.findMany({
      select: { id: true, nombre: true },
    }),
  ]);

  const empresasByName = new Map<string, number[]>();
  empresas.forEach((empresa) => {
    const key = normalizeKey(empresa.nombre);
    empresasByName.set(key, [...(empresasByName.get(key) ?? []), empresa.id]);
  });

  const alumnosByName = new Map<string, number[]>();
  alumnos.forEach((alumno) => {
    const key = normalizeKey(alumno.nombre);
    alumnosByName.set(key, [...(alumnosByName.get(key) ?? []), alumno.id]);
  });

  const normalizedRows = rows.flatMap((row, index) => {
    const excelRow = index + 2;
    const empresaMatches = empresasByName.get(normalizeKey(row.empresa ?? "")) ?? [];
    const alumnoMatches = alumnosByName.get(normalizeKey(row.alumno ?? "")) ?? [];

    if (empresaMatches.length === 0) {
      errors.push(`Fila ${excelRow}: no existe ninguna empresa con el nombre "${row.empresa}".`);
      return [];
    }

    if (empresaMatches.length > 1) {
      errors.push(`Fila ${excelRow}: hay varias empresas llamadas "${row.empresa}". Usa nombres unicos antes de importar.`);
      return [];
    }

    if (alumnoMatches.length === 0) {
      errors.push(`Fila ${excelRow}: no existe ningun alumno con el nombre "${row.alumno}".`);
      return [];
    }

    if (alumnoMatches.length > 1) {
      errors.push(`Fila ${excelRow}: hay varios alumnos llamados "${row.alumno}". Usa nombres unicos antes de importar.`);
      return [];
    }

    const parsed = formacionSchema.safeParse({
      empresaId: empresaMatches[0],
      alumnoId: alumnoMatches[0],
      curso: row.curso ?? "",
      periodo: row.periodo ?? "",
      descripcion: row.descripcion ?? "",
      tutorLaboral: row.tutorLaboral ?? "",
      emailTutorLaboral: row.emailTutorLaboral ?? "",
    });

    if (!parsed.success) {
      errors.push(...buildRowValidationErrors(excelRow, parsed.error));
      return [];
    }

    return [parsed.data];
  });

  if (errors.length > 0) {
    const message = `Importacion cancelada. Revisa ${errors.length} incidencia(s).`;
    await createImportExportLog({
      entidad: "Form. Empresa",
      accion: "Importacion",
      registros: 0,
      estado: "Fallido",
      detalle: errors.join("\n"),
    });
    return { ok: false, message, importedCount: 0, errors };
  }

  const result = await prisma.formacionEmpresa.createMany({
    data: normalizedRows.map((row) => ({
      empresaId: row.empresaId,
      alumnoId: row.alumnoId,
      curso: row.curso.trim(),
      periodo: row.periodo.trim(),
      descripcion: row.descripcion?.trim() || null,
      tutorLaboral: row.tutorLaboral?.trim() || null,
      emailTutorLaboral: row.emailTutorLaboral?.trim().toLowerCase() || null,
    })),
  });

  const message = `Importacion completada (${result.count} registros).`;

  await createImportExportLog({
    entidad: "Form. Empresa",
    accion: "Importacion",
    registros: result.count,
    estado: "Completado",
    detalle: `${result.count} registro(s) importado(s) correctamente.`,
  });

  return { ok: true, message, importedCount: result.count };
}
