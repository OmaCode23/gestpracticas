import { beforeEach, describe, expect, it, vi } from "vitest";
import { getFormacionById, getFormacionesPaginated } from "./queries";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    formacionEmpresa: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock("@/database/prisma", () => ({
  prisma: prismaMock,
}));

describe("formacion queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normaliza sector y localidad de empresa desde relaciones cuando existen", async () => {
    prismaMock.formacionEmpresa.findMany.mockResolvedValue([
      {
        id: 1,
        curso: "2025-2026",
        empresa: {
          id: 10,
          nombre: "Empresa Demo",
          sectorId: 3,
          sectorRef: { nombre: "Otro" },
          localidadId: 4,
          localidadRef: { nombre: "Alacant/Alicante" },
          cicloFormativoId: null,
          cicloFormativoRef: null,
        },
        alumno: null,
      },
    ]);
    prismaMock.formacionEmpresa.count.mockResolvedValue(1);

    const result = await getFormacionesPaginated({ page: 1, perPage: 10 });

    expect(result.items[0].empresa).toEqual({
      id: 10,
      nombre: "Empresa Demo",
      sector: "Otro",
      sectorId: 3,
      sectorRef: { nombre: "Otro" },
      localidad: "Alacant/Alicante",
      localidadId: 4,
      localidadRef: { nombre: "Alacant/Alicante" },
      cicloFormativoId: null,
      cicloFormativoRef: null,
      cicloFormativo: null,
    });
  });

  it("normaliza la empresa desde relaciones en la lectura por id", async () => {
    prismaMock.formacionEmpresa.findUnique.mockResolvedValue({
      id: 2,
      curso: "2025-2026",
      empresa: {
        id: 11,
        nombre: "Empresa Demo",
        sectorId: 5,
        sectorRef: { nombre: "Tecnologia" },
        localidadId: 8,
        localidadRef: { nombre: "Elx/Elche" },
        cicloFormativoId: null,
        cicloFormativoRef: null,
      },
      alumno: null,
    });

    const result = await getFormacionById(2);

    expect(result?.empresa).toEqual({
      id: 11,
      nombre: "Empresa Demo",
      sector: "Tecnologia",
      sectorId: 5,
      sectorRef: { nombre: "Tecnologia" },
      localidad: "Elx/Elche",
      localidadId: 8,
      localidadRef: { nombre: "Elx/Elche" },
      cicloFormativoId: null,
      cicloFormativoRef: null,
      cicloFormativo: null,
    });
  });
});
