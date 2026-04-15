import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

const { getCiclosFormativosMock, createCicloFormativoMock, revalidatePathMock } = vi.hoisted(
  () => ({
    getCiclosFormativosMock: vi.fn(),
    createCicloFormativoMock: vi.fn(),
    revalidatePathMock: vi.fn(),
  })
);

vi.mock("@/modules/catalogos/actions/queries", () => ({
  getCiclosFormativos: getCiclosFormativosMock,
}));

vi.mock("@/modules/catalogos/actions/mutations", () => ({
  createCicloFormativo: createCicloFormativoMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

describe("GET /api/catalogos/ciclos-formativos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve el listado de ciclos", async () => {
    getCiclosFormativosMock.mockResolvedValue([{ id: 1, nombre: "DAM", codigo: "DAM" }]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: [{ id: 1, nombre: "DAM", codigo: "DAM" }],
    });
  });
});

describe("POST /api/catalogos/ciclos-formativos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rechaza cuerpos invalidos", async () => {
    const response = await POST({
      json: vi.fn().mockResolvedValue({
        nombre: "",
        codigo: "",
      }),
    } as any);

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
  });

  it("devuelve 400 si se usa un codigo reservado fuera del catalogo base", async () => {
    createCicloFormativoMock.mockRejectedValue(new Error("CICLO_FORMATIVO_CODIGO_RESERVADO"));

    const response = await POST({
      json: vi.fn().mockResolvedValue({
        nombre: "Mi DAM",
        codigo: "DAM",
      }),
    } as any);

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "Ese codigo esta reservado para un ciclo formativo base. Usa la restauracion de valores por defecto.",
    });
  });

  it("crea el ciclo y revalida configuracion", async () => {
    createCicloFormativoMock.mockResolvedValue({
      id: 8,
      nombre: "Ciclo propio",
      codigo: "CP-1",
      activo: true,
    });

    const response = await POST({
      json: vi.fn().mockResolvedValue({
        nombre: "Ciclo propio",
        codigo: "CP-1",
      }),
    } as any);

    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({
      ok: true,
      data: {
        id: 8,
        nombre: "Ciclo propio",
        codigo: "CP-1",
        activo: true,
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/configuracion");
  });
});
