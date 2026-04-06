import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveConfiguracionAcademica } from "./mutations";
import { SETTING_KEYS } from "../constants";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    alumno: {
      findMany: vi.fn(),
    },
    formacionEmpresa: {
      findMany: vi.fn(),
    },
    setting: {
      upsert: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/database/prisma", () => ({
  prisma: prismaMock,
}));

describe("settings mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (operations: unknown[]) =>
      Promise.all(operations)
    );
    prismaMock.setting.upsert.mockImplementation(
      ({ where, update }: { where: { clave: string }; update: { valor: string } }) => ({
        clave: where.clave,
        valor: update.valor,
      })
    );
  });

  it("guarda la configuracion academica cuando todos los cursos actuales siguen siendo validos", async () => {
    prismaMock.alumno.findMany.mockResolvedValue([{ curso: "2025-2026" }]);
    prismaMock.formacionEmpresa.findMany.mockResolvedValue([{ curso: "2024-2025" }]);

    const result = await saveConfiguracionAcademica({
      mesCambioCurso: 9,
      numeroCursosVisibles: 3,
      resultadosPorPagina: 20,
    });

    expect(result).toEqual({
      mesCambioCurso: 9,
      numeroCursosVisibles: 3,
      resultadosPorPagina: 20,
    });
    expect(prismaMock.setting.upsert).toHaveBeenCalledTimes(3);
    expect(prismaMock.setting.upsert).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: { clave: SETTING_KEYS.academicoMesCambioCurso },
        update: { valor: "9" },
      })
    );
    expect(prismaMock.setting.upsert).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { clave: SETTING_KEYS.academicoNumeroCursosVisibles },
        update: { valor: "3" },
      })
    );
    expect(prismaMock.setting.upsert).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        where: { clave: SETTING_KEYS.listadosResultadosPorPagina },
        update: { valor: "20" },
      })
    );
  });

  it("bloquea el guardado si algun curso vigente quedaria fuera de configuracion", async () => {
    prismaMock.alumno.findMany.mockResolvedValue([{ curso: "2022-2023" }, { curso: "2025-2026" }]);
    prismaMock.formacionEmpresa.findMany.mockResolvedValue([{ curso: "2021-2022" }]);

    await expect(
      saveConfiguracionAcademica({
        mesCambioCurso: 9,
        numeroCursosVisibles: 2,
        resultadosPorPagina: 10,
      })
    ).rejects.toMatchObject({
      message:
        "No se puede guardar la configuración académica porque estos cursos dejarían de ser válidos: 2021-2022, 2022-2023.",
      code: "CURSOS_CONFIG_INVALIDA",
      cursosInvalidos: ["2021-2022", "2022-2023"],
    });

    expect(prismaMock.setting.upsert).not.toHaveBeenCalled();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});
