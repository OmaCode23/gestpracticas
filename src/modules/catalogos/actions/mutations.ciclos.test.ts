import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createCicloFormativo,
  deleteCicloFormativo,
  restoreCiclosFormativosBase,
  updateCicloFormativo,
} from "./mutations";
import { CICLOS_FORMATIVOS_BASE } from "@/shared/catalogs/academico";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    cicloFormativo: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/database/prisma", () => ({
  prisma: prismaMock,
}));

describe("catalogos ciclo mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (operations: unknown[]) =>
      Promise.all(operations)
    );
  });

  it("crea un ciclo personalizado normalizando nombre y codigo", async () => {
    prismaMock.cicloFormativo.create.mockResolvedValue({ id: 1 });

    await createCicloFormativo({
      nombre: "  Ciclo propio  ",
      codigo: " cp-1 ",
    });

    expect(prismaMock.cicloFormativo.create).toHaveBeenCalledWith({
      data: {
        nombre: "Ciclo propio",
        codigo: "CP-1",
        activo: true,
      },
    });
  });

  it("rechaza crear un ciclo con codigo reservado si no coincide con el base canonico", async () => {
    await expect(
      createCicloFormativo({
        nombre: "Mi DAM personalizado",
        codigo: "dam",
      })
    ).rejects.toThrow("CICLO_FORMATIVO_CODIGO_RESERVADO");

    expect(prismaMock.cicloFormativo.create).not.toHaveBeenCalled();
  });

  it("impide editar un ciclo base", async () => {
    prismaMock.cicloFormativo.findUnique.mockResolvedValue({
      id: 4,
      nombre: "Desarrollo de Aplicaciones Multiplataforma",
      codigo: "DAM",
      _count: { alumnos: 0, empresas: 0 },
    });

    await expect(
      updateCicloFormativo(4, {
        nombre: "DAM Renombrado",
      })
    ).rejects.toThrow("CICLO_FORMATIVO_BASE_NO_EDITABLE");

    expect(prismaMock.cicloFormativo.update).not.toHaveBeenCalled();
  });

  it("impide que un ciclo personalizado cambie su codigo a uno reservado", async () => {
    prismaMock.cicloFormativo.findUnique.mockResolvedValue({
      id: 8,
      nombre: "Ciclo propio",
      codigo: "CP-1",
      _count: { alumnos: 0, empresas: 0 },
    });

    await expect(
      updateCicloFormativo(8, {
        codigo: "DAM",
      })
    ).rejects.toThrow("CICLO_FORMATIVO_CODIGO_RESERVADO");

    expect(prismaMock.cicloFormativo.update).not.toHaveBeenCalled();
  });

  it("impide editar un ciclo personalizado en uso", async () => {
    prismaMock.cicloFormativo.findUnique.mockResolvedValue({
      id: 9,
      nombre: "Ciclo propio",
      codigo: "CP-1",
      _count: { alumnos: 2, empresas: 1 },
    });

    await expect(
      updateCicloFormativo(9, {
        nombre: "Nuevo nombre",
      })
    ).rejects.toMatchObject({
      message: "CICLO_FORMATIVO_EN_USO",
      meta: { alumnosCount: 2, empresasCount: 1 },
    });
  });

  it("impide eliminar un ciclo base", async () => {
    prismaMock.cicloFormativo.findUnique.mockResolvedValue({
      id: 4,
      nombre: "Desarrollo de Aplicaciones Multiplataforma",
      codigo: "DAM",
      _count: { alumnos: 0, empresas: 0 },
    });

    await expect(deleteCicloFormativo(4)).rejects.toThrow("CICLO_FORMATIVO_BASE_NO_ELIMINABLE");

    expect(prismaMock.cicloFormativo.delete).not.toHaveBeenCalled();
  });

  it("restaura los ciclos base y elimina personalizados no usados", async () => {
    prismaMock.cicloFormativo.findMany.mockResolvedValue([
      {
        id: 1,
        nombre: "Desarrollo de Aplicaciones Multiplataforma",
        codigo: "DAM",
        activo: false,
        _count: { alumnos: 0, empresas: 0 },
      },
      {
        id: 2,
        nombre: "Ciclo propio",
        codigo: "CP-1",
        activo: true,
        _count: { alumnos: 0, empresas: 0 },
      },
      {
        id: 3,
        nombre: "Ciclo vivo",
        codigo: "CP-2",
        activo: true,
        _count: { alumnos: 1, empresas: 0 },
      },
    ]);
    prismaMock.cicloFormativo.deleteMany.mockResolvedValue({ count: 1 });
    prismaMock.cicloFormativo.upsert.mockImplementation(({ where }: { where: { codigo: string } }) => ({
      id: where.codigo.length,
      codigo: where.codigo,
      activo: true,
    }));

    const result = await restoreCiclosFormativosBase();

    expect(prismaMock.cicloFormativo.deleteMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: [2],
        },
      },
    });
    expect(prismaMock.cicloFormativo.upsert).toHaveBeenCalledTimes(CICLOS_FORMATIVOS_BASE.length);
    expect(result.total).toBe(CICLOS_FORMATIVOS_BASE.length);
    expect(result.deletedCustomCount).toBe(1);
  });

  it("bloquea la restauracion si existe un ciclo en uso con codigo base pero datos no canonicos", async () => {
    prismaMock.cicloFormativo.findMany.mockResolvedValue([
      {
        id: 7,
        nombre: "DAM Personalizado",
        codigo: "DAM",
        activo: true,
        _count: { alumnos: 1, empresas: 0 },
      },
    ]);

    await expect(restoreCiclosFormativosBase()).rejects.toMatchObject({
      message: "CICLO_FORMATIVO_BASE_CONFLICT",
      meta: {
        codigos: ["DAM"],
      },
    });

    expect(prismaMock.cicloFormativo.deleteMany).not.toHaveBeenCalled();
    expect(prismaMock.cicloFormativo.upsert).not.toHaveBeenCalled();
  });
});
