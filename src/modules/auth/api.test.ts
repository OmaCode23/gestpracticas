import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { requireApiUserSessionMock, requireApiAdminSessionMock } = vi.hoisted(() => ({
  requireApiUserSessionMock: vi.fn(),
  requireApiAdminSessionMock: vi.fn(),
}));

vi.mock("@/modules/auth/session", () => ({
  requireApiUserSession: requireApiUserSessionMock,
  requireApiAdminSession: requireApiAdminSessionMock,
}));

import { ensureApiAdmin, ensureApiUser } from "@/modules/auth/api";

describe("auth api guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VITEST", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("devuelve 401 si no hay sesion en una API interna", async () => {
    requireApiUserSessionMock.mockResolvedValue(null);

    const response = await ensureApiUser();
    const body = await response?.json();

    expect(response?.status).toBe(401);
    expect(body).toEqual({
      ok: false,
      error: "No autenticado.",
    });
  });

  it("devuelve 403 si un alumno intenta usar una API interna del panel", async () => {
    requireApiUserSessionMock.mockResolvedValue({
      user: {
        rol: "ALUMNO",
      },
    });

    const response = await ensureApiUser();
    const body = await response?.json();

    expect(response?.status).toBe(403);
    expect(body).toEqual({
      ok: false,
      error: "No autorizado.",
    });
  });

  it("permite el acceso si la API interna la usa personal del centro", async () => {
    requireApiUserSessionMock.mockResolvedValue({
      user: {
        rol: "PROFESOR",
      },
    });

    await expect(ensureApiUser()).resolves.toBeNull();
  });

  it("mantiene la guardia de admin para operaciones exclusivas", async () => {
    requireApiAdminSessionMock.mockResolvedValue(null);

    const response = await ensureApiAdmin();
    const body = await response?.json();

    expect(response?.status).toBe(403);
    expect(body).toEqual({
      ok: false,
      error: "No autorizado.",
    });
  });
});
