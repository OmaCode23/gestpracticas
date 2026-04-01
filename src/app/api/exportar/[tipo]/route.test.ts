import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const { getEmpresasExportMock, getAlumnosExportMock, getFormacionExportMock, createImportExportLogMock } =
  vi.hoisted(() => ({
    getEmpresasExportMock: vi.fn(),
    getAlumnosExportMock: vi.fn(),
    getFormacionExportMock: vi.fn(),
    createImportExportLogMock: vi.fn(),
  }));

vi.mock("@/modules/importexport/actions/export", () => ({
  getEmpresasExport: getEmpresasExportMock,
  getAlumnosExport: getAlumnosExportMock,
  getFormacionExport: getFormacionExportMock,
}));

vi.mock("@/modules/importexport/actions/logs", () => ({
  createImportExportLog: createImportExportLogMock,
}));

describe("GET /api/exportar/[tipo]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rechaza tipos de exportacion desconocidos", async () => {
    const response = await GET({} as any, { params: { tipo: "desconocido" } });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: 'Exportacion no disponible para "desconocido".',
    });
  });

  it("exporta alumnos y registra el log", async () => {
    getAlumnosExportMock.mockResolvedValue([{ NIA: "NIA-01" }]);

    const response = await GET({} as any, { params: { tipo: "alumnos" } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: [{ NIA: "NIA-01" }],
    });
    expect(createImportExportLogMock).toHaveBeenCalledWith({
      entidad: "Alumnos",
      accion: "Exportacion",
      registros: 1,
      estado: "Completado",
      detalle: "1 registro(s) exportado(s) correctamente.",
    });
  });

  it("devuelve error 500 si falla la generacion del export", async () => {
    getEmpresasExportMock.mockRejectedValue(new Error("boom"));

    const response = await GET({} as any, { params: { tipo: "empresas" } });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      ok: false,
      error: "Error al exportar los datos",
    });
  });
});
