import { beforeEach, describe, expect, it, vi } from "vitest";
import { EmailDomainNotAllowedError } from "@/shared/identity/academic-email";
import { createAlumno, deleteAlumno, updateAlumno } from "./mutations";

const { deleteAlumnoCvLoMock, prismaMock, txMock } = vi.hoisted(() => {
  const txMock = {
    alumno: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    usuario: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    localAuthAccount: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
  };

  return {
    deleteAlumnoCvLoMock: vi.fn(),
    txMock,
    prismaMock: {
      cicloFormativo: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
      },
      alumno: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      $transaction: vi.fn(),
    },
  };
});

const { assertAcademicEmailAvailableMock, assertAcademicEmailDomainMock } = vi.hoisted(() => ({
  assertAcademicEmailAvailableMock: vi.fn(),
  assertAcademicEmailDomainMock: vi.fn(),
}));

const { syncAcademicUserIdentityMock } = vi.hoisted(() => ({
  syncAcademicUserIdentityMock: vi.fn(),
}));

const { syncAcademicUserRemovalMock } = vi.hoisted(() => ({
  syncAcademicUserRemovalMock: vi.fn(),
}));

vi.mock("@/database/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("./cv", () => ({
  deleteAlumnoCvLo: deleteAlumnoCvLoMock,
}));

vi.mock("@/shared/identity/academic-email", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/identity/academic-email")>();
  return {
    ...actual,
    assertAcademicEmailAvailable: assertAcademicEmailAvailableMock,
    assertAcademicEmailDomain: assertAcademicEmailDomainMock,
  };
});

vi.mock("@/shared/identity/academic-user", () => ({
  syncAcademicUserIdentity: syncAcademicUserIdentityMock,
  syncAcademicUserRemoval: syncAcademicUserRemovalMock,
}));

