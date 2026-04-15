import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, GET, POST } from "./route";

const {
  prismaMock,
  getAlumnoByIdMock,
  saveAlumnoCvMock,
  readAlumnoCvMock,
  clearAlumnoCvMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  prismaMock: {
    $transaction: vi.fn(),
  },
  getAlumnoByIdMock: vi.fn(),
  saveAlumnoCvMock: vi.fn(),
  readAlumnoCvMock: vi.fn(),
  clearAlumnoCvMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/database/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/modules/alumnos/actions/queries", () => ({
  getAlumnoById: getAlumnoByIdMock,
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

describe("POST /api/alumnos/[id]/cv", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    saveAlumnoCvMock.mockReset();
    prismaMock.$transaction.mockImplementation(async (callback: (tx: object) => unknown) =>
      callback({ tx: true })
    );
  });

  it("rechaza ids invalidos", async () => {
    const response = await POST({} as any, { params: { id: "0" } });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "ID invalido.",
    });
  });

  it("devuelve 404 si el alumno no existe", async () => {
    getAlumnoByIdMock.mockResolvedValue(null);

    const response = await POST({} as any, { params: { id: "4" } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      ok: false,
      error: "Alumno no encontrado.",
    });
  });

  it("rechaza cuando no llega archivo", async () => {
    getAlumnoByIdMock.mockResolvedValue({ id: 4 });

    const response = await POST(
      {
        formData: vi.fn().mockResolvedValue({
          get: vi.fn().mockReturnValue(null),
        }),
      } as any,
      { params: { id: "4" } }
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "Debes adjuntar un archivo.",
    });
  });

  it("devuelve 400 si el tipo no es valido", async () => {
    getAlumnoByIdMock.mockResolvedValue({ id: 4 });
    saveAlumnoCvMock.mockRejectedValue(new Error("CV_MIME_TYPE_INVALIDO"));
    const file = new File(["hola"], "cv.txt", { type: "text/plain" });

    const response = await POST(
      {
        formData: vi.fn().mockResolvedValue({
          get: vi.fn().mockReturnValue(file),
        }),
      } as any,
      { params: { id: "4" } }
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "Solo se admiten archivos PDF.",
    });
  });

  it("guarda el CV y revalida rutas", async () => {
    getAlumnoByIdMock.mockResolvedValue({ id: 4 });
    saveAlumnoCvMock.mockResolvedValue(undefined);
    const file = new File([Buffer.from("pdf")], "cv.pdf", { type: "application/pdf" });

    const response = await POST(
      {
        formData: vi.fn().mockResolvedValue({
          get: vi.fn().mockReturnValue(file),
        }),
      } as any,
      { params: { id: "4" } }
    );
    const body = await response.json();

    expect(saveAlumnoCvMock).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: { maxBytes: 512000 },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
    expect(revalidatePathMock).toHaveBeenCalledWith("/alumnos");
  });
});

describe("GET /api/alumnos/[id]/cv", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (callback: (tx: object) => unknown) =>
      callback({ tx: true })
    );
  });

  it("devuelve 404 si no hay CV", async () => {
    readAlumnoCvMock.mockResolvedValue(null);

    const response = await GET({} as any, { params: { id: "4" } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      ok: false,
      error: "El alumno no tiene CV adjunto.",
    });
  });

  it("devuelve el archivo con cabeceras correctas", async () => {
    readAlumnoCvMock.mockResolvedValue({
      fileName: "cv alumno.pdf",
      mimeType: "application/pdf",
      size: 3,
      buffer: Buffer.from("pdf"),
    });

    const response = await GET({} as any, { params: { id: "4" } });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toBe(
      'inline; filename="cv%20alumno.pdf"'
    );
    expect(Buffer.from(await response.arrayBuffer()).toString()).toBe("pdf");
  });
});

describe("DELETE /api/alumnos/[id]/cv", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (callback: (tx: object) => unknown) =>
      callback({ tx: true })
    );
  });

  it("devuelve 404 si el alumno no existe", async () => {
    getAlumnoByIdMock.mockResolvedValue(null);

    const response = await DELETE({} as any, { params: { id: "4" } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      ok: false,
      error: "Alumno no encontrado.",
    });
  });

  it("elimina el CV y revalida rutas", async () => {
    getAlumnoByIdMock.mockResolvedValue({ id: 4 });

    const response = await DELETE({} as any, { params: { id: "4" } });
    const body = await response.json();

    expect(clearAlumnoCvMock).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: null,
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
    expect(revalidatePathMock).toHaveBeenCalledWith("/alumnos");
  });
});
