import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, PATCH } from "./route";

const { getCiclosFormativosMock, updateCicloFormativoMock, deleteCicloFormativoMock, revalidatePathMock } =
  vi.hoisted(() => ({
    getCiclosFormativosMock: vi.fn(),
    updateCicloFormativoMock: vi.fn(),
    deleteCicloFormativoMock: vi.fn(),
    revalidatePathMock: vi.fn(),
  }));

vi.mock("@/modules/catalogos/actions/queries", () => ({
  getCiclosFormativos: getCiclosFormativosMock,
}));

vi.mock("@/modules/catalogos/actions/mutations", () => ({
  updateCicloFormativo: updateCicloFormativoMock,
  deleteCicloFormativo: deleteCicloFormativoMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

describe("PATCH /api/catalogos/ciclos-formativos/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve 400 si el ciclo base no es editable", async () => {
    getCiclosFormativosMock.mockResolvedValue([{ id: 4, nombre: "DAM", codigo: "DAM" }]);
    updateCicloFormativoMock.mockRejectedValue(new Error("CICLO_FORMATIVO_BASE_NO_EDITABLE"));

    const response = await PATCH(
      {
        json: vi.fn().mockResolvedValue({ nombre: "Nuevo DAM" }),
      } as any,
      { params: { id: "4" } }
    );

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "No se puede editar un ciclo formativo base.",
    });
  });

  it("devuelve 400 si se intenta mover un ciclo a un codigo reservado", async () => {
    getCiclosFormativosMock.mockResolvedValue([{ id: 9, nombre: "Ciclo propio", codigo: "CP-1" }]);
    updateCicloFormativoMock.mockRejectedValue(new Error("CICLO_FORMATIVO_CODIGO_RESERVADO"));

    const response = await PATCH(
      {
        json: vi.fn().mockResolvedValue({ codigo: "DAM" }),
      } as any,
      { params: { id: "9" } }
    );

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "Ese codigo esta reservado para un ciclo formativo base. Usa la restauracion de valores por defecto.",
    });
  });

  it("actualiza un ciclo personalizado y revalida configuracion", async () => {
    getCiclosFormativosMock.mockResolvedValue([{ id: 9, nombre: "Ciclo propio", codigo: "CP-1" }]);
    updateCicloFormativoMock.mockResolvedValue({
      id: 9,
      nombre: "Ciclo propio v2",
      codigo: "CP-1",
      activo: true,
    });

    const response = await PATCH(
      {
        json: vi.fn().mockResolvedValue({ nombre: "Ciclo propio v2" }),
      } as any,
      { params: { id: "9" } }
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(revalidatePathMock).toHaveBeenCalledWith("/configuracion");
  });
});

describe("DELETE /api/catalogos/ciclos-formativos/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve 400 si el ciclo base no es eliminable", async () => {
    getCiclosFormativosMock.mockResolvedValue([{ id: 4, nombre: "DAM", codigo: "DAM" }]);
    deleteCicloFormativoMock.mockRejectedValue(new Error("CICLO_FORMATIVO_BASE_NO_ELIMINABLE"));

    const response = await DELETE({} as any, { params: { id: "4" } });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "No se puede eliminar un ciclo formativo base.",
    });
  });

  it("elimina un ciclo personalizado y revalida configuracion", async () => {
    getCiclosFormativosMock.mockResolvedValue([{ id: 9, nombre: "Ciclo propio", codigo: "CP-1" }]);
    deleteCicloFormativoMock.mockResolvedValue(undefined);

    const response = await DELETE({} as any, { params: { id: "9" } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: null,
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/configuracion");
  });
});
