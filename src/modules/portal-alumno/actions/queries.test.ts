import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getPortalAlumnoActual,
  getPortalEmpresasDisponibles,
  getPortalFormacionesAlumno,
  getPortalAlumnoSummary,
  type PortalAlumno,
} from "./queries";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    alumno: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    empresa: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    formacionEmpresa: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/database/prisma", () => ({
  prisma: prismaMock,
}));

const dbAlumno = {
  id: 7,
  nombre: "Ana Portal",
  nia: "NIA-7",
  telefono: "600111222",
  email: "ana@iesgrao.es",
  cursoCiclo: 2,
  curso: "2025-2026",
  cicloFormativoId: 3,
  cvNombre: "ana_cv.pdf",
  cvMimeType: "application/pdf",
  cvTamano: 24_000,
  cvUpdatedAt: new Date("2026-04-01T10:30:00.000Z"),
  cicloFormativoRef: {
    id: 3,
    nombre: "Desarrollo de Aplicaciones Multiplataforma",
    codigo: "DAM",
  },
};

const portalAlumno: PortalAlumno = {
  id: 7,
  nombre: "Ana Portal",
  nia: "NIA-7",
  telefono: "600111222",
  email: "ana@iesgrao.es",
  cursoCiclo: 2,
  curso: "2025-2026",
  cicloFormativoId: 3,
  cicloFormativoNombre: "Desarrollo de Aplicaciones Multiplataforma",
  cicloFormativoCodigo: "DAM",
  cvNombre: "ana_cv.pdf",
  cvMimeType: "application/pdf",
  cvTamano: 24_000,
  cvUpdatedAt: "2026-04-01T10:30:00.000Z",
  isDemo: false,
};

describe("portal alumno queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.PORTAL_ALUMNO_DEMO_ALUMNO_ID;
  });

  it("resuelve un alumno real para la vista temporal del portal", async () => {
    prismaMock.alumno.count.mockResolvedValue(3);
    prismaMock.alumno.findMany.mockResolvedValue([dbAlumno]);

    const result = await getPortalAlumnoActual();

    expect(result).toEqual(portalAlumno);
    expect(prismaMock.alumno.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { id: "asc" },
        skip: expect.any(Number),
        take: 1,
      })
    );
  });

  it("devuelve un alumno de prueba si no hay alumnos reales", async () => {
    prismaMock.alumno.count.mockResolvedValue(0);

    const result = await getPortalAlumnoActual();

    expect(result).toEqual(
      expect.objectContaining({
        id: null,
        nia: "DEMO-PORTAL",
        isDemo: true,
      })
    );
    expect(prismaMock.alumno.findMany).not.toHaveBeenCalled();
  });

  it("permite fijar el alumno demo por variable de entorno", async () => {
    process.env.PORTAL_ALUMNO_DEMO_ALUMNO_ID = "7";
    prismaMock.alumno.findUnique.mockResolvedValue(dbAlumno);

    const result = await getPortalAlumnoActual();

    expect(result).toEqual(portalAlumno);
    expect(prismaMock.alumno.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 7 },
      })
    );
    expect(prismaMock.alumno.count).not.toHaveBeenCalled();
  });

  it("filtra empresas por ciclo del alumno y empresas generales", async () => {
    prismaMock.empresa.findMany.mockResolvedValue([
      {
        id: 1,
        nombre: "Empresa Demo",
        sectorRef: { nombre: "Tecnologia" },
        localidadRef: { nombre: "Valencia" },
        cicloFormativoRef: { nombre: "DAM", codigo: "DAM" },
      },
    ]);

    const result = await getPortalEmpresasDisponibles(5, portalAlumno);

    expect(result).toEqual([
      {
        id: 1,
        nombre: "Empresa Demo",
        sector: "Tecnologia",
        localidad: "Valencia",
        cicloFormativo: "DAM",
        cicloFormativoCodigo: "DAM",
      },
    ]);
    expect(prismaMock.empresa.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [{ cicloFormativoId: 3 }, { cicloFormativoId: null }],
        },
        take: 5,
      })
    );
  });

  it("resume empresas compatibles y formaciones del alumno", async () => {
    prismaMock.empresa.count.mockResolvedValueOnce(10).mockResolvedValueOnce(4);
    prismaMock.formacionEmpresa.count.mockResolvedValue(2);

    const result = await getPortalAlumnoSummary(portalAlumno);

    expect(result).toEqual(
      expect.objectContaining({
        empresasDisponibles: 10,
        empresasCompatibles: 4,
        formacionesAsignadas: 2,
        ofertasPublicadas: 4,
      })
    );
  });

  it("no busca formaciones si solo hay alumno de prueba", async () => {
    const result = await getPortalFormacionesAlumno({ ...portalAlumno, id: null, isDemo: true });

    expect(result).toEqual([]);
    expect(prismaMock.formacionEmpresa.findMany).not.toHaveBeenCalled();
  });
});
