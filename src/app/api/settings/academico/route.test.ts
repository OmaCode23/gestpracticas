import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, PUT, dynamic } from "./route";
import { CACHE_TAGS } from "@/shared/cache";

const {
  getConfiguracionAcademicaMock,
  saveConfiguracionAcademicaMock,
  revalidatePathMock,
  revalidateTagMock,
} = vi.hoisted(() => ({
  getConfiguracionAcademicaMock: vi.fn(),
  saveConfiguracionAcademicaMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  revalidateTagMock: vi.fn(),
}));

const { ensureApiUserMock, ensureApiAdminMock } = vi.hoisted(() => ({
  ensureApiUserMock: vi.fn(),
  ensureApiAdminMock: vi.fn(),
}));

vi.mock("@/modules/settings/actions/queries", () => ({
  getConfiguracionAcademica: getConfiguracionAcademicaMock,
}));

vi.mock("@/modules/settings/actions/mutations", () => ({
  saveConfiguracionAcademica: saveConfiguracionAcademicaMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
  revalidateTag: revalidateTagMock,
}));

vi.mock("@/modules/auth/api", () => ({
  ensureApiUser: ensureApiUserMock,
  ensureApiAdmin: ensureApiAdminMock,
}));

describe("GET /api/settings/academico", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ensureApiUserMock.mockResolvedValue(null);
    ensureApiAdminMock.mockResolvedValue(null);
  });

  it("fuerza modo dinamico para evitar regresiones del build de produccion", () => {
    expect(dynamic).toBe("force-dynamic");
  });

  it("devuelve la configuracion academica", async () => {
    getConfiguracionAcademicaMock.mockResolvedValue({
      mesCambioCurso: 9,
      numeroCursosVisibles: 3,
      modoHistorico: false,
      resultadosPorPagina: 10,
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: {
        mesCambioCurso: 9,
        numeroCursosVisibles: 3,
        modoHistorico: false,
        resultadosPorPagina: 10,
      },
    });
  });

  it("devuelve 500 si falla la consulta", async () => {
    getConfiguracionAcademicaMock.mockRejectedValue(new Error("boom"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      ok: false,
      error: "Error al obtener la configuracion academica.",
    });
  });

  it("devuelve 401 si la ruta requiere autenticacion y falta sesion", async () => {
    ensureApiUserMock.mockResolvedValueOnce(
      Response.json({ ok: false, error: "No autenticado." }, { status: 401 })
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      ok: false,
      error: "No autenticado.",
    });
    expect(getConfiguracionAcademicaMock).not.toHaveBeenCalled();
  });
});

describe("PUT /api/settings/academico", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ensureApiUserMock.mockResolvedValue(null);
    ensureApiAdminMock.mockResolvedValue(null);
  });

  it("devuelve 403 si la capa de auth exige rol admin", async () => {
    ensureApiAdminMock.mockResolvedValueOnce(
      Response.json({ ok: false, error: "No autorizado." }, { status: 403 })
    );

    const response = await PUT({
      json: vi.fn().mockResolvedValue({
        mesCambioCurso: 9,
        numeroCursosVisibles: 3,
        modoHistorico: false,
        resultadosPorPagina: 10,
      }),
    } as any);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({
      ok: false,
      error: "No autorizado.",
    });
    expect(saveConfiguracionAcademicaMock).not.toHaveBeenCalled();
  });

  it("rechaza cuerpos invalidos", async () => {
    const response = await PUT({
      json: vi.fn().mockResolvedValue({
        mesCambioCurso: 13,
        numeroCursosVisibles: 3,
        modoHistorico: false,
        resultadosPorPagina: 10,
      }),
    } as any);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "El mes de cambio de curso debe estar entre 1 y 12.",
    });
  });

  it("devuelve 400 si la nueva configuracion invalida cursos existentes", async () => {
    const error = new Error("Cursos invalidos");
    (error as Error & { code?: string }).code = "CURSOS_CONFIG_INVALIDA";
    saveConfiguracionAcademicaMock.mockRejectedValue(error);

    const response = await PUT({
      json: vi.fn().mockResolvedValue({
        mesCambioCurso: 9,
        numeroCursosVisibles: 2,
        modoHistorico: false,
        resultadosPorPagina: 10,
      }),
    } as any);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "Cursos invalidos",
    });
  });

  it("guarda la configuracion y revalida rutas", async () => {
    saveConfiguracionAcademicaMock.mockResolvedValue({
      mesCambioCurso: 9,
      numeroCursosVisibles: 4,
      modoHistorico: true,
      resultadosPorPagina: 20,
    });

    const response = await PUT({
      json: vi.fn().mockResolvedValue({
        mesCambioCurso: 9,
        numeroCursosVisibles: 4,
        modoHistorico: true,
        resultadosPorPagina: 20,
      }),
    } as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: {
        mesCambioCurso: 9,
        numeroCursosVisibles: 4,
        modoHistorico: true,
        resultadosPorPagina: 20,
      },
    });
    expect(revalidateTagMock).toHaveBeenCalledWith(CACHE_TAGS.settings);
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
    expect(revalidatePathMock).toHaveBeenCalledWith("/alumnos");
    expect(revalidatePathMock).toHaveBeenCalledWith("/formacion");
    expect(revalidatePathMock).toHaveBeenCalledWith("/configuracion");
  });

  it("acepta el payload usado al restaurar cursos academicos por defecto", async () => {
    saveConfiguracionAcademicaMock.mockResolvedValue({
      mesCambioCurso: 9,
      numeroCursosVisibles: 3,
      modoHistorico: false,
      resultadosPorPagina: 20,
    });

    const response = await PUT({
      json: vi.fn().mockResolvedValue({
        mesCambioCurso: 9,
        numeroCursosVisibles: 3,
        modoHistorico: false,
        resultadosPorPagina: 20,
      }),
    } as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(saveConfiguracionAcademicaMock).toHaveBeenCalledWith({
      mesCambioCurso: 9,
      numeroCursosVisibles: 3,
      modoHistorico: false,
      resultadosPorPagina: 20,
    });
    expect(body).toEqual({
      ok: true,
      data: {
        mesCambioCurso: 9,
        numeroCursosVisibles: 3,
        modoHistorico: false,
        resultadosPorPagina: 20,
      },
    });
  });

  it("acepta el payload usado al restaurar resultados por pagina por defecto", async () => {
    saveConfiguracionAcademicaMock.mockResolvedValue({
      mesCambioCurso: 8,
      numeroCursosVisibles: 4,
      modoHistorico: false,
      resultadosPorPagina: 10,
    });

    const response = await PUT({
      json: vi.fn().mockResolvedValue({
        mesCambioCurso: 8,
        numeroCursosVisibles: 4,
        modoHistorico: false,
        resultadosPorPagina: 10,
      }),
    } as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(saveConfiguracionAcademicaMock).toHaveBeenCalledWith({
      mesCambioCurso: 8,
      numeroCursosVisibles: 4,
      modoHistorico: false,
      resultadosPorPagina: 10,
    });
    expect(body).toEqual({
      ok: true,
      data: {
        mesCambioCurso: 8,
        numeroCursosVisibles: 4,
        modoHistorico: false,
        resultadosPorPagina: 10,
      },
    });
  });
});
