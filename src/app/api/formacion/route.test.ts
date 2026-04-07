import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

const {
  getFormacionesPaginatedMock,
  createFormacionMock,
  getCursosAcademicosConfiguradosMock,
  getResultadosPorPaginaConfiguradosMock,
  importFormacionesMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  getFormacionesPaginatedMock: vi.fn(),
  createFormacionMock: vi.fn(),
  getCursosAcademicosConfiguradosMock: vi.fn(),
  getResultadosPorPaginaConfiguradosMock: vi.fn(),
  importFormacionesMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/modules/formacion/actions/queries", () => ({
  getFormacionesPaginated: getFormacionesPaginatedMock,
}));

vi.mock("@/modules/formacion/actions/mutations", () => ({
  createFormacion: createFormacionMock,
}));

vi.mock("@/modules/settings/actions/queries", () => ({
  getCursosAcademicosConfigurados: getCursosAcademicosConfiguradosMock,
  getResultadosPorPaginaConfigurados: getResultadosPorPaginaConfiguradosMock,
}));

vi.mock("@/modules/importexport/actions/import", () => ({
  importFormaciones: importFormacionesMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

describe("GET /api/formacion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getResultadosPorPaginaConfiguradosMock.mockResolvedValue(10);
  });

  it("rechaza filtros invalidos", async () => {
    const response = await GET({
      nextUrl: {
        searchParams: new URLSearchParams({
          cursoCiclo: "3",
        }),
      },
    } as any);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
  });

  it("devuelve el listado con filtros y perPage configurado", async () => {
    getResultadosPorPaginaConfiguradosMock.mockResolvedValue(15);
    getFormacionesPaginatedMock.mockResolvedValue({
      items: [{ id: 1, curso: "2025-2026" }],
      total: 1,
      page: 2,
      perPage: 15,
      totalPages: 1,
    });

    const response = await GET({
      nextUrl: {
        searchParams: new URLSearchParams({
          curso: "2025-2026",
          ciclo: "DAM",
          cursoCiclo: "1",
          search: "ana",
          page: "2",
        }),
      },
    } as any);
    const body = await response.json();

    expect(getFormacionesPaginatedMock).toHaveBeenCalledWith({
      curso: "2025-2026",
      ciclo: "DAM",
      cursoCiclo: 1,
      search: "ana",
      page: 2,
      perPage: 15,
      all: false,
    });
    expect(response.status).toBe(200);
    expect(body.data.items).toEqual([{ id: 1, curso: "2025-2026" }]);
  });

  it("permite pedir todas las formaciones con all=true", async () => {
    getFormacionesPaginatedMock.mockResolvedValue({
      items: [{ id: 1 }, { id: 2 }],
      total: 2,
      page: 1,
      perPage: 2,
      totalPages: 1,
    });

    const response = await GET({
      nextUrl: {
        searchParams: new URLSearchParams({
          all: "true",
        }),
      },
    } as any);

    expect(getFormacionesPaginatedMock).toHaveBeenCalledWith({
      curso: undefined,
      ciclo: undefined,
      cursoCiclo: undefined,
      search: undefined,
      page: 1,
      perPage: 10,
      all: true,
    });
    expect(response.status).toBe(200);
  });
});

describe("POST /api/formacion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCursosAcademicosConfiguradosMock.mockResolvedValue(["2025-2026", "2026-2027"]);
  });

  it("rechaza cuerpos invalidos", async () => {
    const response = await POST({
      json: vi.fn().mockResolvedValue({
        curso: "",
      }),
    } as any);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
  });

  it("rechaza cursos no configurados", async () => {
    const response = await POST({
      json: vi.fn().mockResolvedValue({
        empresaId: 1,
        alumnoId: 2,
        curso: "2024-2025",
        periodo: "Marzo",
        descripcion: "",
        tutorLaboral: "",
        emailTutorLaboral: "",
      }),
    } as any);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "El curso no es valido",
    });
  });

  it("importa formaciones por filas y revalida", async () => {
    importFormacionesMock.mockResolvedValue({
      ok: true,
      message: "Importacion completada (1 registros).",
      importedCount: 1,
    });

    const response = await POST({
      json: vi.fn().mockResolvedValue({
        rows: [{ empresa: "Empresa Demo" }],
      }),
    } as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: {
        ok: true,
        message: "Importacion completada (1 registros).",
        importedCount: 1,
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
    expect(revalidatePathMock).toHaveBeenCalledWith("/formacion");
    expect(revalidatePathMock).toHaveBeenCalledWith("/importexport");
  });

  it("propaga errores de importacion", async () => {
    importFormacionesMock.mockResolvedValue({
      ok: false,
      message: "Importacion cancelada.",
      importedCount: 0,
      errors: ["Fila 2: error."],
    });

    const response = await POST({
      json: vi.fn().mockResolvedValue({
        rows: [{ empresa: "Empresa Demo" }],
      }),
    } as any);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "Importacion cancelada.",
      details: ["Fila 2: error."],
    });
  });

  it("crea la formacion y revalida", async () => {
    createFormacionMock.mockResolvedValue({
      id: 8,
      curso: "2025-2026",
    });

    const response = await POST({
      json: vi.fn().mockResolvedValue({
        empresaId: 1,
        alumnoId: 2,
        curso: "2025-2026",
        periodo: "Marzo",
        descripcion: "",
        tutorLaboral: "",
        emailTutorLaboral: "",
      }),
    } as any);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({
      ok: true,
      data: {
        id: 8,
        curso: "2025-2026",
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
    expect(revalidatePathMock).toHaveBeenCalledWith("/formacion");
  });
});
