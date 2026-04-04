import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createEmpresa,
  createEmpresasBatch,
  updateEmpresa,
} from "./mutations";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    sector: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    localidad: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    cicloFormativo: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    empresa: {
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/database/prisma", () => ({
  prisma: prismaMock,
}));

describe("empresas mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("crea una empresa resolviendo sectorId y localidadId desde catalogos activos", async () => {
    prismaMock.sector.findFirst.mockResolvedValue({ id: 7 });
    prismaMock.localidad.findFirst.mockResolvedValue({ id: 11 });
    prismaMock.cicloFormativo.findFirst.mockResolvedValue({ id: 4 });
    prismaMock.empresa.create.mockResolvedValue({ id: 1, nombre: "Empresa Demo" });

    await createEmpresa({
      nombre: "Empresa Demo",
      cif: "b12345678",
      direccion: "",
      localidad: "Alacant/Alicante",
      sector: "Otro",
      cicloFormativoId: 4,
      telefono: "600000000",
      email: "INFO@EMPRESA.COM",
      contacto: "Ana Perez",
      emailContacto: "ANA@EMPRESA.COM",
    });

    expect(prismaMock.empresa.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        nombre: "Empresa Demo",
        cif: "B12345678",
        sectorId: 7,
        localidadId: 11,
        cicloFormativoId: 4,
        email: "info@empresa.com",
        emailContacto: "ana@empresa.com",
      }),
    });
  });

  it("lanza error si el sector no existe o esta inactivo", async () => {
    prismaMock.sector.findFirst.mockResolvedValue(null);
    prismaMock.localidad.findFirst.mockResolvedValue({ id: 11 });

    await expect(
      createEmpresa({
        nombre: "Empresa Demo",
        cif: "B12345678",
        direccion: "",
        localidad: "Alacant/Alicante",
        sector: "Sector Inventado",
        cicloFormativoId: null,
        telefono: "",
        email: "",
        contacto: "",
        emailContacto: "",
      })
    ).rejects.toThrow("SECTOR_INVALIDO");
  });

  it("actualiza ids de catalogo solo cuando llegan los campos correspondientes", async () => {
    prismaMock.sector.findFirst.mockResolvedValue({ id: 8 });
    prismaMock.localidad.findFirst.mockResolvedValue({ id: 12 });
    prismaMock.empresa.update.mockResolvedValue({ id: 3, nombre: "Empresa Demo" });

    await updateEmpresa(3, {
      sector: "Tecnologia",
      localidad: "Elx/Elche",
    });

    expect(prismaMock.empresa.update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: {
        localidadId: 12,
        sectorId: 8,
      },
    });
  });

  it("resuelve ids de catalogo tambien en la importacion masiva", async () => {
    prismaMock.sector.findMany.mockResolvedValue([{ id: 7, nombre: "Otro" }]);
    prismaMock.localidad.findMany.mockResolvedValue([
      { id: 11, nombre: "Alacant/Alicante" },
    ]);
    prismaMock.cicloFormativo.findMany.mockResolvedValue([{ id: 4 }]);
    prismaMock.empresa.createMany.mockResolvedValue({ count: 1 });

    await createEmpresasBatch([
      {
        nombre: "Empresa Demo",
        cif: "B12345678",
        direccion: "",
        localidad: "Alacant/Alicante",
        sector: "Otro",
        cicloFormativoId: 4,
        telefono: "",
        email: "",
        contacto: "",
        emailContacto: "",
      },
    ]);

    expect(prismaMock.empresa.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          sectorId: 7,
          localidadId: 11,
          cicloFormativoId: 4,
        }),
      ],
    });
  });
});
