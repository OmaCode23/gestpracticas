import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

const {
  getAlumnosPaginatedMock,
  createAlumnoMock,
  getCursosAcademicosConfiguradosMock,
  getResultadosPorPaginaConfiguradosMock,
  importAlumnosMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  getAlumnosPaginatedMock: vi.fn(),
  createAlumnoMock: vi.fn(),
  getCursosAcademicosConfiguradosMock: vi.fn(),
  getResultadosPorPaginaConfiguradosMock: vi.fn(),
  importAlumnosMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/modules/alumnos/actions/queries", () => ({
  getAlumnosPaginated: getAlumnosPaginatedMock,
}));

vi.mock("@/modules/alumnos/actions/mutations", () => ({
  createAlumno: createAlumnoMock,
}));

vi.mock("@/modules/settings/actions/queries", () => ({
  getCursosAcademicosConfigurados: getCursosAcademicosConfiguradosMock,
  getResultadosPorPaginaConfigurados: getResultadosPorPaginaConfiguradosMock,
}));

vi.mock("@/modules/importexport/actions/import", () => ({
  importAlumnos: importAlumnosMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

describe("GET /api/alumnos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getResultadosPorPaginaConfiguradosMock.mockResolvedValue(10);
  });

  it("rechaza filtros invalidos", async () => {
    const response = await GET({
      nextUrl: {
        searchParams: new URLSearchParams({
          page: "0",
        }),
      },
    } as any);

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "Number must be greater than 0",
    });
  });

  it("usa el perPage configurado por defecto y devuelve el listado", async () => {
    getAlumnosPaginatedMock.mockResolvedValue({
      items: [{ id: 1, nombre: "Ana" }],
      total: 1,
      page: 2,
      perPage: 12,
      totalPages: 1,
    });
    getResultadosPorPaginaConfiguradosMock.mockResolvedValue(12);

    const response = await GET({
      nextUrl: {
        searchParams: new URLSearchParams({
          ciclo: "DAM",
          curso: "2025-2026",
          search: "ana",
          page: "2",
        }),
      },
    } as any);

    const body = await response.json();

    expect(getAlumnosPaginatedMock).toHaveBeenCalledWith({
      ciclo: "DAM",
      curso: "2025-2026",
      search: "ana",
      page: 2,
      perPage: 12,
      all: false,
    });
    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: {
        items: [{ id: 1, nombre: "Ana" }],
        total: 1,
        page: 2,
        perPage: 12,
        totalPages: 1,
      },
    });
  });

  it("permite pedir todos los alumnos con all=true", async () => {
    getAlumnosPaginatedMock.mockResolvedValue({
      items: [{ id: 1, nombre: "Ana" }, { id: 2, nombre: "Luis" }],
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

    expect(getAlumnosPaginatedMock).toHaveBeenCalledWith({
      ciclo: undefined,
      curso: undefined,
      search: undefined,
      page: 1,
      perPage: 10,
      all: true,
    });
    expect(response.status).toBe(200);
  });
});

describe("POST /api/alumnos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCursosAcademicosConfiguradosMock.mockResolvedValue(["2025-2026", "2026-2027"]);
  });

  it("rechaza cuerpos invalidos", async () => {
    const response = await POST({
      json: vi.fn().mockResolvedValue({
        nombre: "",
      }),
    } as any);

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
  });

  it("rechaza cursos no configurados", async () => {
    const response = await POST({
      json: vi.fn().mockResolvedValue({
        nombre: "Ana",
        nia: "A-1",
        nif: "",
        nuss: "",
        telefono: "612345678",
        email: "ana@mail.com",
        cicloFormativoId: 4,
        cursoCiclo: 1,
        curso: "2024-2025",
      }),
    } as any);

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "El curso no es valido.",
    });
  });

  it("devuelve 400 si el ciclo formativo no es valido", async () => {
    createAlumnoMock.mockRejectedValue(new Error("CICLO_FORMATIVO_INVALIDO"));

    const response = await POST({
      json: vi.fn().mockResolvedValue({
        nombre: "Ana",
        nia: "A-1",
        nif: "",
        nuss: "",
        telefono: "612345678",
        email: "ana@mail.com",
        cicloFormativoId: 999,
        cursoCiclo: 1,
        curso: "2025-2026",
      }),
    } as any);

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "El ciclo formativo no es valido.",
    });
  });

  it("devuelve 409 cuando ya existe un NIF o NUSS", async () => {
    createAlumnoMock.mockRejectedValue({
      code: "P2002",
      meta: { target: ["nif"] },
    });

    const nifResponse = await POST({
      json: vi.fn().mockResolvedValue({
        nombre: "Ana",
        nia: "A-1",
        nif: "12345678Z",
        nuss: "",
        telefono: "612345678",
        email: "ana@mail.com",
        cicloFormativoId: 4,
        cursoCiclo: 1,
        curso: "2025-2026",
      }),
    } as any);
    const nifBody = await nifResponse.json();

    createAlumnoMock.mockRejectedValueOnce({
      code: "P2002",
      meta: { target: ["nuss"] },
    });

    const nussResponse = await POST({
      json: vi.fn().mockResolvedValue({
        nombre: "Ana",
        nia: "A-1",
        nif: "",
        nuss: "123456789012",
        telefono: "612345678",
        email: "ana@mail.com",
        cicloFormativoId: 4,
        cursoCiclo: 1,
        curso: "2025-2026",
      }),
    } as any);
    const nussBody = await nussResponse.json();

    expect(nifResponse.status).toBe(409);
    expect(nifBody).toEqual({
      ok: false,
      error: "Ya existe un alumno con ese NIF",
    });
    expect(nussResponse.status).toBe(409);
    expect(nussBody).toEqual({
      ok: false,
      error: "Ya existe un alumno con ese NUSS",
    });
  });

  it("importa alumnos cuando llega body por filas", async () => {
    importAlumnosMock.mockResolvedValue({
      ok: true,
      message: "Importacion completada (2 registros).",
      importedCount: 2,
    });

    const response = await POST({
      json: vi.fn().mockResolvedValue({
        rows: [{ nia: "A-1" }, { nia: "A-2" }],
      }),
    } as any);

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
    expect(revalidatePathMock).toHaveBeenCalledWith("/alumnos");
    expect(revalidatePathMock).toHaveBeenCalledWith("/importexport");
  });

  it("propaga incidencias de importacion", async () => {
    importAlumnosMock.mockResolvedValue({
      ok: false,
      message: "Importacion cancelada.",
      importedCount: 0,
      errors: ["Fila 2: error."],
    });

    const response = await POST({
      json: vi.fn().mockResolvedValue({
        rows: [{ nia: "A-1" }],
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

  it("crea el alumno y revalida rutas", async () => {
    createAlumnoMock.mockResolvedValue({
      id: 5,
      nombre: "Ana",
    });

    const response = await POST({
      json: vi.fn().mockResolvedValue({
        nombre: "Ana",
        nia: "A-1",
        nif: "",
        nuss: "",
        telefono: "612345678",
        email: "ana@mail.com",
        cicloFormativoId: 4,
        cursoCiclo: 1,
        curso: "2025-2026",
      }),
    } as any);

    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({
      ok: true,
      data: {
        id: 5,
        nombre: "Ana",
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
    expect(revalidatePathMock).toHaveBeenCalledWith("/alumnos");
  });
});
