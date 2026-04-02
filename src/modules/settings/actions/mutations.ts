import { prisma } from "@/database/prisma";
import type { ConfiguracionAcademicaInput } from "../types/schema";
import { SETTING_KEYS } from "../constants";
import { getCursosAcademicos } from "@/shared/catalogs/academico";

function buildInvalidCursosError(cursosInvalidos: string[]) {
  const error = new Error(
    `No se puede guardar la configuración académica porque estos cursos dejarían de ser válidos: ${cursosInvalidos.join(", ")}.`
  );
  (error as Error & { code?: string; cursosInvalidos?: string[] }).code =
    "CURSOS_CONFIG_INVALIDA";
  (error as Error & { code?: string; cursosInvalidos?: string[] }).cursosInvalidos =
    cursosInvalidos;
  return error;
}

export async function saveConfiguracionAcademica(
  input: ConfiguracionAcademicaInput
) {
  const cursosValidos = new Set(
    getCursosAcademicos(input.numeroCursosVisibles, new Date(), input.mesCambioCurso)
  );

  const [cursosAlumno, cursosFormacion] = await Promise.all([
    prisma.alumno.findMany({
      select: { curso: true },
      distinct: ["curso"],
    }),
    prisma.formacionEmpresa.findMany({
      select: { curso: true },
      distinct: ["curso"],
    }),
  ]);

  const cursosActuales = [
    ...cursosAlumno.map(({ curso }) => curso),
    ...cursosFormacion.map(({ curso }) => curso),
  ];

  const cursosInvalidos = Array.from(
    new Set(cursosActuales.filter((curso) => !cursosValidos.has(curso)))
  ).sort();

  if (cursosInvalidos.length > 0) {
    throw buildInvalidCursosError(cursosInvalidos);
  }

  await prisma.$transaction([
    prisma.setting.upsert({
      where: { clave: SETTING_KEYS.academicoMesCambioCurso },
      update: { valor: String(input.mesCambioCurso) },
      create: {
        clave: SETTING_KEYS.academicoMesCambioCurso,
        valor: String(input.mesCambioCurso),
      },
    }),
    prisma.setting.upsert({
      where: { clave: SETTING_KEYS.academicoNumeroCursosVisibles },
      update: { valor: String(input.numeroCursosVisibles) },
      create: {
        clave: SETTING_KEYS.academicoNumeroCursosVisibles,
        valor: String(input.numeroCursosVisibles),
      },
    }),
    prisma.setting.upsert({
      where: { clave: SETTING_KEYS.listadosResultadosPorPagina },
      update: { valor: String(input.resultadosPorPagina) },
      create: {
        clave: SETTING_KEYS.listadosResultadosPorPagina,
        valor: String(input.resultadosPorPagina),
      },
    }),
  ]);

  return input;
}
