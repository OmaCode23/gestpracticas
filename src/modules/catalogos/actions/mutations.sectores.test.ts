import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSector,
  deleteSector,
  restoreSectoresBase,
  updateSector,
} from "./mutations";
import { SECTORES } from "@/shared/catalogs/empresa";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    sector: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/database/prisma", () => ({
  prisma: prismaMock,
}));

describe("catalogos sector mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (operations: unknown[]) => operations);
  });

  it("crea un sector normalizando el nombre", async () => {
    prismaMock.sector.create.mockResolvedValue({ id: 1, nombre: "Tecnologia" });

    await createSector({
      nombre: "  Tecnologia  ",
    });

    expect(prismaMock.sector.create).toHaveBeenCalledWith({
      data: {
        nombre: "Tecnologia",
        activo: true,
      },
    });
  });

  it("actualiza nombre y estado del sector", async () => {
    prismaMock.sector.findUnique.mockResolvedValue({
      _count: { empresas: 0 },
    });
    prismaMock.sector.update.mockResolvedValue({ id: 2, nombre: "Industria" });

    await updateSector(2, {
      nombre: "  Industria  ",
      activo: false,
    });

    expect(prismaMock.sector.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: {
        nombre: "Industria",
        activo: false,
      },
    });
  });

  it("impide editar el nombre de un sector que ya esta en uso por empresas", async () => {
    prismaMock.sector.findUnique.mockResolvedValue({
      _count: { empresas: 2 },
    });

    await expect(
      updateSector(2, {
        nombre: "Industria",
      })
    ).rejects.toMatchObject({
      message: "SECTOR_EN_USO",
      meta: { empresasCount: 2 },
    });

    expect(prismaMock.sector.update).not.toHaveBeenCalled();
  });

  it("impide eliminar un sector que ya esta en uso por empresas", async () => {
    prismaMock.sector.findUnique.mockResolvedValue({
      _count: { empresas: 3 },
    });

    await expect(deleteSector(7)).rejects.toMatchObject({
      message: "SECTOR_EN_USO",
      meta: { empresasCount: 3 },
    });

    expect(prismaMock.sector.delete).not.toHaveBeenCalled();
  });

  it("restaura los sectores base reactivando o creando los que falten", async () => {
    prismaMock.sector.upsert.mockImplementation(({ where }: { where: { nombre: string } }) => ({
      id: where.nombre.length,
      nombre: where.nombre,
      activo: true,
    }));

    const result = await restoreSectoresBase();

    expect(prismaMock.sector.upsert).toHaveBeenCalledTimes(SECTORES.length);
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(result.total).toBe(SECTORES.length);
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        nombre: SECTORES[0],
        activo: true,
      })
    );
  });
});
