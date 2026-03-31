import { Prisma } from "@prisma/client";
import { prisma } from "@/database/prisma";
import { getCursosAcademicos } from "@/shared/catalogs/academico";
import { SETTING_DEFAULTS, SETTING_KEYS } from "../constants";

function parsePositiveInteger(
  value: string | null | undefined,
  fallback: number
) {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function getSettingsMap(claves: string[]) {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        clave: { in: claves },
      },
      select: {
        clave: true,
        valor: true,
      },
    });

    return new Map(settings.map((setting) => [setting.clave, setting.valor]));
  } catch (error) {
    // Mientras el equipo termina de aplicar la migracion de settings en cada entorno,
    // devolvemos defaults en lectura para no romper la app al arrancar.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2021"
    ) {
      return new Map<string, string>();
    }

    throw error;
  }
}

export async function getConfiguracionAcademica() {
  const settings = await getSettingsMap([
    SETTING_KEYS.academicoMesCambioCurso,
    SETTING_KEYS.academicoNumeroCursosVisibles,
  ]);

  return {
    mesCambioCurso: parsePositiveInteger(
      settings.get(SETTING_KEYS.academicoMesCambioCurso),
      SETTING_DEFAULTS.academicoMesCambioCurso
    ),
    numeroCursosVisibles: parsePositiveInteger(
      settings.get(SETTING_KEYS.academicoNumeroCursosVisibles),
      SETTING_DEFAULTS.academicoNumeroCursosVisibles
    ),
  };
}

export async function getCursosAcademicosConfigurados(date = new Date()) {
  const configuracion = await getConfiguracionAcademica();

  return getCursosAcademicos(
    configuracion.numeroCursosVisibles,
    date,
    configuracion.mesCambioCurso
  );
}
