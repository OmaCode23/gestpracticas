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
        sectorId: 7,
        sectorRef: { id: 7, nombre: "Otro" },
        localidadId: 11,
        localidadRef: { id: 11, nombre: "Alacant/Alicante" },
        cicloFormativoId: 4,
        cicloFormativoRef: {
          id: 4,
          nombre: "Desarrollo de Aplicaciones Multiplataforma",
          codigo: "DAM",
        },
      },
    ]);
    prismaMock.empresa.count.mockResolvedValue(25);

    const result = await getEmpresas({ page: 2, all: false });

    expect(getResultadosPorPaginaConfiguradosMock).toHaveBeenCalled();
    expect(prismaMock.empresa.findMany).toHaveBeenCalledWith({
      where: {},
      include: {
        sectorRef: {
          select: {
            id: true,
            nombre: true,
          },
        },
        localidadRef: {
          select: {
            id: true,
            nombre: true,
          },
        },
        cicloFormativoRef: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
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
      sector: "Otro",
      sectorId: 7,
      sectorRef: { id: 7, nombre: "Otro" },
      localidad: "Alacant/Alicante",
      localidadId: 11,
      localidadRef: { id: 11, nombre: "Alacant/Alicante" },
      cicloFormativoId: 4,
      cicloFormativoRef: {
        id: 4,
        nombre: "Desarrollo de Aplicaciones Multiplataforma",
        codigo: "DAM",
      },
      cicloFormativo: "Desarrollo de Aplicaciones Multiplataforma",
      cicloFormativoCodigo: "DAM",
    });
  });

  it("filtra por catalogo relacionado en el modelo final", async () => {
    prismaMock.empresa.findMany.mockResolvedValue([]);
    prismaMock.empresa.count.mockResolvedValue(0);

    await getEmpresas({
      sector: "Otro",
      localidad: "Alacant/Alicante",
      search: "demo",
      page: 1,
      all: false,
    });

    expect(prismaMock.empresa.findMany).toHaveBeenCalledWith({
      where: {
        AND: [
          {
            sectorRef: {
              is: {
                nombre: "Otro",
              },
            },
          },
          {
            localidadRef: {
              is: {
                nombre: "Alacant/Alicante",
              },
            },
          },
          {
            OR: [
              {
                nombre: {
                  contains: "demo",
                  mode: "insensitive",
                },
              },
              {
                cif: {
                  contains: "demo",
                  mode: "insensitive",
                },
              },
            ],
          },
        ],
      },
      include: {
        sectorRef: {
          select: {
            id: true,
            nombre: true,
          },
        },
        localidadRef: {
          select: {
            id: true,
            nombre: true,
          },
        },
        cicloFormativoRef: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: 0,
      take: 12,
    });
  });

  it("omite paginacion cuando se solicita all=true", async () => {
    prismaMock.empresa.findMany.mockResolvedValue([]);
    prismaMock.empresa.count.mockResolvedValue(0);

    const result = await getEmpresas({ page: 1, all: true });

    expect(prismaMock.empresa.findMany).toHaveBeenCalledWith({
      where: {},
      include: {
        sectorRef: {
          select: {
            id: true,
            nombre: true,
          },
        },
        localidadRef: {
          select: {
            id: true,
            nombre: true,
          },
        },
        cicloFormativoRef: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    expect(result.perPage).toBe(0);
    expect(result.totalPages).toBe(0);
  });

  it("normaliza la lectura por id desde relaciones", async () => {
    prismaMock.empresa.findUnique.mockResolvedValue({
      id: 3,
      nombre: "Empresa Demo",
      sectorId: 7,
      sectorRef: { id: 7, nombre: "Otro" },
      localidadId: 11,
      localidadRef: { id: 11, nombre: "Alacant/Alicante" },
      cicloFormativoId: null,
      cicloFormativoRef: null,
    });

    const result = await getEmpresaById(3);

    expect(result).toEqual({
      id: 3,
      nombre: "Empresa Demo",
      sector: "Otro",
      sectorId: 7,
      sectorRef: { id: 7, nombre: "Otro" },
      localidad: "Alacant/Alicante",
      localidadId: 11,
      localidadRef: { id: 11, nombre: "Alacant/Alicante" },
      cicloFormativoId: null,
      cicloFormativoRef: null,
      cicloFormativo: null,
      cicloFormativoCodigo: null,
    });
  });

  it("normaliza nombres e ids derivados de relaciones", async () => {
    prismaMock.empresa.findUnique.mockResolvedValue({
      id: 9,
      nombre: "Empresa Antigua",
      sectorId: 5,
      sectorRef: { id: 5, nombre: "Tecnologia" },
      localidadId: 8,
      localidadRef: { id: 8, nombre: "Elx/Elche" },
      cicloFormativoId: null,
      cicloFormativoRef: null,
    });

    const result = await getEmpresaById(9);

    expect(result).toEqual({
      id: 9,
      nombre: "Empresa Antigua",
      sector: "Tecnologia",
      sectorId: 5,
      sectorRef: { id: 5, nombre: "Tecnologia" },
      localidad: "Elx/Elche",
      localidadId: 8,
      localidadRef: { id: 8, nombre: "Elx/Elche" },
      cicloFormativoId: null,
      cicloFormativoRef: null,
      cicloFormativo: null,
      cicloFormativoCodigo: null,
    });
  });
});
