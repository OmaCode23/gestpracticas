import {
  DEFAULT_MES_CAMBIO_CURSO,
  DEFAULT_NUMERO_CURSOS_VISIBLES,
} from "@/shared/catalogs/academico";

export const SETTING_KEYS = {
  academicoMesCambioCurso: "academico.mesCambioCurso",
  academicoNumeroCursosVisibles: "academico.numeroCursosVisibles",
} as const;

export const SETTING_DEFAULTS = {
  academicoMesCambioCurso: DEFAULT_MES_CAMBIO_CURSO,
  academicoNumeroCursosVisibles: DEFAULT_NUMERO_CURSOS_VISIBLES,
} as const;
