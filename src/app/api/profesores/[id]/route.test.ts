import { beforeEach, describe, expect, it, vi } from "vitest";
import { AcademicEmailConflictError, EmailDomainNotAllowedError } from "@/shared/identity/academic-email";
import { PATCH } from "./route";

const {
  getProfesorByIdMock,
  updateProfesorMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  getProfesorByIdMock: vi.fn(),
  updateProfesorMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

const { ensureApiUserMock } = vi.hoisted(() => ({
  ensureApiUserMock: vi.fn(),
}));

vi.mock("@/modules/profesores/actions/queries", () => ({
  getProfesorById: getProfesorByIdMock,
}));

vi.mock("@/modules/profesores/actions/mutations", () => ({
  updateProfesor: updateProfesorMock,
  deleteProfesor: vi.fn(),
}));

vi.mock("@/modules/auth/api", () => ({
  ensureApiUser: ensureApiUserMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

describe("PATCH /api/profesores/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ensureApiUserMock.mockResolvedValue(null);
  });

  it("devuelve 400 si el dominio del email no esta permitido al actualizar", async () => {
    getProfesorByIdMock.mockResolvedValue({ id: 3 });
    updateProfesorMock.mockRejectedValue(new EmailDomainNotAllowedError("PROFESOR"));

    const response = await PATCH(
      {
        json: vi.fn().mockResolvedValue({ email: "ana.tutor@gmail.com" }),
      } as any,
      { params: { id: "3" } }
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "El dominio del email no está permitido para profesores.",
    });
  });

  it("devuelve 409 si el email ya pertenece a un alumno", async () => {
    getProfesorByIdMock.mockResolvedValue({ id: 3 });
    updateProfesorMock.mockRejectedValue(
      new AcademicEmailConflictError("ALUMNO", "other-entity")
    );

    const response = await PATCH(
      {
        json: vi.fn().mockResolvedValue({ email: "ana.tutor@mail.com" }),
      } as any,
      { params: { id: "3" } }
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({
      ok: false,
      error: "Ese email ya esta asignado a un alumno.",
    });
  });

  it("devuelve 409 si la sincronizacion del usuario falla con un error rehidratado", async () => {
    getProfesorByIdMock.mockResolvedValue({ id: 3 });
    updateProfesorMock.mockRejectedValue({
      code: "ACADEMIC_USER_EMAIL_TAKEN",
    });

    const response = await PATCH(
      {
        json: vi.fn().mockResolvedValue({ email: "ana.tutor@mail.com" }),
      } as any,
      { params: { id: "3" } }
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({
      ok: false,
      error: "No se pudo sincronizar la cuenta de acceso con ese email.",
    });
  });
});
