import { prisma } from "@/database/prisma";
import { alumnoSchema } from "@/modules/alumnos/types/schema";
import type { AlumnoInput } from "@/modules/alumnos/types";
import { createEmpresasBatch } from "@/modules/empresas/actions/mutations";
import type { EmpresaInput } from "@/modules/empresas/types";
import { empresaSchema } from "@/modules/empresas/types/schema";
import { formacionSchema } from "@/modules/formacion/types/schema";
import { getCursosAcademicosConfigurados } from "@/modules/settings/actions/queries";
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
  cif: string;
  nia: string;
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
    cicloFormativoId: null,
    telefono: row.telefono ?? "",
    email: row.email ?? "",
    contacto: row.contacto ?? "",
    emailContacto: row.emailContacto ?? "",
  };
}

type NormalizedEmpresaImportRow = ReturnType<typeof normalizeEmpresaImportRow> & {
  cicloFormativo: string;
};

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

async function getCiclosFormativosActivosByName() {
  const ciclos = await prisma.cicloFormativo.findMany({
    where: { activo: true },
    select: {
      id: true,
      nombre: true,
    },
  });

  return new Map(ciclos.map((ciclo) => [normalizeKey(ciclo.nombre), ciclo]));
}

async function getSectoresActivosByName() {
  const sectores = await prisma.sector.findMany({
    where: { activo: true },
    select: {
      id: true,
      nombre: true,
    },
  });

  return new Map(sectores.map((sector) => [normalizeKey(sector.nombre), sector]));
}

async function getLocalidadesActivasByName() {
  const localidades = await prisma.localidad.findMany({
    where: { activo: true },
    select: {
      id: true,
      nombre: true,
    },
  });

  return new Map(localidades.map((localidad) => [normalizeKey(localidad.nombre), localidad]));
}

