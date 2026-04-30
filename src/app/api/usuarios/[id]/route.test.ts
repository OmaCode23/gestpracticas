import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE } from "./route";

const {
  requireApiAdminSessionMock,
  deleteManagedUserMock,
} = vi.hoisted(() => ({
  requireApiAdminSessionMock: vi.fn(),
  deleteManagedUserMock: vi.fn(),
}));

vi.mock("@/modules/auth/session", () => ({
  requireApiAdminSession: requireApiAdminSessionMock,
}));

vi.mock("@/modules/auth/config", () => ({
  isLocalAuthMode: vi.fn(() => true),
}));

vi.mock("@/modules/usuarios/actions", () => ({
  deleteManagedUser: deleteManagedUserMock,
  resetManagedUserPassword: vi.fn(),
  updateManagedUser: vi.fn(),
}));

describe("DELETE /api/usuarios/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiAdminSessionMock.mockResolvedValue({
      user: {
        id: 10,
        rol: "ADMIN",
      },
    });
  });

  it("devuelve 403 si no hay sesion admin", async () => {
    requireApiAdminSessionMock.mockResolvedValueOnce(null);

    const response = await DELETE({} as any, { params: { id: "5" } });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({
      ok: false,
      error: "No autorizado.",
    });
    expect(deleteManagedUserMock).not.toHaveBeenCalled();
  });

  it("devuelve 400 si el id es invalido", async () => {
    const response = await DELETE({} as any, { params: { id: "abc" } });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "Identificador de usuario invalido.",
    });
    expect(deleteManagedUserMock).not.toHaveBeenCalled();
  });

  it("impide borrarse a si mismo", async () => {
    deleteManagedUserMock.mockRejectedValueOnce(new Error("CANNOT_DELETE_SELF"));

    const response = await DELETE({} as any, { params: { id: "10" } });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "No puedes eliminar tu propio usuario administrador.",
    });
  });

  it("impide borrar el ultimo administrador activo", async () => {
    deleteManagedUserMock.mockRejectedValueOnce(new Error("LAST_ACTIVE_ADMIN"));

    const response = await DELETE({} as any, { params: { id: "11" } });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "No puedes eliminar el ultimo administrador activo.",
    });
  });

  it("devuelve 404 si el usuario no existe", async () => {
    deleteManagedUserMock.mockRejectedValueOnce(new Error("USER_NOT_FOUND"));

    const response = await DELETE({} as any, { params: { id: "99" } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      ok: false,
      error: "Usuario no encontrado.",
    });
  });

  it("elimina el usuario cuando la operacion es valida", async () => {
    deleteManagedUserMock.mockResolvedValueOnce(undefined);

    const response = await DELETE({} as any, { params: { id: "12" } });
    const body = await response.json();

    expect(deleteManagedUserMock).toHaveBeenCalledWith(12, 10);
    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: null,
    });
  });
});
