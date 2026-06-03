import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    alumno: {
      findMany: vi.fn(),
    },
    empresa: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    formacionEmpresa: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    cursoExterno: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    ofertaPractica: {
      count: vi.fn(),
    },
  },
}));

const { requireAlumnoSessionMock } = vi.hoisted(() => ({
  requireAlumnoSessionMock: vi.fn(),
}));

vi.mock("@/database/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/modules/auth/session", () => ({
  requireAlumnoSession: requireAlumnoSessionMock,
}));

import {
  getPortalAlumnoActual,
  getPortalAlumnoDashboard,
  getPortalEmpresasGenerales,
  getPortalAlumnoSummary,
  getPortalEmpresasDisponibles,
  getPortalFormacionesAlumno,
  type PortalAlumno,
} from "./queries";

const alumnoDb = {
  id: 7,
  nombre: "Ana Portal",
  nia: "NIA-7",
  nif: "12345678Z",
  nuss: "123456789012",
  telefono: "600111222",
  email: "ana@iesgrao.es",
  cursoCiclo: 2,
  curso: "2025-2026",
  cicloFormativoId: 3,
  cvNombre: "ana_cv.pdf",
  cvMimeType: "application/pdf",
  cvTamano: 24000,
  cvUpdatedAt: new Date("2026-04-01T10:30:00.000Z"),
  cicloFormativoRef: {
    id: 3,
    nombre: "Desarrollo de Aplicaciones Multiplataforma",
    codigo: "DAM",
  },
};

const alumnoPortal: PortalAlumno = {
  id: 7,
  nombre: "Ana Portal",
  nia: "NIA-7",
  nif: "12345678Z",
  nuss: "123456789012",
  telefono: "600111222",
  email: "ana@iesgrao.es",
  cursoCiclo: 2,
  curso: "2025-2026",
  cicloFormativoId: 3,
  cicloFormativoNombre: "Desarrollo de Aplicaciones Multiplataforma",
  cicloFormativoCodigo: "DAM",
  cvNombre: "ana_cv.pdf",
  cvMimeType: "application/pdf",
  cvTamano: 24000,
  cvUpdatedAt: "2026-04-01T10:30:00.000Z",
};

