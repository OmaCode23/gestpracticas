import { beforeEach, describe, expect, it, vi } from "vitest";
import { EmailDomainNotAllowedError } from "@/shared/identity/academic-email";
import { createProfesor, deleteProfesor, updateProfesor } from "./mutations";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    cicloFormativo: {
      findFirst: vi.fn(),
    },
    profesor: {
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

const { assertAcademicEmailAvailableMock, assertAcademicEmailDomainMock } = vi.hoisted(() => ({
  assertAcademicEmailAvailableMock: vi.fn(),
  assertAcademicEmailDomainMock: vi.fn(),
}));

const { syncAcademicUserIdentityMock, txMock } = vi.hoisted(() => ({
  syncAcademicUserIdentityMock: vi.fn(),
  txMock: {
    profesor: {
      create: vi.fn(),
      createMany: vi.fn(),
      findUnique: vi.fn(),
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
  },
}));

const { syncAcademicUserRemovalMock } = vi.hoisted(() => ({
  syncAcademicUserRemovalMock: vi.fn(),
}));

vi.mock("@/database/prisma", () => ({
  prisma: prismaMock,
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

describe("profesores mutations", () => {
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

  it("crea un profesor normalizando email y campos opcionales", async () => {
    prismaMock.cicloFormativo.findFirst.mockResolvedValue({ id: 4 });
    txMock.profesor.create.mockResolvedValue({
      id: 1,
      nombre: "Ana Tutor",
      email: "ana.tutor@mail.com",
    });

    await createProfesor({
      nombre: "  Ana Tutor  ",
      nif: "12345678A",
      especialidad: " Informatica ",
      telefono: " 612345678 ",
      email: " ANA.TUTOR@MAIL.COM ",
      cicloFormativoId: 4,
    });

    expect(assertAcademicEmailAvailableMock).toHaveBeenCalledWith({
      email: " ANA.TUTOR@MAIL.COM ",
      entity: "PROFESOR",
    });
    expect(txMock.profesor.create).toHaveBeenCalledWith({
      data: {
        nombre: "Ana Tutor",
        nif: "12345678A",
        especialidad: "Informatica",
        telefono: "612345678",
        email: "ana.tutor@mail.com",
        cicloFormativoId: 4,
      },
    });
    expect(syncAcademicUserIdentityMock).toHaveBeenCalledWith(txMock, {
      entity: "PROFESOR",
      nombre: "Ana Tutor",
      email: "ana.tutor@mail.com",
    });
  });

  it("actualiza el email validando unicidad cruzada", async () => {
    txMock.profesor.findUnique.mockResolvedValue({ email: "old@mail.com" });
    txMock.profesor.update.mockResolvedValue({
      id: 5,
      nombre: "Nuevo Profe",
      email: "nuevo.profe@mail.com",
    });

    await updateProfesor(5, {
      email: " NUEVO.PROFE@MAIL.COM ",
    });

    expect(assertAcademicEmailAvailableMock).toHaveBeenCalledWith({
      email: " NUEVO.PROFE@MAIL.COM ",
      entity: "PROFESOR",
      excludeId: 5,
    });
    expect(txMock.profesor.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: {
        email: "nuevo.profe@mail.com",
      },
    });
    expect(syncAcademicUserIdentityMock).toHaveBeenCalledWith(txMock, {
      entity: "PROFESOR",
      nombre: "Nuevo Profe",
      email: "nuevo.profe@mail.com",
      previousEmail: "old@mail.com",
    });
  });

  it("rechaza crear si el dominio del email no esta permitido para profesores", async () => {
    prismaMock.cicloFormativo.findFirst.mockResolvedValue({ id: 4 });
    assertAcademicEmailDomainMock.mockRejectedValue(new EmailDomainNotAllowedError("PROFESOR"));

    await expect(
      createProfesor({
        nombre: "Ana Tutor",
        nif: "12345678A",
        especialidad: "",
        telefono: "",
        email: "ana.tutor@gmail.com",
        cicloFormativoId: 4,
      })
    ).rejects.toThrow(EmailDomainNotAllowedError);

    expect(assertAcademicEmailAvailableMock).not.toHaveBeenCalled();
    expect(txMock.profesor.create).not.toHaveBeenCalled();
  });

  it("rechaza actualizar si el nuevo email tiene dominio no permitido", async () => {
    txMock.profesor.findUnique.mockResolvedValue({ email: "old@edu.gva.es" });
    assertAcademicEmailDomainMock.mockRejectedValue(new EmailDomainNotAllowedError("PROFESOR"));

    await expect(
      updateProfesor(5, { email: "nuevo@gmail.com" })
    ).rejects.toThrow(EmailDomainNotAllowedError);

    expect(assertAcademicEmailAvailableMock).not.toHaveBeenCalled();
    expect(txMock.profesor.update).not.toHaveBeenCalled();
  });

  it("desactiva el acceso al borrar un profesor funcional", async () => {
    txMock.profesor.findUnique.mockResolvedValue({ email: "profe@mail.com" });
    txMock.profesor.delete.mockResolvedValue({ id: 9 });

    const result = await deleteProfesor(9);

    expect(syncAcademicUserRemovalMock).toHaveBeenCalledWith(txMock, {
      entity: "PROFESOR",
      email: "profe@mail.com",
    });
    expect(txMock.profesor.delete).toHaveBeenCalledWith({ where: { id: 9 } });
    expect(result).toEqual({ id: 9 });
  });
});
