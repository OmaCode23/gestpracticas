import {
  DEFAULT_MES_CAMBIO_CURSO,
  DEFAULT_RESULTADOS_POR_PAGINA,
  DEFAULT_NUMERO_CURSOS_VISIBLES,
} from "@/shared/catalogs/academico";

export const SETTING_KEYS = {
  academicoMesCambioCurso: "academico.mesCambioCurso",
  academicoNumeroCursosVisibles: "academico.numeroCursosVisibles",
  academicoModoHistorico: "academico.modoHistorico",
  listadosResultadosPorPagina: "listados.resultadosPorPagina",
  emailDominiosExtraAlumnos: "email.dominiosExtraAlumnos",
  emailDominiosExtraProfesores: "email.dominiosExtraProfesores",
} as const;

export const SETTING_DEFAULTS = {
  academicoMesCambioCurso: DEFAULT_MES_CAMBIO_CURSO,
  academicoNumeroCursosVisibles: DEFAULT_NUMERO_CURSOS_VISIBLES,
  academicoModoHistorico: false,
  listadosResultadosPorPagina: DEFAULT_RESULTADOS_POR_PAGINA,
} as const;

// Dominios base siempre permitidos (no editables, no almacenados en BD)
export const EMAIL_DOMAIN_DEFAULTS = {
  alumnos: ["alu.edu.gva.es"],
  profesores: ["edu.gva.es"],
} as const;
