import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

const { getEmpresasMock, createEmpresaMock, revalidatePathMock } = vi.hoisted(() => ({
  getEmpresasMock: vi.fn(),
  createEmpresaMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/modules/empresas/actions/queries", () => ({
  getEmpresas: getEmpresasMock,
}));

vi.mock("@/modules/empresas/actions/mutations", () => ({
  createEmpresa: createEmpresaMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

describe("GET /api/empresas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it("devuelve el listado paginado de empresas", async () => {
    getEmpresasMock.mockResolvedValue({
      items: [{ id: 1, nombre: "Empresa Demo" }],
      total: 1,
      page: 2,
      perPage: 7,
      totalPages: 1,
    });

    const response = await GET({
      nextUrl: {
        searchParams: new URLSearchParams({
          sector: "Otro",
          localidad: "Alacant/Alicante",
          search: "demo",
          page: "2",
          limit: "7",
        }),
      },
    } as any);

    const body = await response.json();

    expect(getEmpresasMock).toHaveBeenCalledWith({
      sector: "Otro",
      localidad: "Alacant/Alicante",
      search: "demo",
      page: 2,
      limit: 7,
      all: false,
    });
    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: {
        items: [{ id: 1, nombre: "Empresa Demo" }],
        total: 1,
        page: 2,
        perPage: 7,
        totalPages: 1,
      },
    });
  });
});

describe("POST /api/empresas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it("devuelve 400 cuando el ciclo formativo no es valido", async () => {
    createEmpresaMock.mockRejectedValue(new Error("CICLO_FORMATIVO_INVALIDO"));

    const response = await POST({
      json: vi.fn().mockResolvedValue({
        nombre: "Empresa Demo",
        cif: "B12345678",
        direccion: "",
        localidad: "Alacant/Alicante",
        sector: "Otro",
        cicloFormativoId: 999,
        telefono: "600000000",
        email: "info@empresa.com",
        contacto: "Ana Perez",
        emailContacto: "ana@empresa.com",
      }),
    } as any);

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "El ciclo formativo no es valido.",
    });
  });

  it("devuelve 409 cuando el CIF ya existe", async () => {
    createEmpresaMock.mockRejectedValue({
      code: "P2002",
    });

    const response = await POST({
      json: vi.fn().mockResolvedValue({
        nombre: "Empresa Demo",
        cif: "B12345678",
        direccion: "",
        localidad: "Alacant/Alicante",
        sector: "Otro",
        cicloFormativoId: "",
        telefono: "600000000",
        email: "info@empresa.com",
        contacto: "Ana Perez",
        emailContacto: "ana@empresa.com",
      }),
    } as any);

    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({
      ok: false,
      error: "Ya existe una empresa con ese CIF",
    });
  });

  it("crea la empresa y revalida rutas", async () => {
    createEmpresaMock.mockResolvedValue({
      id: 5,
      nombre: "Empresa Demo",
    });

    const response = await POST({
      json: vi.fn().mockResolvedValue({
        nombre: "Empresa Demo",
        cif: "B12345678",
        direccion: "",
        localidad: "Alacant/Alicante",
        sector: "Otro",
        cicloFormativoId: "",
        telefono: "600000000",
        email: "info@empresa.com",
        contacto: "Ana Perez",
        emailContacto: "ana@empresa.com",
      }),
    } as any);

    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({
      ok: true,
      data: {
        id: 5,
        nombre: "Empresa Demo",
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
    expect(revalidatePathMock).toHaveBeenCalledWith("/empresas");
  });
});
