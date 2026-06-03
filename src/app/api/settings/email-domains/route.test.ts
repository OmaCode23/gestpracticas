import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, PUT } from "./route";

const {
  getEmailDomainsConfigMock,
  saveExtraEmailDomainsMock,
  revalidateTagMock,
} = vi.hoisted(() => ({
  getEmailDomainsConfigMock: vi.fn(),
  saveExtraEmailDomainsMock: vi.fn(),
  revalidateTagMock: vi.fn(),
}));

const { ensureApiUserMock, ensureApiAdminMock } = vi.hoisted(() => ({
  ensureApiUserMock: vi.fn(),
  ensureApiAdminMock: vi.fn(),
}));

vi.mock("@/modules/settings/actions/queries", () => ({
  getEmailDomainsConfig: getEmailDomainsConfigMock,
}));

vi.mock("@/modules/settings/actions/mutations", () => ({
  saveExtraEmailDomains: saveExtraEmailDomainsMock,
}));

vi.mock("next/cache", () => ({
  revalidateTag: revalidateTagMock,
}));

vi.mock("@/modules/auth/api", () => ({
  ensureApiUser: ensureApiUserMock,
  ensureApiAdmin: ensureApiAdminMock,
}));

const mockConfig = {
  dominiosAlumnos: ["alu.edu.gva.es"],
  dominiosProfesores: ["edu.gva.es"],
  extraDominiosAlumnos: [],
  extraDominiosProfesores: [],
};

describe("GET /api/settings/email-domains", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ensureApiUserMock.mockResolvedValue(null);
    getEmailDomainsConfigMock.mockResolvedValue(mockConfig);
  });

  it("devuelve la configuracion de dominios con los dominios base", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      dominiosAlumnos: ["alu.edu.gva.es"],
      dominiosProfesores: ["edu.gva.es"],
      defaultDominiosAlumnos: ["alu.edu.gva.es"],
      defaultDominiosProfesores: ["edu.gva.es"],
    });
  });

  it("devuelve 401 si no hay sesion", async () => {
    ensureApiUserMock.mockResolvedValueOnce(
      Response.json({ ok: false, error: "No autenticado." }, { status: 401 })
    );

    const response = await GET();
    expect(response.status).toBe(401);
  });
});

describe("PUT /api/settings/email-domains", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ensureApiAdminMock.mockResolvedValue(null);
    saveExtraEmailDomainsMock.mockResolvedValue(undefined);
    getEmailDomainsConfigMock.mockResolvedValue({
      ...mockConfig,
      dominiosAlumnos: ["alu.edu.gva.es", "micentro.es"],
      extraDominiosAlumnos: ["micentro.es"],
    });
  });

  it("guarda dominios extra para alumnos y devuelve la configuracion actualizada", async () => {
    const response = await PUT({
      json: vi.fn().mockResolvedValue({
        entity: "ALUMNO",
        domains: ["micentro.es"],
      }),
    } as any);
    const body = await response.json();

    expect(saveExtraEmailDomainsMock).toHaveBeenCalledWith("ALUMNO", ["micentro.es"]);
    expect(revalidateTagMock).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.extraDominiosAlumnos).toContain("micentro.es");
  });

  it("normaliza y deduplica dominios antes de guardar", async () => {
    getEmailDomainsConfigMock.mockResolvedValue({
      ...mockConfig,
      dominiosAlumnos: ["alu.edu.gva.es", "micentro.es"],
      extraDominiosAlumnos: ["micentro.es"],
    });

    await PUT({
      json: vi.fn().mockResolvedValue({
        entity: "ALUMNO",
        domains: ["MICENTRO.ES", "micentro.es", "Micentro.Es"],
      }),
    } as any);

    expect(saveExtraEmailDomainsMock).toHaveBeenCalledWith("ALUMNO", ["micentro.es"]);
  });

  it("rechaza dominios con formato invalido", async () => {
    const response = await PUT({
      json: vi.fn().mockResolvedValue({
        entity: "ALUMNO",
        domains: ["no_es_un_dominio"],
      }),
    } as any);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(saveExtraEmailDomainsMock).not.toHaveBeenCalled();
  });

  it("rechaza entidades no validas", async () => {
    const response = await PUT({
      json: vi.fn().mockResolvedValue({
        entity: "DESCONOCIDA",
        domains: [],
      }),
    } as any);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
  });

  it("devuelve 403 si el usuario no es administrador", async () => {
    ensureApiAdminMock.mockResolvedValueOnce(
      Response.json({ ok: false, error: "No autorizado." }, { status: 403 })
    );

    const response = await PUT({
      json: vi.fn().mockResolvedValue({
        entity: "ALUMNO",
        domains: [],
      }),
    } as any);

    expect(response.status).toBe(403);
    expect(saveExtraEmailDomainsMock).not.toHaveBeenCalled();
  });
});
