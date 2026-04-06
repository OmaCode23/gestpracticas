import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, GET } from "./route";

const {
  prismaMock,
  readAllAlumnosCvMock,
  clearAllAlumnosCvMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  prismaMock: {
    $transaction: vi.fn(),
  },
  readAllAlumnosCvMock: vi.fn(),
  clearAllAlumnosCvMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/database/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/modules/alumnos/actions/cv", () => ({
  readAllAlumnosCv: readAllAlumnosCvMock,
  clearAllAlumnosCv: clearAllAlumnosCvMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

describe("GET /api/alumnos/cv", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (callback: (tx: object) => unknown) =>
      callback({ tx: true })
    );
  });

  it("devuelve 404 si no hay CVs", async () => {
    readAllAlumnosCvMock.mockResolvedValue(null);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      ok: false,
      error: "No hay CVs adjuntos para descargar.",
    });
  });

  it("devuelve el zip con cabeceras correctas", async () => {
    readAllAlumnosCvMock.mockResolvedValue({
      count: 2,
      zipBuffer: Buffer.from("zip"),
    });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/zip");
    expect(response.headers.get("Content-Disposition")).toContain("cvs_alumnos_");
    expect(Buffer.from(await response.arrayBuffer()).toString()).toBe("zip");
  });
});

describe("DELETE /api/alumnos/cv", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (callback: (tx: object) => unknown) =>
      callback({ tx: true })
    );
  });

  it("elimina todos los CVs y revalida rutas", async () => {
    clearAllAlumnosCvMock.mockResolvedValue(3);

    const response = await DELETE();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: { deletedCount: 3 },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
    expect(revalidatePathMock).toHaveBeenCalledWith("/alumnos");
  });
});
