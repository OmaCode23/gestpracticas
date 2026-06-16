import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, PATCH } from "./route";

const {
  getCursoAreasMock,
  updateCursoAreaMock,
  deleteCursoAreaMock,
  revalidatePathMock,
  revalidateTagMock,
} = vi.hoisted(() => ({
  getCursoAreasMock: vi.fn(),
  updateCursoAreaMock: vi.fn(),
  deleteCursoAreaMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  revalidateTagMock: vi.fn(),
}));

const { ensureApiUserMock } = vi.hoisted(() => ({
  ensureApiUserMock: vi.fn(),
}));

vi.mock("@/modules/catalogos/actions/queries", () => ({
  getCursoAreas: getCursoAreasMock,
}));

vi.mock("@/modules/catalogos/actions/mutations", () => ({
  updateCursoArea: updateCursoAreaMock,
  deleteCursoArea: deleteCursoAreaMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
  revalidateTag: revalidateTagMock,
}));

vi.mock("@/modules/auth/api", () => ({
  ensureApiUser: ensureApiUserMock,
}));

describe("PATCH /api/catalogos/curso-areas/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ensureApiUserMock.mockResolvedValue(null);
  });

  it("devuelve 403 si el usuario no pertenece al personal", async () => {
    ensureApiUserMock.mockResolvedValueOnce(
      Response.json({ ok: false, error: "No autorizado." }, { status: 403 })
    );

    const response = await PATCH(
      { json: vi.fn().mockResolvedValue({ nombre: "Nueva area" }) } as any,
      { params: { id: "4" } }
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({
      ok: false,
      error: "No autorizado.",
    });
    expect(updateCursoAreaMock).not.toHaveBeenCalled();
  });

  it("rechaza ids invalidos", async () => {
    const response = await PATCH(
      { json: vi.fn().mockResolvedValue({ nombre: "Nueva area" }) } as any,
      { params: { id: "0" } }
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "ID invalido",
    });
  });

  it("devuelve 404 si el area no existe", async () => {
    getCursoAreasMock.mockResolvedValue([]);

    const response = await PATCH(
      { json: vi.fn().mockResolvedValue({ nombre: "Nueva area" }) } as any,
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
    getCursoAreasMock.mockResolvedValue([{ id: 4, nombre: "Informatica" }]);
    updateCursoAreaMock.mockRejectedValue({ code: "P2002" });

    const response = await PATCH(
      { json: vi.fn().mockResolvedValue({ nombre: "Sanidad" }) } as any,
      { params: { id: "4" } }
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({
      ok: false,
      error: "Ya existe un area con ese nombre.",
    });
  });

  it("actualiza el area y revalida catalogos relacionados", async () => {
    getCursoAreasMock.mockResolvedValue([{ id: 4, nombre: "Informatica" }]);
    updateCursoAreaMock.mockResolvedValue({
      id: 4,
      nombre: "Sanidad",
      activo: true,
    });

    const response = await PATCH(
      { json: vi.fn().mockResolvedValue({ nombre: "Sanidad" }) } as any,
      { params: { id: "4" } }
    );
    const body = await response.json();

    expect(updateCursoAreaMock).toHaveBeenCalledWith(4, { nombre: "Sanidad" });
    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: {
        id: 4,
        nombre: "Sanidad",
        activo: true,
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/configuracion");
  });
});

describe("DELETE /api/catalogos/curso-areas/[id]", () => {
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
    expect(deleteCursoAreaMock).not.toHaveBeenCalled();
  });

  it("devuelve 404 si el area no existe", async () => {
    getCursoAreasMock.mockResolvedValue([]);

    const response = await DELETE({} as any, { params: { id: "4" } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      ok: false,
      error: "No encontrado",
    });
  });

  it("devuelve 400 cuando el area esta en uso", async () => {
    getCursoAreasMock.mockResolvedValue([{ id: 4, nombre: "Informatica" }]);
    deleteCursoAreaMock.mockRejectedValue({
      message: "CURSO_AREA_EN_USO",
      meta: { cursosCount: 2 },
    });

    const response = await DELETE({} as any, { params: { id: "4" } });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "No se puede eliminar porque el area esta siendo usada en 2 curso(s).",
    });
  });

  it("elimina el area y revalida catalogos relacionados", async () => {
    getCursoAreasMock.mockResolvedValue([{ id: 4, nombre: "Informatica" }]);
    deleteCursoAreaMock.mockResolvedValue(undefined);

    const response = await DELETE({} as any, { params: { id: "4" } });
    const body = await response.json();

    expect(deleteCursoAreaMock).toHaveBeenCalledWith(4);
    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: null,
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/configuracion");
  });
});
