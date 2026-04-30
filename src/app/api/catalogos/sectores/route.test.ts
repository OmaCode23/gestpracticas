import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

const { getSectoresMock, createSectorMock, revalidatePathMock, revalidateTagMock } = vi.hoisted(() => ({
  getSectoresMock: vi.fn(),
  createSectorMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  revalidateTagMock: vi.fn(),
}));

const { ensureApiUserMock, ensureApiAdminMock } = vi.hoisted(() => ({
  ensureApiUserMock: vi.fn(),
  ensureApiAdminMock: vi.fn(),
}));

vi.mock("@/modules/catalogos/actions/queries", () => ({
  getSectores: getSectoresMock,
}));

vi.mock("@/modules/catalogos/actions/mutations", () => ({
  createSector: createSectorMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
  revalidateTag: revalidateTagMock,
}));

vi.mock("@/modules/auth/api", () => ({
  ensureApiUser: ensureApiUserMock,
  ensureApiAdmin: ensureApiAdminMock,
}));

describe("GET /api/catalogos/sectores", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ensureApiUserMock.mockResolvedValue(null);
    ensureApiAdminMock.mockResolvedValue(null);
  });

  it("devuelve el listado de sectores", async () => {
    getSectoresMock.mockResolvedValue([
      {
        id: 1,
        nombre: "Tecnologia",
        activo: true,
        _count: { empresas: 2 },
      },
    ]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: [
        {
          id: 1,
          nombre: "Tecnologia",
          activo: true,
          _count: { empresas: 2 },
        },
      ],
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
    expect(getSectoresMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/catalogos/sectores", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ensureApiUserMock.mockResolvedValue(null);
    ensureApiAdminMock.mockResolvedValue(null);
  });

  it("devuelve 403 si el usuario no es administrador", async () => {
    ensureApiAdminMock.mockResolvedValueOnce(
      Response.json({ ok: false, error: "No autorizado." }, { status: 403 })
    );

    const response = await POST({
      json: vi.fn().mockResolvedValue({
        nombre: "Tecnologia",
      }),
    } as any);

    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({
      ok: false,
      error: "No autorizado.",
    });
    expect(createSectorMock).not.toHaveBeenCalled();
  });

  it("rechaza cuerpos invalidos", async () => {
    const response = await POST({
      json: vi.fn().mockResolvedValue({
        nombre: "",
      }),
    } as any);

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "El nombre es obligatorio.",
    });
  });

  it("devuelve 409 cuando el nombre ya existe", async () => {
    createSectorMock.mockRejectedValue({
      code: "P2002",
    });

    const response = await POST({
      json: vi.fn().mockResolvedValue({
        nombre: "Tecnologia",
      }),
    } as any);

    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({
      ok: false,
      error: "Ya existe un sector con ese nombre.",
    });
  });

  it("crea el sector y revalida configuracion", async () => {
    createSectorMock.mockResolvedValue({
      id: 3,
      nombre: "Logistica",
      activo: true,
    });

    const response = await POST({
      json: vi.fn().mockResolvedValue({
        nombre: "Logistica",
      }),
    } as any);

    const body = await response.json();

    expect(createSectorMock).toHaveBeenCalledWith({
      nombre: "Logistica",
    });
    expect(response.status).toBe(201);
    expect(body).toEqual({
      ok: true,
      data: {
        id: 3,
        nombre: "Logistica",
        activo: true,
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/configuracion");
  });
});
