import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

const {
  getCursoAreasMock,
  createCursoAreaMock,
  revalidatePathMock,
  revalidateTagMock,
} = vi.hoisted(() => ({
  getCursoAreasMock: vi.fn(),
  createCursoAreaMock: vi.fn(),
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
  createCursoArea: createCursoAreaMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
  revalidateTag: revalidateTagMock,
}));

vi.mock("@/modules/auth/api", () => ({
  ensureApiUser: ensureApiUserMock,
}));

describe("GET /api/catalogos/curso-areas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ensureApiUserMock.mockResolvedValue(null);
  });

  it("devuelve el listado de areas", async () => {
    getCursoAreasMock.mockResolvedValue([{ id: 1, nombre: "Informatica", activo: true }]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: [{ id: 1, nombre: "Informatica", activo: true }],
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
    expect(getCursoAreasMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/catalogos/curso-areas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ensureApiUserMock.mockResolvedValue(null);
  });

  it("devuelve 403 si el usuario no pertenece al personal", async () => {
    ensureApiUserMock.mockResolvedValueOnce(
      Response.json({ ok: false, error: "No autorizado." }, { status: 403 })
    );

    const response = await POST({
      json: vi.fn().mockResolvedValue({ nombre: "Informatica" }),
    } as any);

    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({
      ok: false,
      error: "No autorizado.",
    });
    expect(createCursoAreaMock).not.toHaveBeenCalled();
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
    createCursoAreaMock.mockRejectedValue({ code: "P2002" });

    const response = await POST({
      json: vi.fn().mockResolvedValue({ nombre: "Informatica" }),
    } as any);

    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({
      ok: false,
      error: "Ya existe un area con ese nombre.",
    });
  });

  it("crea el area y revalida catalogos relacionados", async () => {
    createCursoAreaMock.mockResolvedValue({
      id: 3,
      nombre: "Sanidad",
      activo: true,
    });

    const response = await POST({
      json: vi.fn().mockResolvedValue({ nombre: "Sanidad" }),
    } as any);

    const body = await response.json();

    expect(createCursoAreaMock).toHaveBeenCalledWith({ nombre: "Sanidad" });
    expect(response.status).toBe(201);
    expect(body).toEqual({
      ok: true,
      data: {
        id: 3,
        nombre: "Sanidad",
        activo: true,
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/configuracion");
  });
});
