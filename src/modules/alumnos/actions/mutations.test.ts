import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAlumno, deleteAlumno, updateAlumno } from "./mutations";

const { deleteAlumnoCvLoMock, prismaMock, txMock } = vi.hoisted(() => {
  const txMock = {
    alumno: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  };

  return {
    deleteAlumnoCvLoMock: vi.fn(),
    txMock,
    prismaMock: {
      cicloFormativo: {
        findFirst: vi.fn(),
      },
      alumno: {
        create: vi.fn(),
        update: vi.fn(),
      },
      $transaction: vi.fn(),
    },
  };
});

vi.mock("@/database/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("./cv", () => ({
  deleteAlumnoCvLo: deleteAlumnoCvLoMock,
}));

describe("alumnos mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (callback: (tx: typeof txMock) => unknown) =>
      callback(txMock)
    );
  });

  it("crea un alumno normalizando campos y email", async () => {
    prismaMock.cicloFormativo.findFirst.mockResolvedValue({ id: 4, nombre: "DAM" });
    prismaMock.alumno.create.mockResolvedValue({ id: 1, nombre: "Ana" });

    await createAlumno({
      nombre: "  Ana  ",
      nia: " A-1 ",
      nif: "12345678z",
      nuss: " 123456789012 ",
      telefono: " 612345678 ",
      email: " ANA@MAIL.COM ",
      cicloFormativoId: 4,
      cursoCiclo: 1,
      curso: " 2025-2026 ",
    });

    expect(prismaMock.alumno.create).toHaveBeenCalledWith({
      data: {
        nombre: "Ana",
        nia: "A-1",
        nif: "12345678Z",
        nuss: "123456789012",
        telefono: "612345678",
        email: "ana@mail.com",
        cicloFormativoId: 4,
        cursoCiclo: 1,
        curso: "2025-2026",
      },
    });
  });

  it("rechaza crear o actualizar si el ciclo formativo no existe o esta inactivo", async () => {
    prismaMock.cicloFormativo.findFirst.mockResolvedValue(null);

    await expect(
      createAlumno({
        nombre: "Ana",
        nia: "A-1",
        nif: "",
        nuss: "",
        telefono: "612345678",
        email: "ana@mail.com",
        cicloFormativoId: 99,
        cursoCiclo: 1,
        curso: "2025-2026",
      })
    ).rejects.toThrow("CICLO_FORMATIVO_INVALIDO");

    await expect(
      updateAlumno(3, {
        cicloFormativoId: 99,
      })
    ).rejects.toThrow("CICLO_FORMATIVO_INVALIDO");
  });

  it("actualiza solo los campos enviados y mantiene la normalizacion", async () => {
    prismaMock.cicloFormativo.findFirst.mockResolvedValue({ id: 8, nombre: "DAW" });
    prismaMock.alumno.update.mockResolvedValue({ id: 2 });

    await updateAlumno(2, {
      nombre: "  Luis  ",
      nif: "x1234567l",
      email: " LUIS@MAIL.COM ",
      cicloFormativoId: 8,
    });

    expect(prismaMock.alumno.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: {
        nombre: "Luis",
        nif: "X1234567L",
        email: "luis@mail.com",
        cicloFormativoId: 8,
      },
    });
  });

  it("elimina el CV asociado antes de borrar el alumno", async () => {
    txMock.alumno.findUnique.mockResolvedValue({ cvOid: 42 });
    txMock.alumno.delete.mockResolvedValue({ id: 5 });

    const result = await deleteAlumno(5);

    expect(deleteAlumnoCvLoMock).toHaveBeenCalledWith(txMock, 42);
    expect(txMock.alumno.delete).toHaveBeenCalledWith({ where: { id: 5 } });
    expect(result).toEqual({ id: 5 });
  });
});
