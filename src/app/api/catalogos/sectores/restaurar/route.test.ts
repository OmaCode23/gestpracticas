import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const { restoreSectoresBaseMock, revalidatePathMock, revalidateTagMock } = vi.hoisted(() => ({
  restoreSectoresBaseMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  revalidateTagMock: vi.fn(),
}));

vi.mock("@/modules/catalogos/actions/mutations", () => ({
  restoreSectoresBase: restoreSectoresBaseMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
  revalidateTag: revalidateTagMock,
}));

describe("POST /api/catalogos/sectores/restaurar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("restaura sectores base y revalida configuracion", async () => {
    restoreSectoresBaseMock.mockResolvedValue({
      total: 2,
      items: [{ id: 1, nombre: "Tecnologia" }],
      deletedCustomCount: 1,
    });

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: {
        total: 2,
        items: [{ id: 1, nombre: "Tecnologia" }],
        deletedCustomCount: 1,
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/configuracion");
  });

  it("devuelve 500 si falla la restauracion", async () => {
    restoreSectoresBaseMock.mockRejectedValue(new Error("boom"));

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      ok: false,
      error: "Error al restaurar los sectores iniciales",
    });
  });
});
