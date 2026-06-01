import { prisma } from "@/database/prisma";
import { CURSOS_EXTERNOS_PREVIEW } from "../data";

type PortalAlumnoDbRecord = {
  id: number;
  nombre: string;
  nia: string;
  telefono: string;
  email: string;
  cursoCiclo: number;
  curso: string;
  cicloFormativoId: number | null;
  cvNombre: string | null;
  cvMimeType: string | null;
  cvTamano: number | null;
  cvUpdatedAt: Date | null;
  cicloFormativoRef: {
    id: number;
    nombre: string;
    codigo: string | null;
  } | null;
};

export type PortalAlumno = {
  id: number | null;
  nombre: string;
  nia: string;
  telefono: string;
  email: string;
  cursoCiclo: number;
  curso: string;
  cicloFormativoId: number | null;
  cicloFormativoNombre: string | null;
  cicloFormativoCodigo: string | null;
  cvNombre: string | null;
  cvMimeType: string | null;
  cvTamano: number | null;
  cvUpdatedAt: string | null;
  isDemo: boolean;
};

const PORTAL_ALUMNO_SELECT = {
  id: true,
  nombre: true,
  nia: true,
  telefono: true,
  email: true,
  cursoCiclo: true,
  curso: true,
  cicloFormativoId: true,
  cvNombre: true,
  cvMimeType: true,
  cvTamano: true,
  cvUpdatedAt: true,
  cicloFormativoRef: {
    select: {
      id: true,
      nombre: true,
      codigo: true,
    },
  },
} as const;

function getCurrentAcademicCourse(now = new Date()) {
  const month = now.getMonth();
  const firstYear = month >= 8 ? now.getFullYear() : now.getFullYear() - 1;

  return `${firstYear}-${firstYear + 1}`;
}

function getDeterministicDemoSkip(total: number) {
  const today = new Date().toISOString().slice(0, 10);
  const seed = Array.from(today).reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return seed % total;
}

function parsePortalAlumnoId(value?: string) {
  const id = Number(value);

  return Number.isInteger(id) && id > 0 ? id : null;
}

function normalizeAlumno(alumno: PortalAlumnoDbRecord, isDemo = false): PortalAlumno {
  return {
    id: alumno.id,
    nombre: alumno.nombre,
    nia: alumno.nia,
    telefono: alumno.telefono,
    email: alumno.email,
    cursoCiclo: alumno.cursoCiclo,
    curso: alumno.curso,
    cicloFormativoId: alumno.cicloFormativoRef?.id ?? alumno.cicloFormativoId ?? null,
    cicloFormativoNombre: alumno.cicloFormativoRef?.nombre ?? null,
    cicloFormativoCodigo: alumno.cicloFormativoRef?.codigo ?? null,
    cvNombre: alumno.cvNombre,
    cvMimeType: alumno.cvMimeType,
    cvTamano: alumno.cvTamano,
    cvUpdatedAt: alumno.cvUpdatedAt?.toISOString() ?? null,
    isDemo,
  };
}

function getPortalAlumnoDemo(): PortalAlumno {
  return {
    id: null,
    nombre: "Alumno Demo Portal",
    nia: "DEMO-PORTAL",
    telefono: "600 000 000",
    email: "alumno.demo@iesgrao.es",
    cursoCiclo: 2,
    curso: getCurrentAcademicCourse(),
    cicloFormativoId: null,
    cicloFormativoNombre: "Desarrollo de Aplicaciones Multiplataforma",
    cicloFormativoCodigo: "DAM",
    cvNombre: null,
    cvMimeType: null,
    cvTamano: null,
    cvUpdatedAt: null,
    isDemo: true,
  };
}

async function findPortalAlumnoById(id: number) {
  return prisma.alumno.findUnique({
    where: { id },
    select: PORTAL_ALUMNO_SELECT,
  });
}

export async function getPortalAlumnoActual(alumnoId?: number): Promise<PortalAlumno> {
  const requestedAlumnoId =
    alumnoId ?? parsePortalAlumnoId(process.env.PORTAL_ALUMNO_DEMO_ALUMNO_ID);

  if (requestedAlumnoId) {
    const alumno = await findPortalAlumnoById(requestedAlumnoId);

    if (alumno) {
      return normalizeAlumno(alumno);
    }
  }

  const total = await prisma.alumno.count();

  if (total === 0) {
    return getPortalAlumnoDemo();
  }

  const [alumno] = await prisma.alumno.findMany({
    select: PORTAL_ALUMNO_SELECT,
    orderBy: { id: "asc" },
    skip: getDeterministicDemoSkip(total),
    take: 1,
  });

  return alumno ? normalizeAlumno(alumno) : getPortalAlumnoDemo();
}

