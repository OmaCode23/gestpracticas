import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, GET, POST } from "./route";

const {
  prismaMock,
  getPortalAlumnoActualMock,
  saveAlumnoCvMock,
  readAlumnoCvMock,
  clearAlumnoCvMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  prismaMock: {
    $transaction: vi.fn(),
  },
  getPortalAlumnoActualMock: vi.fn(),
  saveAlumnoCvMock: vi.fn(),
  readAlumnoCvMock: vi.fn(),
  clearAlumnoCvMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/database/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/modules/portal-alumno/actions/queries", () => ({
  getPortalAlumnoActual: getPortalAlumnoActualMock,
}));

vi.mock("@/modules/alumnos/actions/cv", () => ({
  ALUMNO_CV_MAX_BYTES: 500 * 1024,
  saveAlumnoCv: saveAlumnoCvMock,
  readAlumnoCv: readAlumnoCvMock,
  clearAlumnoCv: clearAlumnoCvMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

describe("POST /api/portal-alumno/cv", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPortalAlumnoActualMock.mockResolvedValue({ id: 7 });
    prismaMock.$transaction.mockImplementation(async (callback: (tx: object) => unknown) =>
      callback({ tx: true })
    );
  });

  it("rechaza cuando no llega archivo", async () => {
    const response = await POST({
      formData: vi.fn().mockResolvedValue({
        get: vi.fn().mockReturnValue(null),
      }),
    } as any);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "Debes adjuntar un archivo.",
    });
  });

  it("guarda el CV del alumno autenticado y revalida el portal", async () => {
    const file = new File([Buffer.from("pdf")], "cv.pdf", { type: "application/pdf" });

    const response = await POST({
      formData: vi.fn().mockResolvedValue({
        get: vi.fn().mockReturnValue(file),
      }),
    } as any);
    const body = await response.json();

    expect(saveAlumnoCvMock).toHaveBeenCalledWith(
      expect.objectContaining({
        alumnoId: 7,
        fileName: "cv.pdf",
      })
    );
    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: { maxBytes: 512000 },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/portal-alumno");
    expect(revalidatePathMock).toHaveBeenCalledWith("/portal-alumno/cv");
  });
});

describe("GET /api/portal-alumno/cv", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPortalAlumnoActualMock.mockResolvedValue({ id: 7 });
    prismaMock.$transaction.mockImplementation(async (callback: (tx: object) => unknown) =>
      callback({ tx: true })
    );
  });

  it("devuelve 404 si no hay CV", async () => {
    readAlumnoCvMock.mockResolvedValue(null);

    const response = await GET({} as any);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      ok: false,
      error: "El alumno no tiene CV adjunto.",
    });
  });

  it("devuelve el archivo del alumno autenticado con cabeceras correctas", async () => {
    readAlumnoCvMock.mockResolvedValue({
      fileName: "cv portal.pdf",
      mimeType: "application/pdf",
      size: 3,
      buffer: Buffer.from("pdf"),
    });

    const response = await GET({} as any);

    expect(readAlumnoCvMock).toHaveBeenCalledWith({ tx: true }, 7);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toBe(
      'inline; filename="cv%20portal.pdf"'
    );
    expect(Buffer.from(await response.arrayBuffer()).toString()).toBe("pdf");
  });
});

describe("DELETE /api/portal-alumno/cv", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPortalAlumnoActualMock.mockResolvedValue({ id: 7 });
    prismaMock.$transaction.mockImplementation(async (callback: (tx: object) => unknown) =>
      callback({ tx: true })
    );
  });

  it("elimina el CV del alumno autenticado y revalida el portal", async () => {
    const response = await DELETE({} as any);
    const body = await response.json();

    expect(clearAlumnoCvMock).toHaveBeenCalledWith({ tx: true }, 7);
    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: null,
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/portal-alumno");
    expect(revalidatePathMock).toHaveBeenCalledWith("/portal-alumno/cv");
  });
});
