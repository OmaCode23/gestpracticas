import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildSignedSessionValue, hashSessionToken } from "@/modules/auth/core";

const {
  cookiesGetMock,
  sessionFindUniqueMock,
  sessionUpdateMock,
  localAuthFindUniqueMock,
  redirectMock,
} = vi.hoisted(() => ({
  cookiesGetMock: vi.fn(),
  sessionFindUniqueMock: vi.fn(),
  sessionUpdateMock: vi.fn(),
  localAuthFindUniqueMock: vi.fn(),
  redirectMock: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));

vi.mock("next/headers", () => ({
  cookies: () => ({
    get: cookiesGetMock,
    set: vi.fn(),
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/database/prisma", () => ({
  prisma: {
    session: {
      findUnique: sessionFindUniqueMock,
      update: sessionUpdateMock,
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    localAuthAccount: {
      findUnique: localAuthFindUniqueMock,
    },
  },
}));

import { requireAlumnoSession, requireStaffSession } from "@/modules/auth/session";
import { AUTH_COOKIE_NAME } from "@/modules/auth/config";

describe("auth session guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const token = "test-session-token";
    cookiesGetMock.mockImplementation((name: string) => {
      if (name !== AUTH_COOKIE_NAME) {
        return undefined;
      }

      return {
        value: buildSignedSessionValue(token),
      };
    });

    sessionUpdateMock.mockResolvedValue(undefined);
    localAuthFindUniqueMock.mockResolvedValue({
      mustChangePass: false,
    });
  });

  it("permite el acceso cuando la sesion pertenece a un alumno", async () => {
    const tokenHash = hashSessionToken("test-session-token");

    sessionFindUniqueMock.mockImplementation(({ where }: { where: { tokenHash: string } }) => {
      expect(where).toEqual({ tokenHash });

      return Promise.resolve({
        id: 21,
        expiresAt: new Date(Date.now() + 60_000),
        usuario: {
          id: 7,
          nombre: "Alumno Demo",
          email: "alumno@example.com",
          iniciales: "AD",
          rol: "ALUMNO",
          activo: true,
        },
      });
    });

    const session = await requireAlumnoSession("/portal-alumno");

    expect(session.user.rol).toBe("ALUMNO");
    expect(session.user.id).toBe(7);
    expect(redirectMock).not.toHaveBeenCalled();
    expect(sessionUpdateMock).toHaveBeenCalledTimes(1);
  });

  it("redirige a la raiz si la sesion es valida pero el rol no es alumno", async () => {
    sessionFindUniqueMock.mockResolvedValue({
      id: 22,
      expiresAt: new Date(Date.now() + 60_000),
      usuario: {
        id: 8,
        nombre: "Profesor Demo",
        email: "profe@example.com",
        iniciales: "PD",
        rol: "PROFESOR",
        activo: true,
      },
    });

    await expect(requireAlumnoSession("/portal-alumno")).rejects.toThrow("REDIRECT:/");
    expect(redirectMock).toHaveBeenCalledWith("/");
  });

  it("permite el acceso al panel interno cuando la sesion pertenece a personal del centro", async () => {
    sessionFindUniqueMock.mockResolvedValue({
      id: 23,
      expiresAt: new Date(Date.now() + 60_000),
      usuario: {
        id: 9,
        nombre: "Profesor Demo",
        email: "profe@example.com",
        iniciales: "PD",
        rol: "PROFESOR",
        activo: true,
      },
    });

    const session = await requireStaffSession("/informes");

    expect(session.user.rol).toBe("PROFESOR");
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("redirige al portal del alumno si un alumno intenta entrar al panel interno", async () => {
    sessionFindUniqueMock.mockResolvedValue({
      id: 24,
      expiresAt: new Date(Date.now() + 60_000),
      usuario: {
        id: 10,
        nombre: "Alumno Demo",
        email: "alumno@example.com",
        iniciales: "AD",
        rol: "ALUMNO",
        activo: true,
      },
    });

    await expect(requireStaffSession("/informes")).rejects.toThrow("REDIRECT:/portal-alumno");
    expect(redirectMock).toHaveBeenCalledWith("/portal-alumno");
  });
});
