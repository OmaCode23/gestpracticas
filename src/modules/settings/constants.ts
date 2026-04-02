import {
  DEFAULT_MES_CAMBIO_CURSO,
  DEFAULT_RESULTADOS_POR_PAGINA,
  DEFAULT_NUMERO_CURSOS_VISIBLES,
} from "@/shared/catalogs/academico";

export const SETTING_KEYS = {
  academicoMesCambioCurso: "academico.mesCambioCurso",
  academicoNumeroCursosVisibles: "academico.numeroCursosVisibles",
  listadosResultadosPorPagina: "listados.resultadosPorPagina",
} as const;

export const SETTING_DEFAULTS = {
  academicoMesCambioCurso: DEFAULT_MES_CAMBIO_CURSO,
  academicoNumeroCursosVisibles: DEFAULT_NUMERO_CURSOS_VISIBLES,
  listadosResultadosPorPagina: DEFAULT_RESULTADOS_POR_PAGINA,
} as const;
