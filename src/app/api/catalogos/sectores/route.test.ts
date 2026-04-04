import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

const { getSectoresMock, createSectorMock, revalidatePathMock } = vi.hoisted(() => ({
  getSectoresMock: vi.fn(),
  createSectorMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/modules/catalogos/actions/queries", () => ({
  getSectores: getSectoresMock,
}));

vi.mock("@/modules/catalogos/actions/mutations", () => ({
  createSector: createSectorMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

describe("GET /api/catalogos/sectores", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});

describe("POST /api/catalogos/sectores", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
