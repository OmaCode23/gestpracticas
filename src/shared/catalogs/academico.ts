import type { BadgeVariant } from "@/components/ui";

function getCursoBaseFromDate(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();

  // Si queréis anticipar el curso nuevo en agosto, el corte va en month >= 7.
  return month >= 8 ? year : year - 1;
}

function formatCursoAcademico(startYear: number) {
  return `${startYear}-${startYear + 1}`;
}

export function getCursoActual(date = new Date()) {
  return formatCursoAcademico(getCursoBaseFromDate(date));
}

export function getCursosAcademicos(total = 3, date = new Date()) {
  const cursoBase = getCursoBaseFromDate(date);

  return Array.from({ length: total }, (_, index) =>
    formatCursoAcademico(cursoBase - index)
  );
}

export const CICLOS = ["DAM", "DAW", "ASIR", "SMR", "ADG", "CAE", "IEA", "TH"];

export const CURSOS = getCursosAcademicos(3);

export const CICLOS_FORMATIVOS = [
  "Gestión Administrativa",
  "Administración y Finanzas",
  "Sistemas Microinformáticos y Redes",
  "Desarrollo de Aplicaciones Multiplataforma",
  "Desarrollo de Aplicaciones Multiplataforma (Semipresencial)",
  "Administración de Sistemas Informáticos en Red",
  "Desarrollo de Aplicaciones Web",
  "Actividades Comerciales",
  "Comercio Internacional",
  "Comercio Internacional (Semipresencial)",
  "Logística y Transporte",
];

export const CICLO_LABEL: Record<string, string> = {
  GA: "GA",
  AF: "AF",
  SMR: "SMR",
  DAM: "DAM",
  "DAM-SEMI": "DAM-SEMI",
  ASIR: "ASIR",
  DAW: "DAW",
  AC: "AC",
  CI: "CI",
  "CI-SEMI": "CI-SEMI",
  LT: "LT",
  "Gestión Administrativa": "GA",
  "Administración y Finanzas": "AF",
  "Sistemas Microinformáticos y Redes": "SMR",
  "Desarrollo de Aplicaciones Multiplataforma": "DAM",
  "Desarrollo de Aplicaciones Multiplataforma (Semipresencial)": "DAM-SEMI",
  "Administración de Sistemas Informáticos en Red": "ASIR",
  "Desarrollo de Aplicaciones Web": "DAW",
  "Actividades Comerciales": "AC",
  "Comercio Internacional": "CI",
  "Comercio Internacional (Semipresencial)": "CI-SEMI",
  "Logística y Transporte": "LT",
  "Gestion Administrativa": "GA",
  "Administracion y Finanzas": "AF",
  "Sistemas Microinformaticos y Redes": "SMR",
  "Administracion de Sistemas Informaticos en Red": "ASIR",
  "Logistica y Transporte": "LT",
  "Desarrollo de Aplicaciones Multiplataforma Semi": "DAM-SEMI",
  "Comercio Internacional Semi": "CI-SEMI",
};

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
