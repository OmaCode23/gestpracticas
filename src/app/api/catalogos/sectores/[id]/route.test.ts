import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, PATCH } from "./route";

const { getSectoresMock, updateSectorMock, deleteSectorMock, revalidatePathMock, revalidateTagMock } =
  vi.hoisted(() => ({
    getSectoresMock: vi.fn(),
    updateSectorMock: vi.fn(),
    deleteSectorMock: vi.fn(),
    revalidatePathMock: vi.fn(),
    revalidateTagMock: vi.fn(),
  }));

vi.mock("@/modules/catalogos/actions/queries", () => ({
  getSectores: getSectoresMock,
}));

vi.mock("@/modules/catalogos/actions/mutations", () => ({
  updateSector: updateSectorMock,
  deleteSector: deleteSectorMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
  revalidateTag: revalidateTagMock,
}));

describe("PATCH /api/catalogos/sectores/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rechaza ids invalidos", async () => {
    const response = await PATCH(
      {
        json: vi.fn().mockResolvedValue({ nombre: "Tecnologia" }),
      } as any,
      { params: { id: "0" } }
    );

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "ID invalido",
    });
  });

  it("devuelve 404 si el sector no existe", async () => {
    getSectoresMock.mockResolvedValue([]);

    const response = await PATCH(
      {
        json: vi.fn().mockResolvedValue({ nombre: "Tecnologia" }),
      } as any,
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
    getSectoresMock.mockResolvedValue([{ id: 4, nombre: "Tecnologia" }]);
    updateSectorMock.mockRejectedValue({
      code: "P2002",
    });

    const response = await PATCH(
      {
        json: vi.fn().mockResolvedValue({ nombre: "Industria" }),
      } as any,
      { params: { id: "4" } }
    );

    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({
      ok: false,
      error: "Ya existe un sector con ese nombre.",
    });
  });

  it("devuelve 400 cuando se intenta renombrar un sector en uso", async () => {
    getSectoresMock.mockResolvedValue([{ id: 4, nombre: "Tecnologia" }]);
    updateSectorMock.mockRejectedValue({
      message: "SECTOR_EN_USO",
      meta: { empresasCount: 3 },
    });

    const response = await PATCH(
      {
        json: vi.fn().mockResolvedValue({ nombre: "Industria" }),
      } as any,
      { params: { id: "4" } }
    );

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "No se puede editar porque el sector esta siendo usado en 3 empresa(s).",
    });
  });

  it("actualiza el sector y revalida configuracion", async () => {
    getSectoresMock.mockResolvedValue([{ id: 4, nombre: "Tecnologia" }]);
    updateSectorMock.mockResolvedValue({
      id: 4,
      nombre: "Industria",
      activo: false,
    });

    const response = await PATCH(
      {
        json: vi.fn().mockResolvedValue({ nombre: "Industria", activo: false }),
      } as any,
      { params: { id: "4" } }
    );

    const body = await response.json();

    expect(updateSectorMock).toHaveBeenCalledWith(4, {
      nombre: "Industria",
      activo: false,
    });
    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: {
        id: 4,
        nombre: "Industria",
        activo: false,
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/configuracion");
  });
});

describe("DELETE /api/catalogos/sectores/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve 404 si el sector no existe", async () => {
    getSectoresMock.mockResolvedValue([]);

    const response = await DELETE({} as any, { params: { id: "4" } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      ok: false,
      error: "No encontrado",
    });
  });

  it("devuelve 400 cuando el sector esta en uso", async () => {
    getSectoresMock.mockResolvedValue([{ id: 4, nombre: "Tecnologia" }]);
    deleteSectorMock.mockRejectedValue({
      message: "SECTOR_EN_USO",
      meta: { empresasCount: 3 },
    });

    const response = await DELETE({} as any, { params: { id: "4" } });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "No se puede eliminar porque el sector esta siendo usado en 3 empresa(s).",
    });
  });

  it("elimina el sector y revalida configuracion", async () => {
    getSectoresMock.mockResolvedValue([{ id: 4, nombre: "Tecnologia" }]);
    deleteSectorMock.mockResolvedValue(undefined);

    const response = await DELETE({} as any, { params: { id: "4" } });
    const body = await response.json();

    expect(deleteSectorMock).toHaveBeenCalledWith(4);
    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: null,
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/configuracion");
  });
});
