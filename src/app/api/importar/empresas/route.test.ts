import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "./route";

const { importEmpresasMock, revalidatePathMock } = vi.hoisted(() => ({
  importEmpresasMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/modules/importexport/actions/import", () => ({
  importEmpresas: importEmpresasMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

describe("POST /api/importar/empresas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rechaza body sin array de filas", async () => {
    const request = {
      json: vi.fn().mockResolvedValue({ rows: null }),
    } as any;

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "Debes enviar un array de filas para importar.",
      details: [],
    });
  });

  it("propaga errores de importacion con detalles", async () => {
    importEmpresasMock.mockResolvedValue({
      ok: false,
      message: "Importacion cancelada. Revisa 1 incidencia(s).",
      importedCount: 0,
      errors: ["Fila 2: error de prueba."],
    });

    const request = {
      json: vi.fn().mockResolvedValue({ rows: [{ cif: "B12345678" }] }),
    } as any;

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "Importacion cancelada. Revisa 1 incidencia(s).",
      details: ["Fila 2: error de prueba."],
    });
  });

  it("revalida rutas y devuelve exito cuando la importacion termina bien", async () => {
    importEmpresasMock.mockResolvedValue({
      ok: true,
      message: "Importacion completada (2 registros).",
      importedCount: 2,
    });

    const request = {
      json: vi.fn().mockResolvedValue({ rows: [{ cif: "B1" }, { cif: "B2" }] }),
    } as any;

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: {
        ok: true,
        message: "Importacion completada (2 registros).",
        importedCount: 2,
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
    expect(revalidatePathMock).toHaveBeenCalledWith("/empresas");
    expect(revalidatePathMock).toHaveBeenCalledWith("/importexport");
  });
});
