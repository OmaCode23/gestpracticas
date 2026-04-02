import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, GET, PATCH } from "./route";

const { getEmpresaByIdMock, updateEmpresaMock, deleteEmpresaMock, revalidatePathMock } =
  vi.hoisted(() => ({
    getEmpresaByIdMock: vi.fn(),
    updateEmpresaMock: vi.fn(),
    deleteEmpresaMock: vi.fn(),
    revalidatePathMock: vi.fn(),
  }));

vi.mock("@/modules/empresas/actions/queries", () => ({
  getEmpresaById: getEmpresaByIdMock,
}));

vi.mock("@/modules/empresas/actions/mutations", () => ({
  updateEmpresa: updateEmpresaMock,
  deleteEmpresa: deleteEmpresaMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

describe("GET /api/empresas/[id]", () => {
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

  it("devuelve 404 si la empresa no existe", async () => {
    getEmpresaByIdMock.mockResolvedValue(null);

    const response = await GET({} as any, { params: { id: "3" } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      ok: false,
      error: "Empresa no encontrada",
    });
  });
});

describe("PATCH /api/empresas/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve 404 si la empresa no existe", async () => {
    getEmpresaByIdMock.mockResolvedValue(null);

    const response = await PATCH(
      {
        json: vi.fn().mockResolvedValue({ nombre: "Empresa Actualizada" }),
      } as any,
      { params: { id: "3" } }
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      ok: false,
      error: "Empresa no encontrada",
    });
  });

  it("devuelve 400 cuando el ciclo formativo no es valido", async () => {
    getEmpresaByIdMock.mockResolvedValue({ id: 3 });
    updateEmpresaMock.mockRejectedValue(new Error("CICLO_FORMATIVO_INVALIDO"));

    const response = await PATCH(
      {
        json: vi.fn().mockResolvedValue({ cicloFormativoId: 999 }),
      } as any,
      { params: { id: "3" } }
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "El ciclo formativo no es valido.",
    });
  });

  it("actualiza y revalida rutas", async () => {
    getEmpresaByIdMock.mockResolvedValue({ id: 3 });
    updateEmpresaMock.mockResolvedValue({ id: 3, nombre: "Empresa Actualizada" });

    const response = await PATCH(
      {
        json: vi.fn().mockResolvedValue({ nombre: "Empresa Actualizada" }),
      } as any,
      { params: { id: "3" } }
    );
    const body = await response.json();

    expect(updateEmpresaMock).toHaveBeenCalledWith(3, { nombre: "Empresa Actualizada" });
    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: { id: 3, nombre: "Empresa Actualizada" },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
    expect(revalidatePathMock).toHaveBeenCalledWith("/empresas");
  });
});

describe("DELETE /api/empresas/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve 409 si la empresa participa en formaciones", async () => {
    getEmpresaByIdMock.mockResolvedValue({ id: 3 });
    deleteEmpresaMock.mockRejectedValue(new Error("EMPRESA_CON_FORMACIONES"));

    const response = await DELETE({} as any, { params: { id: "3" } });
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({
      ok: false,
      error: "No se puede eliminar la empresa porque participa en formaciones registradas.",
    });
  });

  it("elimina y revalida rutas", async () => {
    getEmpresaByIdMock.mockResolvedValue({ id: 3 });
    deleteEmpresaMock.mockResolvedValue(undefined);

    const response = await DELETE({} as any, { params: { id: "3" } });
    const body = await response.json();

    expect(deleteEmpresaMock).toHaveBeenCalledWith(3);
    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: null,
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
    expect(revalidatePathMock).toHaveBeenCalledWith("/empresas");
  });
});