function buildDuplicateErrors(rows: Array<{ cif: string }>) {
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

function buildAlumnoDuplicateErrors(rows: AlumnoInput[]) {
  const seenNia = new Map<string, number>();
  const seenNif = new Map<string, number>();
  const seenNuss = new Map<string, number>();
  const errors: string[] = [];

  rows.forEach((row, index) => {
    const excelRow = index + 2;
    const nia = row.nia.trim().toUpperCase();
    const nif = row.nif.trim().toUpperCase();
    const nuss = row.nuss.trim();

    const firstNiaRow = seenNia.get(nia);
    if (firstNiaRow) {
      errors.push(`NIA duplicado en el Excel: "${nia}" aparece en las filas ${firstNiaRow} y ${excelRow}.`);
    } else if (nia) {
      seenNia.set(nia, excelRow);
    }

    if (nif) {
      const firstNifRow = seenNif.get(nif);
      if (firstNifRow) {
        errors.push(`NIF duplicado en el Excel: "${nif}" aparece en las filas ${firstNifRow} y ${excelRow}.`);
      } else {
        seenNif.set(nif, excelRow);
      }
    }

    if (nuss) {
      const firstNussRow = seenNuss.get(nuss);
      if (firstNussRow) {
        errors.push(`NUSS duplicado en el Excel: "${nuss}" aparece en las filas ${firstNussRow} y ${excelRow}.`);
      } else {
        seenNuss.set(nuss, excelRow);
      }
    }
  });

  return errors;
}

export async function importEmpresas(rows: EmpresaImportRow[]): Promise<ImportResult> {
  const normalizedRows: NormalizedEmpresaImportRow[] = rows.map((row) => ({
    ...normalizeEmpresaImportRow(row),
    cicloFormativo: row.cicloFormativo ?? "",
  }));
  const parsedRows: EmpresaInput[] = [];
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

  const [ciclosByName, sectoresByName, localidadesByName] = await Promise.all([
    getCiclosFormativosActivosByName(),
    getSectoresActivosByName(),
    getLocalidadesActivasByName(),
  ]);

  normalizedRows.forEach((row, index) => {
    const excelRow = index + 2;
    const sectorNombre = row.sector?.trim() ?? "";
    const localidadNombre = row.localidad?.trim() ?? "";
    const cicloFormativoNombre = row.cicloFormativo?.trim() ?? "";
    const sector = sectorNombre ? sectoresByName.get(normalizeKey(sectorNombre)) : null;
    const localidad = localidadNombre
      ? localidadesByName.get(normalizeKey(localidadNombre))
      : null;
    const cicloFormativo = cicloFormativoNombre
      ? ciclosByName.get(normalizeKey(cicloFormativoNombre))
      : null;

    if (sectorNombre && !sector) {
      errors.push(
        `Fila ${excelRow}: el sector "${sectorNombre}" no existe en el catalogo activo.`
      );
    }

    if (localidadNombre && !localidad) {
      errors.push(
        `Fila ${excelRow}: la localidad "${localidadNombre}" no existe en el catalogo activo.`
      );
    }

    if (cicloFormativoNombre && !cicloFormativo) {
      errors.push(
        `Fila ${excelRow}: el ciclo formativo "${cicloFormativoNombre}" no existe en el catalogo activo.`
      );
    }

    const parsed = empresaSchema.safeParse({
      ...row,
      cicloFormativoId: cicloFormativo?.id ?? null,
    });

    if (!parsed.success) {
      errors.push(...buildRowValidationErrors(excelRow, parsed.error));
      return;
    }

    parsedRows.push(parsed.data);
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

  const result = await createEmpresasBatch(parsedRows);
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
  const parsedRows: Array<AlumnoInput & { cicloFormativoId: number }> = [];
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

  const [cursosValidos, ciclosByName] = await Promise.all([
    getCursosAcademicosConfigurados(),
    getCiclosFormativosActivosByName(),
  ]);
  const cursosValidosSet = new Set(cursosValidos);

  normalizedRows.forEach((row, index) => {
    const excelRow = index + 2;
    const parsed = alumnoSchema.safeParse(row);
    if (!parsed.success) {
      errors.push(...buildRowValidationErrors(excelRow, parsed.error));
      return;
    }

    if (!cursosValidosSet.has(parsed.data.curso)) {
      errors.push(`Fila ${excelRow}: El curso no es valido.`);
    }

    const cicloFormativo = ciclosByName.get(normalizeKey(parsed.data.ciclo));

    if (!cicloFormativo) {
      errors.push(`Fila ${excelRow}: El ciclo formativo no es valido.`);
      return;
    }

    parsedRows.push({
      ...parsed.data,
      cicloFormativoId: cicloFormativo.id,
    });
  });

  errors.push(...buildAlumnoDuplicateErrors(parsedRows));

  const nias = parsedRows.map((row) => row.nia.trim().toUpperCase()).filter(Boolean);
  const nifs = parsedRows.map((row) => row.nif.trim().toUpperCase()).filter(Boolean);
  const nusses = parsedRows.map((row) => row.nuss.trim()).filter(Boolean);

  if (nias.length > 0 || nifs.length > 0 || nusses.length > 0) {
    const existingAlumnos = await prisma.alumno.findMany({
      where: {
        OR: [
          nias.length > 0 ? { nia: { in: nias } } : undefined,
          nifs.length > 0 ? { nif: { in: nifs } } : undefined,
          nusses.length > 0 ? { nuss: { in: nusses } } : undefined,
        ].filter(Boolean) as { nia?: { in: string[] }; nif?: { in: string[] }; nuss?: { in: string[] } }[],
      },
      select: { nia: true, nif: true, nuss: true },
    });

    const existingNias = new Set(existingAlumnos.map((alumno) => alumno.nia.toUpperCase()));
    const existingNifs = new Set(
      existingAlumnos.map((alumno) => alumno.nif?.toUpperCase() ?? "").filter(Boolean)
    );
    const existingNusses = new Set(
      existingAlumnos.map((alumno) => alumno.nuss ?? "").filter(Boolean)
    );

    parsedRows.forEach((row, index) => {
      const nia = row.nia.trim().toUpperCase();
      const nif = row.nif.trim().toUpperCase();
      const nuss = row.nuss.trim();
      const excelRow = normalizedRows.findIndex(
        (candidate) => candidate.nia.trim().toUpperCase() === nia
      ) + 2;

      if (existingNias.has(nia)) {
        errors.push(`Fila ${excelRow || index + 2}: ya existe un alumno con el NIA ${nia}.`);
      }
      if (nif && existingNifs.has(nif)) {
        errors.push(`Fila ${excelRow || index + 2}: ya existe un alumno con el NIF ${nif}.`);
      }
      if (nuss && existingNusses.has(nuss)) {
        errors.push(`Fila ${excelRow || index + 2}: ya existe un alumno con el NUSS ${nuss}.`);
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
      cicloFormativoId: row.cicloFormativoId,
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

  const [empresas, alumnos, cursosValidos] = await Promise.all([
    prisma.empresa.findMany({
      select: { id: true, cif: true },
    }),
    prisma.alumno.findMany({
      select: { id: true, nia: true },
    }),
    getCursosAcademicosConfigurados(),
  ]);
  const cursosValidosSet = new Set(cursosValidos);

  const empresasByCif = new Map<string, number[]>();
  empresas.forEach((empresa) => {
    const key = empresa.cif.trim().toUpperCase();
    empresasByCif.set(key, [...(empresasByCif.get(key) ?? []), empresa.id]);
  });

  const alumnosByNia = new Map<string, number[]>();
  alumnos.forEach((alumno) => {
    const key = alumno.nia.trim().toUpperCase();
    alumnosByNia.set(key, [...(alumnosByNia.get(key) ?? []), alumno.id]);
  });

  const normalizedRows = rows.flatMap((row, index) => {
    const excelRow = index + 2;
    const cif = row.cif?.trim().toUpperCase() ?? "";
    const nia = row.nia?.trim().toUpperCase() ?? "";
    const empresaMatches = empresasByCif.get(cif) ?? [];
    const alumnoMatches = alumnosByNia.get(nia) ?? [];

    if (empresaMatches.length === 0) {
      errors.push(`Fila ${excelRow}: no existe ninguna empresa con el CIF "${row.cif}".`);
      return [];
    }

    if (empresaMatches.length > 1) {
      errors.push(`Fila ${excelRow}: hay varias empresas con el CIF "${row.cif}". Revisa los datos antes de importar.`);
      return [];
    }

    if (alumnoMatches.length === 0) {
      errors.push(`Fila ${excelRow}: no existe ningun alumno con el NIA "${row.nia}".`);
      return [];
    }

    if (alumnoMatches.length > 1) {
      errors.push(`Fila ${excelRow}: hay varios alumnos con el NIA "${row.nia}". Revisa los datos antes de importar.`);
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

    if (!cursosValidosSet.has(parsed.data.curso)) {
      errors.push(`Fila ${excelRow}: El curso no es valido.`);
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
