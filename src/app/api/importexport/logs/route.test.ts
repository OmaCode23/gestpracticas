import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

const { getImportExportLogsMock, createImportExportLogMock, getResultadosPorPaginaConfiguradosMock } =
  vi.hoisted(() => ({
    getImportExportLogsMock: vi.fn(),
    createImportExportLogMock: vi.fn(),
    getResultadosPorPaginaConfiguradosMock: vi.fn(),
  }));

vi.mock("@/modules/importexport/actions/logs", () => ({
  createImportExportLog: createImportExportLogMock,
  getImportExportLogs: getImportExportLogsMock,
}));

vi.mock("@/modules/settings/actions/queries", () => ({
  getResultadosPorPaginaConfigurados: getResultadosPorPaginaConfiguradosMock,
}));

describe("GET /api/importexport/logs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getResultadosPorPaginaConfiguradosMock.mockResolvedValue(12);
  });

  it("usa el fallback de settings cuando no se informa limit", async () => {
    getImportExportLogsMock.mockResolvedValue({
      items: [
        {
          id: 1,
          entidad: "Empresas",
          accion: "Importacion",
          registros: 2,
          estado: "Completado",
          usuarioNombre: "Administrador",
          detalle: null,
          createdAt: new Date("2026-04-02T10:00:00.000Z"),
          usuario: null,
        },
      ],
      total: 1,
      page: 1,
      perPage: 12,
      totalPages: 1,
    });

    const response = await GET({
      nextUrl: {
        searchParams: new URLSearchParams({
          page: "1",
          entidad: "Empresas",
        }),
      },
    } as any);
    const body = await response.json();

    expect(getImportExportLogsMock).toHaveBeenCalledWith({
      page: 1,
      limit: 12,
      entidad: "Empresas",
      accion: undefined,
      estado: undefined,
    });
    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.perPage).toBe(12);
    expect(body.data.items[0].createdAt).toBe("2026-04-02T10:00:00.000Z");
  });
});

describe("POST /api/importexport/logs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rechaza logs sin datos obligatorios", async () => {
    const response = await POST({
      json: vi.fn().mockResolvedValue({
        entidad: "Empresas",
      }),
    } as any);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "Faltan datos obligatorios para registrar el log",
    });
  });

  it("crea un log correctamente", async () => {
    createImportExportLogMock.mockResolvedValue({
      id: 1,
      entidad: "Empresas",
      accion: "Exportacion",
    });

    const response = await POST({
      json: vi.fn().mockResolvedValue({
        entidad: "Empresas",
        accion: "Exportacion",
        registros: 3,
        estado: "Completado",
        detalle: "3 registro(s) exportado(s).",
      }),
    } as any);
    const body = await response.json();

    expect(createImportExportLogMock).toHaveBeenCalledWith({
      entidad: "Empresas",
      accion: "Exportacion",
      registros: 3,
      estado: "Completado",
      detalle: "3 registro(s) exportado(s).",
    });
    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: {
        id: 1,
        entidad: "Empresas",
        accion: "Exportacion",
      },
    });
  });
});
