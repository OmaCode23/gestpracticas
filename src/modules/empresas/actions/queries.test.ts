import { beforeEach, describe, expect, it, vi } from "vitest";
import { getEmpresaById, getEmpresas } from "./queries";

const { prismaMock, getResultadosPorPaginaConfiguradosMock } = vi.hoisted(() => ({
  prismaMock: {
    empresa: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
  },
  getResultadosPorPaginaConfiguradosMock: vi.fn(),
}));

vi.mock("@/database/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/modules/settings/actions/queries", () => ({
  getResultadosPorPaginaConfigurados: getResultadosPorPaginaConfiguradosMock,
}));

describe("empresas queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getResultadosPorPaginaConfiguradosMock.mockResolvedValue(12);
  });

  it("usa la paginacion configurada cuando no llega limit", async () => {
    prismaMock.empresa.findMany.mockResolvedValue([
      {
        id: 1,
        nombre: "Empresa Demo",
        cicloFormativoId: 4,
        cicloFormativoRef: { id: 4, nombre: "DAM" },
      },
    ]);
    prismaMock.empresa.count.mockResolvedValue(25);

    const result = await getEmpresas({ page: 2, all: false });

    expect(getResultadosPorPaginaConfiguradosMock).toHaveBeenCalled();
    expect(prismaMock.empresa.findMany).toHaveBeenCalledWith({
      where: {},
      include: {
        cicloFormativoRef: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: 12,
      take: 12,
    });
    expect(result.page).toBe(2);
    expect(result.perPage).toBe(12);
    expect(result.totalPages).toBe(3);
    expect(result.items[0]).toEqual({
      id: 1,
      nombre: "Empresa Demo",
      cicloFormativoId: 4,
      cicloFormativoRef: { id: 4, nombre: "DAM" },
      cicloFormativo: "DAM",
    });
  });

  it("omite paginacion cuando se solicita all=true", async () => {
    prismaMock.empresa.findMany.mockResolvedValue([]);
    prismaMock.empresa.count.mockResolvedValue(0);

    const result = await getEmpresas({ all: true });

    expect(prismaMock.empresa.findMany).toHaveBeenCalledWith({
      where: {},
      include: {
        cicloFormativoRef: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    expect(result.perPage).toBe(0);
    expect(result.totalPages).toBe(0);
  });

  it("normaliza la lectura por id", async () => {
    prismaMock.empresa.findUnique.mockResolvedValue({
      id: 3,
      nombre: "Empresa Demo",
      cicloFormativoId: null,
      cicloFormativoRef: null,
    });

    const result = await getEmpresaById(3);

    expect(result).toEqual({
      id: 3,
      nombre: "Empresa Demo",
      cicloFormativoId: null,
      cicloFormativoRef: null,
      cicloFormativo: null,
    });
  });
});
