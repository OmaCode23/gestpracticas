import type { BadgeVariant } from "@/components/ui";

export const DEFAULT_MES_CAMBIO_CURSO = 9;
export const DEFAULT_NUMERO_CURSOS_VISIBLES = 3;
export const DEFAULT_RESULTADOS_POR_PAGINA = 10;

function normalizeMesCambioCurso(mesCambioCurso = DEFAULT_MES_CAMBIO_CURSO) {
  return Math.min(Math.max(Math.trunc(mesCambioCurso), 1), 12);
}

function normalizeNumeroCursosVisibles(
  total = DEFAULT_NUMERO_CURSOS_VISIBLES
) {
  return Math.min(Math.max(Math.trunc(total), 1), 10);
}

function getCursoBaseFromDate(
  date = new Date(),
  mesCambioCurso = DEFAULT_MES_CAMBIO_CURSO
) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const mesNormalizado = normalizeMesCambioCurso(mesCambioCurso);

  return month >= mesNormalizado ? year : year - 1;
}

function formatCursoAcademico(startYear: number) {
  return `${startYear}-${startYear + 1}`;
}

export function getCursoActual(
  date = new Date(),
  mesCambioCurso = DEFAULT_MES_CAMBIO_CURSO
) {
  return formatCursoAcademico(getCursoBaseFromDate(date, mesCambioCurso));
}

export function getCursosAcademicos(
  total = DEFAULT_NUMERO_CURSOS_VISIBLES,
  date = new Date(),
  mesCambioCurso = DEFAULT_MES_CAMBIO_CURSO
) {
  const cursoBase = getCursoBaseFromDate(date, mesCambioCurso);
  const totalNormalizado = normalizeNumeroCursosVisibles(total);

  return Array.from({ length: totalNormalizado }, (_, index) =>
    formatCursoAcademico(cursoBase - index)
  );
}

export const CURSOS = getCursosAcademicos();

export type CicloFormativoBase = {
  nombre: string;
  codigo: string;
};

export const CICLOS_FORMATIVOS_BASE: CicloFormativoBase[] = [
  { nombre: "Gestión Administrativa", codigo: "GA" },
  { nombre: "Administración y Finanzas", codigo: "AF" },
  { nombre: "Sistemas Microinformáticos y Redes", codigo: "SMR" },
  { nombre: "Desarrollo de Aplicaciones Multiplataforma", codigo: "DAM" },
  {
    nombre: "Desarrollo de Aplicaciones Multiplataforma (Semipresencial)",
    codigo: "DAM-SEMI",
  },
  { nombre: "Administración de Sistemas Informáticos en Red", codigo: "ASIR" },
  { nombre: "Desarrollo de Aplicaciones Web", codigo: "DAW" },
  { nombre: "Actividades Comerciales", codigo: "AC" },
  { nombre: "Comercio Internacional", codigo: "CI" },
  { nombre: "Comercio Internacional (Semipresencial)", codigo: "CI-SEMI" },
  { nombre: "Logística y Transporte", codigo: "LT" },
];

export const CICLOS_FORMATIVOS = CICLOS_FORMATIVOS_BASE.map(
  (ciclo) => ciclo.nombre
);

export const CICLO_LABEL: Record<string, string> = {
  ...Object.fromEntries(
    CICLOS_FORMATIVOS_BASE.flatMap(({ nombre, codigo }) => [
      [codigo, codigo],
      [nombre, codigo],
    ])
  ),
  "Gestion Administrativa": "GA",
  "Administracion y Finanzas": "AF",
  "Sistemas Microinformaticos y Redes": "SMR",
  "Administracion de Sistemas Informaticos en Red": "ASIR",
  "Logistica y Transporte": "LT",
  "Desarrollo de Aplicaciones Multiplataforma Semi": "DAM-SEMI",
  "Comercio Internacional Semi": "CI-SEMI",
};

export function getCicloLabel(value?: string | null) {
  if (!value) return "-";
  return CICLO_LABEL[value] ?? value;
}

export const CICLO_BADGE: Record<string, BadgeVariant> = {
  GA: "blue",
  AF: "green",
  SMR: "purple",
  DAM: "indigo",
  "DAM-SEMI": "pink",
  ASIR: "teal",
  DAW: "amber",
  AC: "orange",
  CI: "red",
  "CI-SEMI": "purple",
  LT: "gray",
};
