import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, GET, PATCH } from "./route";

const {
  getFormacionByIdMock,
  updateFormacionMock,
  deleteFormacionMock,
  getCursosAcademicosConfiguradosMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  getFormacionByIdMock: vi.fn(),
  updateFormacionMock: vi.fn(),
  deleteFormacionMock: vi.fn(),
  getCursosAcademicosConfiguradosMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/modules/formacion/actions/queries", () => ({
  getFormacionById: getFormacionByIdMock,
}));

vi.mock("@/modules/formacion/actions/mutations", () => ({
  updateFormacion: updateFormacionMock,
  deleteFormacion: deleteFormacionMock,
}));

vi.mock("@/modules/settings/actions/queries", () => ({
  getCursosAcademicosConfigurados: getCursosAcademicosConfiguradosMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

describe("GET /api/formacion/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rechaza ids invalidos", async () => {
    const response = await GET({} as any, { params: { id: "0" } });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "ID inválido",
    });
  });

  it("devuelve 404 si la formacion no existe", async () => {
    getFormacionByIdMock.mockResolvedValue(null);

    const response = await GET({} as any, { params: { id: "3" } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      ok: false,
      error: "No encontrada",
    });
  });
});

describe("PATCH /api/formacion/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCursosAcademicosConfiguradosMock.mockResolvedValue(["2025-2026"]);
  });

  it("rechaza cursos no configurados", async () => {
    const response = await PATCH(
      {
        json: vi.fn().mockResolvedValue({ curso: "2024-2025" }),
      } as any,
      { params: { id: "3" } }
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "El curso no es valido",
    });
  });

  it("devuelve 404 si la formacion no existe", async () => {
    getFormacionByIdMock.mockResolvedValue(null);

    const response = await PATCH(
      {
        json: vi.fn().mockResolvedValue({ periodo: "Abril" }),
      } as any,
      { params: { id: "3" } }
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      ok: false,
      error: "No encontrada",
    });
  });

  it("actualiza y revalida rutas", async () => {
    getFormacionByIdMock.mockResolvedValue({ id: 3 });
    updateFormacionMock.mockResolvedValue({ id: 3, periodo: "Abril" });

    const response = await PATCH(
      {
        json: vi.fn().mockResolvedValue({ periodo: "Abril" }),
      } as any,
      { params: { id: "3" } }
    );
    const body = await response.json();

    expect(updateFormacionMock).toHaveBeenCalledWith(3, { periodo: "Abril" });
    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: { id: 3, periodo: "Abril" },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
    expect(revalidatePathMock).toHaveBeenCalledWith("/formacion");
  });
});

describe("DELETE /api/formacion/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve 404 si la formacion no existe", async () => {
    getFormacionByIdMock.mockResolvedValue(null);

    const response = await DELETE({} as any, { params: { id: "3" } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      ok: false,
      error: "No encontrada",
    });
  });

  it("elimina y revalida rutas", async () => {
    getFormacionByIdMock.mockResolvedValue({ id: 3 });
    deleteFormacionMock.mockResolvedValue(undefined);

    const response = await DELETE({} as any, { params: { id: "3" } });
    const body = await response.json();

    expect(deleteFormacionMock).toHaveBeenCalledWith(3);
    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: null,
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
    expect(revalidatePathMock).toHaveBeenCalledWith("/formacion");
  });
});
