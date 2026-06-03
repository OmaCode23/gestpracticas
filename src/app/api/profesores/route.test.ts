import { beforeEach, describe, expect, it, vi } from "vitest";
import { AcademicEmailConflictError, EmailDomainNotAllowedError } from "@/shared/identity/academic-email";
import { GET, POST } from "./route";

const {
  getProfesoresMock,
  createProfesorMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  getProfesoresMock: vi.fn(),
  createProfesorMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

const { ensureApiUserMock } = vi.hoisted(() => ({
  ensureApiUserMock: vi.fn(),
}));

vi.mock("@/modules/profesores/actions/queries", () => ({
  getProfesores: getProfesoresMock,
}));

vi.mock("@/modules/profesores/actions/mutations", () => ({
  createProfesor: createProfesorMock,
}));

vi.mock("@/modules/auth/api", () => ({
  ensureApiUser: ensureApiUserMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

describe("GET /api/profesores", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ensureApiUserMock.mockResolvedValue(null);
  });

  it("devuelve el listado paginado", async () => {
    getProfesoresMock.mockResolvedValue({
      items: [{ id: 1, nombre: "Ana Tutor" }],
      total: 1,
      page: 1,
      perPage: 10,
      totalPages: 1,
    });

    const response = await GET({
      nextUrl: {
        searchParams: new URLSearchParams({
          search: "ana",
        }),
      },
    } as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
  });
});

describe("POST /api/profesores", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ensureApiUserMock.mockResolvedValue(null);
  });

  it("devuelve 400 si el dominio del email no esta permitido para profesores", async () => {
    createProfesorMock.mockRejectedValue(new EmailDomainNotAllowedError("PROFESOR"));

    const response = await POST({
      json: vi.fn().mockResolvedValue({
        nombre: "Ana Tutor",
        nif: "",
        especialidad: "",
        telefono: "",
        email: "ana.tutor@gmail.com",
        cicloFormativoId: null,
      }),
    } as any);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "El dominio del email no está permitido para profesores.",
    });
  });

  it("rechaza email ya existente en profesores", async () => {
    createProfesorMock.mockRejectedValue(
      new AcademicEmailConflictError("PROFESOR", "same-entity")
    );

    const response = await POST({
      json: vi.fn().mockResolvedValue({
        nombre: "Ana Tutor",
        nif: "",
        especialidad: "",
        telefono: "",
        email: "ana.tutor@mail.com",
        cicloFormativoId: null,
      }),
    } as any);
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({
      ok: false,
      error: "Ya existe un profesor con ese email.",
    });
  });

  it("rechaza email ya asignado a un alumno", async () => {
    createProfesorMock.mockRejectedValue(
      new AcademicEmailConflictError("ALUMNO", "other-entity")
    );

    const response = await POST({
      json: vi.fn().mockResolvedValue({
        nombre: "Ana Tutor",
        nif: "",
        especialidad: "",
        telefono: "",
        email: "ana.tutor@mail.com",
        cicloFormativoId: null,
      }),
    } as any);
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({
      ok: false,
      error: "Ese email ya esta asignado a un alumno.",
    });
  });
});
