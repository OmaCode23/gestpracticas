import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, PATCH } from "./route";

const {
  getCursoProveedoresMock,
  updateCursoProveedorMock,
  deleteCursoProveedorMock,
  revalidatePathMock,
  revalidateTagMock,
} = vi.hoisted(() => ({
  getCursoProveedoresMock: vi.fn(),
  updateCursoProveedorMock: vi.fn(),
  deleteCursoProveedorMock: vi.fn(),
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
  updateCursoProveedor: updateCursoProveedorMock,
  deleteCursoProveedor: deleteCursoProveedorMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
  revalidateTag: revalidateTagMock,
}));

vi.mock("@/modules/auth/api", () => ({
  ensureApiUser: ensureApiUserMock,
}));

describe("PATCH /api/catalogos/curso-proveedores/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ensureApiUserMock.mockResolvedValue(null);
  });

  it("devuelve 403 si el usuario no pertenece al personal", async () => {
    ensureApiUserMock.mockResolvedValueOnce(
      Response.json({ ok: false, error: "No autorizado." }, { status: 403 })
    );

    const response = await PATCH(
      { json: vi.fn().mockResolvedValue({ nombre: "Nuevo proveedor" }) } as any,
      { params: { id: "4" } }
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({
      ok: false,
      error: "No autorizado.",
    });
    expect(updateCursoProveedorMock).not.toHaveBeenCalled();
  });

  it("rechaza ids invalidos", async () => {
    const response = await PATCH(
      { json: vi.fn().mockResolvedValue({ nombre: "Nuevo proveedor" }) } as any,
      { params: { id: "0" } }
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "ID invalido",
    });
  });

  it("devuelve 404 si el proveedor no existe", async () => {
    getCursoProveedoresMock.mockResolvedValue([]);

    const response = await PATCH(
      { json: vi.fn().mockResolvedValue({ nombre: "Nuevo proveedor" }) } as any,
      { params: { id: "4" } }
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      ok: false,
      error: "No encontrado",
    });
  });

  it("devuelve 409 cuando el nombre ya existe", async () => {
    getCursoProveedoresMock.mockResolvedValue([{ id: 4, nombre: "Labora" }]);
    updateCursoProveedorMock.mockRejectedValue({ code: "P2002" });

    const response = await PATCH(
      { json: vi.fn().mockResolvedValue({ nombre: "Servef" }) } as any,
      { params: { id: "4" } }
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({
      ok: false,
      error: "Ya existe un proveedor con ese nombre.",
    });
  });

  it("actualiza el proveedor y revalida catalogos relacionados", async () => {
    getCursoProveedoresMock.mockResolvedValue([{ id: 4, nombre: "Labora" }]);
    updateCursoProveedorMock.mockResolvedValue({
      id: 4,
      nombre: "Servef",
      activo: true,
    });

    const response = await PATCH(
      { json: vi.fn().mockResolvedValue({ nombre: "Servef" }) } as any,
      { params: { id: "4" } }
    );
    const body = await response.json();

    expect(updateCursoProveedorMock).toHaveBeenCalledWith(4, { nombre: "Servef" });
    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: {
        id: 4,
        nombre: "Servef",
        activo: true,
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/configuracion");
  });
});

describe("DELETE /api/catalogos/curso-proveedores/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ensureApiUserMock.mockResolvedValue(null);
  });

  it("devuelve 403 si el usuario no pertenece al personal", async () => {
    ensureApiUserMock.mockResolvedValueOnce(
      Response.json({ ok: false, error: "No autorizado." }, { status: 403 })
    );

    const response = await DELETE({} as any, { params: { id: "4" } });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({
      ok: false,
      error: "No autorizado.",
    });
    expect(deleteCursoProveedorMock).not.toHaveBeenCalled();
  });

  it("devuelve 404 si el proveedor no existe", async () => {
    getCursoProveedoresMock.mockResolvedValue([]);

    const response = await DELETE({} as any, { params: { id: "4" } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      ok: false,
      error: "No encontrado",
    });
  });

  it("devuelve 400 cuando el proveedor esta en uso", async () => {
    getCursoProveedoresMock.mockResolvedValue([{ id: 4, nombre: "Labora" }]);
    deleteCursoProveedorMock.mockRejectedValue({
      message: "CURSO_PROVEEDOR_EN_USO",
      meta: { cursosCount: 3 },
    });

    const response = await DELETE({} as any, { params: { id: "4" } });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "No se puede eliminar porque el proveedor esta siendo usado en 3 curso(s).",
    });
  });

  it("elimina el proveedor y revalida catalogos relacionados", async () => {
    getCursoProveedoresMock.mockResolvedValue([{ id: 4, nombre: "Labora" }]);
    deleteCursoProveedorMock.mockResolvedValue(undefined);

    const response = await DELETE({} as any, { params: { id: "4" } });
    const body = await response.json();

    expect(deleteCursoProveedorMock).toHaveBeenCalledWith(4);
    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: null,
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/configuracion");
  });
});
