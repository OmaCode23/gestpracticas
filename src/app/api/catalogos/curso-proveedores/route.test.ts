import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

const {
  getCursoProveedoresMock,
  createCursoProveedorMock,
  revalidatePathMock,
  revalidateTagMock,
} = vi.hoisted(() => ({
  getCursoProveedoresMock: vi.fn(),
  createCursoProveedorMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  revalidateTagMock: vi.fn(),
}));

const { ensureApiUserMock } = vi.hoisted(() => ({
  ensureApiUserMock: vi.fn(),
}));

vi.mock("@/modules/catalogos/actions/queries", () => ({
  getCursoProveedores: getCursoProveedoresMock,
}));

vi.mock("@/modules/catalogos/actions/mutations", () => ({
  createCursoProveedor: createCursoProveedorMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
  revalidateTag: revalidateTagMock,
}));

vi.mock("@/modules/auth/api", () => ({
  ensureApiUser: ensureApiUserMock,
}));

describe("GET /api/catalogos/curso-proveedores", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ensureApiUserMock.mockResolvedValue(null);
  });

  it("devuelve el listado de proveedores", async () => {
    getCursoProveedoresMock.mockResolvedValue([{ id: 1, nombre: "Labora", activo: true }]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: [{ id: 1, nombre: "Labora", activo: true }],
    });
  });

  it("devuelve 401 si falta autenticacion", async () => {
    ensureApiUserMock.mockResolvedValueOnce(
      Response.json({ ok: false, error: "No autenticado." }, { status: 401 })
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      ok: false,
      error: "No autenticado.",
    });
    expect(getCursoProveedoresMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/catalogos/curso-proveedores", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ensureApiUserMock.mockResolvedValue(null);
  });

  it("devuelve 403 si el usuario no pertenece al personal", async () => {
    ensureApiUserMock.mockResolvedValueOnce(
      Response.json({ ok: false, error: "No autorizado." }, { status: 403 })
    );

    const response = await POST({
      json: vi.fn().mockResolvedValue({ nombre: "Labora" }),
    } as any);

    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({
      ok: false,
      error: "No autorizado.",
    });
    expect(createCursoProveedorMock).not.toHaveBeenCalled();
  });

  it("rechaza cuerpos invalidos", async () => {
    const response = await POST({
      json: vi.fn().mockResolvedValue({ nombre: "" }),
    } as any);

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "El nombre es obligatorio.",
    });
  });

  it("devuelve 409 cuando el nombre ya existe", async () => {
    createCursoProveedorMock.mockRejectedValue({ code: "P2002" });

    const response = await POST({
      json: vi.fn().mockResolvedValue({ nombre: "Labora" }),
    } as any);

    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({
      ok: false,
      error: "Ya existe un proveedor con ese nombre.",
    });
  });

  it("crea el proveedor y revalida catalogos relacionados", async () => {
    createCursoProveedorMock.mockResolvedValue({
      id: 3,
      nombre: "Servef",
      activo: true,
    });

    const response = await POST({
      json: vi.fn().mockResolvedValue({ nombre: "Servef" }),
    } as any);

    const body = await response.json();

    expect(createCursoProveedorMock).toHaveBeenCalledWith({ nombre: "Servef" });
    expect(response.status).toBe(201);
    expect(body).toEqual({
      ok: true,
      data: {
        id: 3,
        nombre: "Servef",
        activo: true,
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/configuracion");
  });
});
