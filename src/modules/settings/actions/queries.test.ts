import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getConfiguracionAcademica,
  getCursosAcademicosConfigurados,
  getResultadosPorPaginaConfigurados,
  getSettingsMap,
} from "./queries";

const { prismaMock, prismaNamespaceMock } = vi.hoisted(() => ({
  prismaMock: {
    setting: {
      findMany: vi.fn(),
    },
  },
  prismaNamespaceMock: {
    PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
      code: string;

      constructor(message: string, code: string) {
        super(message);
        this.code = code;
      }
    },
  },
}));

vi.mock("@/database/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@prisma/client", () => ({
  Prisma: prismaNamespaceMock,
}));

describe("settings queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve un mapa clave-valor con los settings existentes", async () => {
    prismaMock.setting.findMany.mockResolvedValue([
      { clave: "academico.mesCambioCurso", valor: "8" },
      { clave: "listados.resultadosPorPagina", valor: "25" },
    ]);

    const result = await getSettingsMap([
      "academico.mesCambioCurso",
      "listados.resultadosPorPagina",
    ]);

    expect(Array.from(result.entries())).toEqual([
      ["academico.mesCambioCurso", "8"],
      ["listados.resultadosPorPagina", "25"],
    ]);
  });

  it("usa defaults si la tabla settings todavia no existe", async () => {
    prismaMock.setting.findMany.mockRejectedValue(
      new prismaNamespaceMock.PrismaClientKnownRequestError("tabla ausente", "P2021")
    );

    const result = await getConfiguracionAcademica();

    expect(result).toEqual({
      mesCambioCurso: 9,
      numeroCursosVisibles: 3,
      resultadosPorPagina: 10,
    });
  });

  it("normaliza enteros invalidos usando fallback y calcula cursos configurados", async () => {
    prismaMock.setting.findMany.mockResolvedValue([
      { clave: "academico.mesCambioCurso", valor: "7" },
      { clave: "academico.numeroCursosVisibles", valor: "0" },
      { clave: "listados.resultadosPorPagina", valor: "25" },
    ]);

    const configuracion = await getConfiguracionAcademica();
    const cursos = await getCursosAcademicosConfigurados(new Date("2026-08-15T00:00:00.000Z"));
    const perPage = await getResultadosPorPaginaConfigurados();

    expect(configuracion).toEqual({
      mesCambioCurso: 7,
      numeroCursosVisibles: 3,
      resultadosPorPagina: 25,
    });
    expect(cursos).toEqual(["2026-2027", "2025-2026", "2024-2025"]);
    expect(perPage).toBe(25);
  });
});