function buildEmpresaPortalWhere(alumno?: PortalAlumno) {
  if (alumno?.cicloFormativoId) {
    return {
      OR: [
        { cicloFormativoId: alumno.cicloFormativoId },
        { cicloFormativoId: null },
      ],
    };
  }

  if (alumno?.cicloFormativoCodigo) {
    return {
      OR: [
        {
          cicloFormativoRef: {
            is: {
              codigo: alumno.cicloFormativoCodigo,
            },
          },
        },
        { cicloFormativoId: null },
      ],
    };
  }

  if (!alumno) {
    return {};
  }

  return {};
}

export async function getPortalAlumnoSummary(alumno?: PortalAlumno) {
  const empresaWhere = buildEmpresaPortalWhere(alumno);

  const [empresasDisponibles, empresasCompatibles, formacionesAsignadas] = await Promise.all([
    prisma.empresa.count(),
    prisma.empresa.count({ where: empresaWhere }),
    alumno?.id
      ? prisma.formacionEmpresa.count({
          where: { alumnoId: alumno.id },
        })
      : Promise.resolve(0),
  ]);

  return {
    empresasDisponibles,
    empresasCompatibles,
    formacionesAsignadas,
    ofertasPublicadas: empresasCompatibles,
    cursosDisponibles: CURSOS_EXTERNOS_PREVIEW.length,
  };
}

export async function getPortalEmpresasDisponibles(limit = 8, alumno?: PortalAlumno) {
  const empresas = await prisma.empresa.findMany({
    where: buildEmpresaPortalWhere(alumno),
    take: limit,
    orderBy: { nombre: "asc" },
    include: {
      sectorRef: {
        select: {
          nombre: true,
        },
      },
      localidadRef: {
        select: {
          nombre: true,
        },
      },
      cicloFormativoRef: {
        select: {
          nombre: true,
          codigo: true,
        },
      },
    },
  });

  return empresas.map((empresa) => ({
    id: empresa.id,
    nombre: empresa.nombre,
    sector: empresa.sectorRef.nombre,
    localidad: empresa.localidadRef.nombre,
    cicloFormativo: empresa.cicloFormativoRef?.nombre ?? "Varios ciclos",
    cicloFormativoCodigo: empresa.cicloFormativoRef?.codigo ?? null,
  }));
}

export async function getPortalFormacionesAlumno(alumno?: PortalAlumno) {
  if (!alumno?.id) {
    return [];
  }

  const formaciones = await prisma.formacionEmpresa.findMany({
    where: {
      alumnoId: alumno.id,
    },
    orderBy: { createdAt: "desc" },
    include: {
      empresa: {
        include: {
          sectorRef: {
            select: {
              nombre: true,
            },
          },
          localidadRef: {
            select: {
              nombre: true,
            },
          },
          cicloFormativoRef: {
            select: {
              nombre: true,
              codigo: true,
            },
          },
        },
      },
    },
  });

  return formaciones.map((formacion) => ({
    id: formacion.id,
    curso: formacion.curso,
    periodo: formacion.periodo,
    descripcion: formacion.descripcion,
    tutorLaboral: formacion.tutorLaboral,
    emailTutorLaboral: formacion.emailTutorLaboral,
    empresa: {
      id: formacion.empresa.id,
      nombre: formacion.empresa.nombre,
      sector: formacion.empresa.sectorRef.nombre,
      localidad: formacion.empresa.localidadRef.nombre,
      cicloFormativo: formacion.empresa.cicloFormativoRef?.nombre ?? "Varios ciclos",
      cicloFormativoCodigo: formacion.empresa.cicloFormativoRef?.codigo ?? null,
    },
  }));
}

export async function getPortalAlumnoDashboard() {
  const alumno = await getPortalAlumnoActual();
  const [summary, empresas, formaciones] = await Promise.all([
    getPortalAlumnoSummary(alumno),
    getPortalEmpresasDisponibles(4, alumno),
    getPortalFormacionesAlumno(alumno),
  ]);

  return {
    alumno,
    summary,
    empresas,
    formaciones,
  };
}