describe("alumnos mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assertAcademicEmailDomainMock.mockResolvedValue(undefined);
    assertAcademicEmailAvailableMock.mockImplementation(async ({ email }: { email: string }) =>
      email.trim().toLowerCase()
    );
    syncAcademicUserIdentityMock.mockResolvedValue(undefined);
    syncAcademicUserRemovalMock.mockResolvedValue(undefined);
    prismaMock.$transaction.mockImplementation(async (callback: (tx: typeof txMock) => unknown) =>
      callback(txMock)
    );
  });

  it("crea un alumno normalizando campos y email", async () => {
    prismaMock.cicloFormativo.findFirst.mockResolvedValue({ id: 4, nombre: "DAM" });
    txMock.alumno.create.mockResolvedValue({
      id: 1,
      nombre: "Ana",
      email: "ana@mail.com",
    });

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

    expect(txMock.alumno.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        nombre: "Ana",
        nia: "A-1",
        nif: "12345678Z",
        nuss: "123456789012",
        telefono: "612345678",
        email: "ana@mail.com",
        cicloFormativoId: 4,
        cursoCiclo: 1,
        curso: "2025-2026",
      }),
    });
    expect(txMock.alumno.create.mock.calls[0][0].data).toEqual({
      nombre: "Ana",
      nia: "A-1",
      nif: "12345678Z",
      nuss: "123456789012",
      telefono: "612345678",
      email: "ana@mail.com",
      cicloFormativoId: 4,
      cursoCiclo: 1,
      curso: "2025-2026",
    });
    expect(assertAcademicEmailAvailableMock).toHaveBeenCalledWith({
      email: " ANA@MAIL.COM ",
      entity: "ALUMNO",
    });
    expect(syncAcademicUserIdentityMock).toHaveBeenCalledWith(txMock, {
      entity: "ALUMNO",
      nombre: "Ana",
      email: "ana@mail.com",
    });
  });

  it("rechaza crear o actualizar si el ciclo formativo no existe o esta inactivo", async () => {
    prismaMock.cicloFormativo.findFirst.mockResolvedValue(null);
    prismaMock.alumno.findUnique.mockResolvedValue({ cicloFormativoId: 1 });

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

  it("permite actualizar manteniendo el ciclo actual aunque ya este inactivo", async () => {
    prismaMock.alumno.findUnique.mockResolvedValue({ cicloFormativoId: 8 });
    prismaMock.cicloFormativo.findUnique.mockResolvedValue({ id: 8, nombre: "DAW" });
    txMock.alumno.findUnique.mockResolvedValue({ email: "luis.old@mail.com" });
    txMock.alumno.update.mockResolvedValue({
      id: 2,
      nombre: "Luis",
      email: "luis.old@mail.com",
    });

    await updateAlumno(2, {
      nombre: "  Luis  ",
      cicloFormativoId: 8,
    });

    expect(prismaMock.cicloFormativo.findUnique).toHaveBeenCalledWith({
      where: { id: 8 },
      select: {
        id: true,
        nombre: true,
      },
    });
    expect(prismaMock.cicloFormativo.findFirst).not.toHaveBeenCalled();
    expect(txMock.alumno.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: {
        nombre: "Luis",
        cicloFormativoId: 8,
      },
    });
    expect(syncAcademicUserIdentityMock).toHaveBeenCalledWith(txMock, {
      entity: "ALUMNO",
      nombre: "Luis",
      email: "luis.old@mail.com",
      previousEmail: "luis.old@mail.com",
    });
  });

  it("actualiza solo los campos enviados y mantiene la normalizacion", async () => {
    prismaMock.alumno.findUnique.mockResolvedValue({ cicloFormativoId: 4 });
    prismaMock.cicloFormativo.findFirst.mockResolvedValue({ id: 8, nombre: "DAW" });
    txMock.alumno.findUnique.mockResolvedValue({ email: "old@mail.com" });
    txMock.alumno.update.mockResolvedValue({
      id: 2,
      nombre: "Luis",
      email: "luis@mail.com",
    });

    await updateAlumno(2, {
      nombre: "  Luis  ",
      nif: "x1234567l",
      email: " LUIS@MAIL.COM ",
      cicloFormativoId: 8,
    });

    expect(txMock.alumno.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: {
        nombre: "Luis",
        nif: "X1234567L",
        email: "luis@mail.com",
        cicloFormativoId: 8,
      },
    });
    expect(assertAcademicEmailAvailableMock).toHaveBeenCalledWith({
      email: " LUIS@MAIL.COM ",
      entity: "ALUMNO",
      excludeId: 2,
    });
    expect(syncAcademicUserIdentityMock).toHaveBeenCalledWith(txMock, {
      entity: "ALUMNO",
      nombre: "Luis",
      email: "luis@mail.com",
      previousEmail: "old@mail.com",
    });
  });

  it("rechaza crear si el dominio del email no esta permitido para alumnos", async () => {
    prismaMock.cicloFormativo.findFirst.mockResolvedValue({ id: 4, nombre: "DAM" });
    assertAcademicEmailDomainMock.mockRejectedValue(new EmailDomainNotAllowedError("ALUMNO"));

    await expect(
      createAlumno({
        nombre: "Ana",
        nia: "A-1",
        nif: "",
        nuss: "",
        telefono: "612345678",
        email: "ana@gmail.com",
        cicloFormativoId: 4,
        cursoCiclo: 1,
        curso: "2025-2026",
      })
    ).rejects.toThrow(EmailDomainNotAllowedError);

    expect(assertAcademicEmailAvailableMock).not.toHaveBeenCalled();
    expect(txMock.alumno.create).not.toHaveBeenCalled();
  });

  it("rechaza actualizar si el nuevo email tiene dominio no permitido", async () => {
    prismaMock.alumno.findUnique.mockResolvedValue({ cicloFormativoId: 4 });
    assertAcademicEmailDomainMock.mockRejectedValue(new EmailDomainNotAllowedError("ALUMNO"));

    await expect(
      updateAlumno(2, { email: "ana@gmail.com" })
    ).rejects.toThrow(EmailDomainNotAllowedError);

    expect(assertAcademicEmailAvailableMock).not.toHaveBeenCalled();
    expect(txMock.alumno.update).not.toHaveBeenCalled();
  });

  it("elimina el CV asociado antes de borrar el alumno", async () => {
    txMock.alumno.findUnique.mockResolvedValue({ cvOid: 42, email: "ana@mail.com" });
    txMock.alumno.delete.mockResolvedValue({ id: 5 });

    const result = await deleteAlumno(5);

    expect(deleteAlumnoCvLoMock).toHaveBeenCalledWith(txMock, 42);
    expect(syncAcademicUserRemovalMock).toHaveBeenCalledWith(txMock, {
      entity: "ALUMNO",
      email: "ana@mail.com",
    });
    expect(txMock.alumno.delete).toHaveBeenCalledWith({ where: { id: 5 } });
    expect(result).toEqual({ id: 5 });
  });
});
