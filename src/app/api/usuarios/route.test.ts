import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const {
  requireApiAdminSessionMock,
  createManagedUserMock,
} = vi.hoisted(() => ({
  requireApiAdminSessionMock: vi.fn(),
  createManagedUserMock: vi.fn(),
}));

vi.mock("@/modules/auth/session", () => ({
  requireApiAdminSession: requireApiAdminSessionMock,
}));

vi.mock("@/modules/auth/config", () => ({
  isLocalAuthMode: vi.fn(() => true),
}));

vi.mock("@/modules/usuarios/actions", () => ({
  createManagedUser: createManagedUserMock,
  listManagedUsers: vi.fn(),
}));

describe("POST /api/usuarios", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiAdminSessionMock.mockResolvedValue({
      user: {
        id: 1,
        rol: "ADMIN",
      },
    });
  });

  it("rechaza crear usuarios no ADMIN desde la administracion", async () => {
    const response = await POST({
      json: vi.fn().mockResolvedValue({
        nombre: "Alumno Demo",
        email: "alumno@mail.com",
        rol: "ALUMNO",
        activo: true,
        password: "temporal123",
      }),
    } as any);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(createManagedUserMock).not.toHaveBeenCalled();
  });

  it("devuelve 400 si la capa de negocio rechaza un rol no permitido", async () => {
    createManagedUserMock.mockRejectedValueOnce(new Error("MANAGED_USER_CREATE_ADMIN_ONLY"));

    const response = await POST({
      json: vi.fn().mockResolvedValue({
        nombre: "Administrador",
        email: "admin@mail.com",
        rol: "ADMIN",
        activo: true,
        password: "temporal123",
      }),
    } as any);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "Desde esta pantalla solo se pueden crear cuentas ADMIN.",
    });
  });

  it("permite crear un administrador sin contrasena previa en modo local", async () => {
    createManagedUserMock.mockResolvedValueOnce({ id: 7 });

    const response = await POST({
      json: vi.fn().mockResolvedValue({
        nombre: "Administrador",
        email: "admin@mail.com",
        rol: "ADMIN",
        activo: false,
      }),
    } as any);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({
      ok: true,
      data: { id: 7 },
    });
    expect(createManagedUserMock).toHaveBeenCalledWith({
      nombre: "Administrador",
      email: "admin@mail.com",
      rol: "ADMIN",
      activo: false,
    });
  });
});