describe("portal alumno queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAlumnoSessionMock.mockResolvedValue({
      user: {
        id: 10,
        nombre: "Ana Portal",
        email: "ana@iesgrao.es",
        rol: "ALUMNO",
      },
    });
    prismaMock.cursoExterno.count.mockResolvedValue(0);
    prismaMock.cursoExterno.findMany.mockResolvedValue([]);
    prismaMock.ofertaPractica.count.mockResolvedValue(0);
  });

  it("resuelve el alumno real asociado a la sesion", async () => {
    prismaMock.alumno.findMany.mockResolvedValue([alumnoDb]);

    const result = await getPortalAlumnoActual();

    expect(requireAlumnoSessionMock).toHaveBeenCalledWith("/portal-alumno");
    expect(prismaMock.alumno.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: { equals: "ana@iesgrao.es", mode: "insensitive" } },
      })
    );
    expect(result).toEqual(alumnoPortal);
  });

  it("falla si la sesion de alumno no tiene ficha asociada", async () => {
    prismaMock.alumno.findMany.mockResolvedValue([]);

    await expect(getPortalAlumnoActual()).rejects.toThrow(
      "No existe una ficha de alumno asociada a la sesion actual."
    );
  });

  it("falla si el email de sesion coincide con varias fichas de alumno", async () => {
    prismaMock.alumno.findMany.mockResolvedValue([alumnoDb, { ...alumnoDb, id: 8 }]);

    await expect(getPortalAlumnoActual()).rejects.toThrow("ALUMNO_SESSION_EMAIL_AMBIGUO");
  });

  it("exige sesion de alumno antes de listar empresas y adapta la salida", async () => {
    prismaMock.alumno.findMany.mockResolvedValue([alumnoDb]);
    prismaMock.empresa.findMany.mockResolvedValue([
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
    expect(prismaMock.empresa.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 24,
        orderBy: { nombre: "asc" },
        where: {
          OR: [{ cicloFormativoId: 3 }, { cicloFormativoId: null }],
        },
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

  it("lista empresas generales del portal con sesion de alumno y solo los campos visibles", async () => {
    prismaMock.empresa.findMany.mockResolvedValue([
      {
        id: 8,
        nombre: "Empresa Global",
        sectorRef: { nombre: "Sanidad" },
        localidadRef: { nombre: "Castellon" },
        cicloFormativoRef: null,
        cif: "B00000000",
        direccion: "Campo oculto",
      },
    ]);

    const empresas = await getPortalEmpresasGenerales();

    expect(requireAlumnoSessionMock).toHaveBeenCalledWith("/portal-alumno/empresas");
    expect(prismaMock.empresa.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { nombre: "asc" },
        select: expect.objectContaining({
          id: true,
          nombre: true,
          sectorRef: expect.any(Object),
          localidadRef: expect.any(Object),
          cicloFormativoRef: expect.any(Object),
        }),
      })
    );
    expect(prismaMock.empresa.findMany).toHaveBeenCalledWith(
      expect.not.objectContaining({
        where: expect.anything(),
      })
    );
    expect(empresas).toEqual([
      {
        id: 8,
        nombre: "Empresa Global",
        sector: "Sanidad",
        localidad: "Castellon",
        cicloFormativo: "Varios ciclos",
        cicloFormativoCodigo: null,
      },
    ]);
    expect(empresas[0]).not.toHaveProperty("cif");
    expect(empresas[0]).not.toHaveProperty("direccion");
  });

  it("resume empresas compatibles y formaciones del alumno autenticado", async () => {
    prismaMock.empresa.count.mockResolvedValueOnce(10).mockResolvedValueOnce(4);
    prismaMock.formacionEmpresa.count.mockResolvedValue(2);
    prismaMock.ofertaPractica.count.mockResolvedValue(6);
    prismaMock.cursoExterno.count.mockResolvedValue(3);

    const result = await getPortalAlumnoSummary(alumnoPortal);

    expect(result).toEqual({
      empresasDisponibles: 10,
      empresasCompatibles: 4,
      formacionesAsignadas: 2,
      ofertasPublicadas: 6,
      cursosDisponibles: 3,
    });
  });

  it("devuelve las formaciones del alumno autenticado", async () => {
    prismaMock.formacionEmpresa.findMany.mockResolvedValue([
      {
        id: 11,
        curso: "2025-2026",
        periodo: "Abril-Junio",
        descripcion: "Backend",
        tutorLaboral: "Maria",
        emailTutorLaboral: "maria@empresa.es",
        empresa: {
          id: 1,
          nombre: "Empresa Demo",
          sectorRef: { nombre: "Tecnologia" },
          localidadRef: { nombre: "Valencia" },
          cicloFormativoRef: { nombre: "DAM", codigo: "DAM" },
        },
      },
    ]);

    const result = await getPortalFormacionesAlumno(alumnoPortal);

    expect(prismaMock.formacionEmpresa.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { alumnoId: 7 },
      })
    );
    expect(result).toEqual([
      {
        id: 11,
        curso: "2025-2026",
        periodo: "Abril-Junio",
        descripcion: "Backend",
        tutorLaboral: "Maria",
        emailTutorLaboral: "maria@empresa.es",
        empresa: {
          id: 1,
          nombre: "Empresa Demo",
          sector: "Tecnologia",
          localidad: "Valencia",
          cicloFormativo: "DAM",
          cicloFormativoCodigo: "DAM",
        },
      },
    ]);
  });

  it("compone el dashboard del portal a partir del alumno autenticado", async () => {
    prismaMock.alumno.findMany.mockResolvedValue([alumnoDb]);
    prismaMock.empresa.count.mockResolvedValueOnce(10).mockResolvedValueOnce(4);
    prismaMock.formacionEmpresa.count.mockResolvedValue(1);
    prismaMock.empresa.findMany.mockResolvedValue([]);
    prismaMock.formacionEmpresa.findMany.mockResolvedValue([]);
    prismaMock.ofertaPractica.count.mockResolvedValue(5);
    prismaMock.cursoExterno.count.mockResolvedValue(2);
    prismaMock.cursoExterno.findMany.mockResolvedValue([
      {
        id: 1,
        titulo: "Redes",
        proveedor: "Cisco",
        area: "Redes",
        nivel: "Inicial",
        modalidad: "Online",
        duracion: null,
        descripcion: null,
        enlace: null,
        activo: true,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ]);

    const result = await getPortalAlumnoDashboard();

    expect(result.alumno).toEqual(alumnoPortal);
    expect(result.summary.formacionesAsignadas).toBe(1);
    expect(result.empresas).toEqual([]);
    expect(result.formaciones).toEqual([]);
    expect(result.cursos).toHaveLength(1);
  });
});
