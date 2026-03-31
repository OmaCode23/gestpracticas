import { prisma } from "@/database/prisma";
import type { ConfiguracionAcademicaInput } from "../types/schema";
import { SETTING_KEYS } from "../constants";

export async function saveConfiguracionAcademica(
  input: ConfiguracionAcademicaInput
) {
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
  ]);

  return input;
}
