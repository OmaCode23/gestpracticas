import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, dynamic } from "./route";

const { getEmpresaCatalogosMock } = vi.hoisted(() => ({
  getEmpresaCatalogosMock: vi.fn(),
}));

vi.mock("@/modules/catalogos/actions/queries", () => ({
  getEmpresaCatalogos: getEmpresaCatalogosMock,
}));

describe("GET /api/catalogos/empresas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fuerza modo dinamico para evitar catalogos congelados en produccion", () => {
    expect(dynamic).toBe("force-dynamic");
  });

  it("devuelve los catalogos activos para el formulario de empresas", async () => {
    getEmpresaCatalogosMock.mockResolvedValue({
      sectores: [{ id: 1, nombre: "Tecnologia" }],
      localidades: [{ id: 2, nombre: "Valencia" }],
      ciclosFormativos: [{ id: 3, nombre: "DAM", codigo: "DAM" }],
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: {
        sectores: [{ id: 1, nombre: "Tecnologia" }],
        localidades: [{ id: 2, nombre: "Valencia" }],
        ciclosFormativos: [{ id: 3, nombre: "DAM", codigo: "DAM" }],
      },
    });
  });

  it("devuelve 500 si falla la carga de catalogos", async () => {
    getEmpresaCatalogosMock.mockRejectedValue(new Error("boom"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      ok: false,
      error: "Error al obtener los catalogos de empresas",
    });
  });
});
