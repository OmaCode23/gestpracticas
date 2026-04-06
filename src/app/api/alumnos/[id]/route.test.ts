import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, GET, PATCH } from "./route";

const {
  getAlumnoByIdMock,
  updateAlumnoMock,
  deleteAlumnoMock,
  getCursosAcademicosConfiguradosMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  getAlumnoByIdMock: vi.fn(),
  updateAlumnoMock: vi.fn(),
  deleteAlumnoMock: vi.fn(),
  getCursosAcademicosConfiguradosMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/modules/alumnos/actions/queries", () => ({
  getAlumnoById: getAlumnoByIdMock,
}));

vi.mock("@/modules/alumnos/actions/mutations", () => ({
  updateAlumno: updateAlumnoMock,
  deleteAlumno: deleteAlumnoMock,
}));

vi.mock("@/modules/settings/actions/queries", () => ({
  getCursosAcademicosConfigurados: getCursosAcademicosConfiguradosMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

describe("GET /api/alumnos/[id]", () => {
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

  it("devuelve 404 si el alumno no existe", async () => {
    getAlumnoByIdMock.mockResolvedValue(null);

    const response = await GET({} as any, { params: { id: "3" } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      ok: false,
      error: "No encontrado",
    });
  });
});

describe("PATCH /api/alumnos/[id]", () => {
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
      error: "El curso no es valido.",
    });
  });

  it("devuelve 404 si el alumno no existe", async () => {
    getAlumnoByIdMock.mockResolvedValue(null);

    const response = await PATCH(
      {
        json: vi.fn().mockResolvedValue({ nombre: "Ana" }),
      } as any,
      { params: { id: "3" } }
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      ok: false,
      error: "No encontrado",
    });
  });

  it("devuelve 400 cuando el ciclo formativo no es valido", async () => {
    getAlumnoByIdMock.mockResolvedValue({ id: 3 });
    updateAlumnoMock.mockRejectedValue(new Error("CICLO_FORMATIVO_INVALIDO"));

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

  it("devuelve 409 para duplicados por NIA", async () => {
    getAlumnoByIdMock.mockResolvedValue({ id: 3 });
    updateAlumnoMock.mockRejectedValue({
      code: "P2002",
      meta: { target: ["nia"] },
    });

    const response = await PATCH(
      {
        json: vi.fn().mockResolvedValue({ nia: "A-1" }),
      } as any,
      { params: { id: "3" } }
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({
      ok: false,
      error: "Ya existe un alumno con ese NIA",
    });
  });

  it("actualiza y revalida rutas", async () => {
    getAlumnoByIdMock.mockResolvedValue({ id: 3 });
    updateAlumnoMock.mockResolvedValue({ id: 3, nombre: "Ana Actualizada" });

    const response = await PATCH(
      {
        json: vi.fn().mockResolvedValue({ nombre: "Ana Actualizada" }),
      } as any,
      { params: { id: "3" } }
    );
    const body = await response.json();

    expect(updateAlumnoMock).toHaveBeenCalledWith(3, { nombre: "Ana Actualizada" });
    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: { id: 3, nombre: "Ana Actualizada" },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
    expect(revalidatePathMock).toHaveBeenCalledWith("/alumnos");
  });
});

describe("DELETE /api/alumnos/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve 404 si el alumno no existe", async () => {
    getAlumnoByIdMock.mockResolvedValue(null);

    const response = await DELETE({} as any, { params: { id: "3" } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      ok: false,
      error: "No encontrado",
    });
  });

  it("devuelve 409 si el alumno esta en una formacion", async () => {
    getAlumnoByIdMock.mockResolvedValue({ id: 3 });
    deleteAlumnoMock.mockRejectedValue({ code: "P2003" });

    const response = await DELETE({} as any, { params: { id: "3" } });
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({
      ok: false,
      error: "No se puede eliminar el alumno porque esta incluido en una formacion.",
    });
  });

  it("elimina y revalida rutas", async () => {
    getAlumnoByIdMock.mockResolvedValue({ id: 3 });
    deleteAlumnoMock.mockResolvedValue(undefined);

    const response = await DELETE({} as any, { params: { id: "3" } });
    const body = await response.json();

    expect(deleteAlumnoMock).toHaveBeenCalledWith(3);
    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: null,
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
    expect(revalidatePathMock).toHaveBeenCalledWith("/alumnos");
  });
});
