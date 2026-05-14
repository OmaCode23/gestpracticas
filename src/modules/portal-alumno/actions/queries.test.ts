import { beforeEach, describe, expect, it, vi } from "vitest";

const { countMock, findManyMock } = vi.hoisted(() => ({
  countMock: vi.fn(),
  findManyMock: vi.fn(),
}));

const { requireAlumnoSessionMock } = vi.hoisted(() => ({
  requireAlumnoSessionMock: vi.fn(),
}));

vi.mock("@/database/prisma", () => ({
  prisma: {
    empresa: {
      count: countMock,
      findMany: findManyMock,
    },
  },
}));

vi.mock("@/modules/auth/session", () => ({
  requireAlumnoSession: requireAlumnoSessionMock,
}));

import { getPortalAlumnoSummary, getPortalEmpresasDisponibles } from "./queries";

describe("portal alumno queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAlumnoSessionMock.mockResolvedValue({
      user: {
        id: 7,
        rol: "ALUMNO",
      },
    });
  });

  it("exige sesion de alumno antes de calcular el resumen", async () => {
    countMock.mockResolvedValue(12);

    const summary = await getPortalAlumnoSummary();

    expect(requireAlumnoSessionMock).toHaveBeenCalledWith("/portal-alumno");
    expect(countMock).toHaveBeenCalledTimes(1);
    expect(summary).toEqual({
      empresasDisponibles: 12,
      ofertasPublicadas: 0,
      cursosDisponibles: 3,
    });
  });

  it("exige sesion de alumno antes de listar empresas y adapta la salida", async () => {
    findManyMock.mockResolvedValue([
      {
        id: 3,
        nombre: 'Acme "Practicas"',
        sectorRef: { nombre: "Tecnologia" },
        localidadRef: { nombre: "Valencia" },
        cicloFormativoRef: {
          nombre: "DAM",
          codigo: "IFC302",
        },
      },
      {
        id: 4,
        nombre: "Beta",
        sectorRef: { nombre: "Industria" },
        localidadRef: { nombre: "Sagunto" },
        cicloFormativoRef: null,
      },
    ]);

    const empresas = await getPortalEmpresasDisponibles(24);

    expect(requireAlumnoSessionMock).toHaveBeenCalledWith("/portal-alumno/empresas");
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 24,
        orderBy: { nombre: "asc" },
      })
    );
    expect(empresas).toEqual([
      {
        id: 3,
        nombre: 'Acme "Practicas"',
        sector: "Tecnologia",
        localidad: "Valencia",
        cicloFormativo: "DAM",
        cicloFormativoCodigo: "IFC302",
      },
      {
        id: 4,
        nombre: "Beta",
        sector: "Industria",
        localidad: "Sagunto",
        cicloFormativo: "Varios ciclos",
        cicloFormativoCodigo: null,
      },
    ]);
  });
});
