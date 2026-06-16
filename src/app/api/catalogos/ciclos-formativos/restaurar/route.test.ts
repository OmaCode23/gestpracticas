import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const { restoreCiclosFormativosBaseMock, revalidatePathMock, revalidateTagMock } = vi.hoisted(() => ({
  restoreCiclosFormativosBaseMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  revalidateTagMock: vi.fn(),
}));

const { ensureApiUserMock } = vi.hoisted(() => ({
  ensureApiUserMock: vi.fn(),
}));

vi.mock("@/modules/catalogos/actions/mutations", () => ({
  restoreCiclosFormativosBase: restoreCiclosFormativosBaseMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
  revalidateTag: revalidateTagMock,
}));

vi.mock("@/modules/auth/api", () => ({
  ensureApiUser: ensureApiUserMock,
}));

describe("POST /api/catalogos/ciclos-formativos/restaurar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ensureApiUserMock.mockResolvedValue(null);
  });

  it("devuelve 403 si el usuario no pertenece al personal", async () => {
    ensureApiUserMock.mockResolvedValueOnce(
      Response.json({ ok: false, error: "No autorizado." }, { status: 403 })
    );

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({
      ok: false,
      error: "No autorizado.",
    });
    expect(restoreCiclosFormativosBaseMock).not.toHaveBeenCalled();
  });

  it("devuelve 400 si hay conflicto con codigos reservados en uso", async () => {
    restoreCiclosFormativosBaseMock.mockRejectedValue({
      message: "CICLO_FORMATIVO_BASE_CONFLICT",
      meta: { codigos: ["DAM"] },
    });

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "No se puede restaurar el catalogo base porque existen ciclos personalizados en uso con codigos reservados: DAM.",
    });
  });

  it("restaura y revalida configuracion", async () => {
    restoreCiclosFormativosBaseMock.mockResolvedValue({
      total: 2,
      items: [{ id: 1, codigo: "DAM" }],
      deletedCustomCount: 1,
    });

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(revalidatePathMock).toHaveBeenCalledWith("/configuracion");
  });
});
