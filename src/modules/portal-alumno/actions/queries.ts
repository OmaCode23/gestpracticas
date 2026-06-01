import { prisma } from "@/database/prisma";
import type { AuthSession } from "@/modules/auth/session";
import { requireAlumnoSession } from "@/modules/auth/session";
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
  id: number;
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

function normalizeAlumno(alumno: PortalAlumnoDbRecord): PortalAlumno {
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
  };
}

async function findPortalAlumnoBySession(session: AuthSession) {
  const email = session.user.email.trim().toLowerCase();

  return prisma.alumno.findFirst({
    where: { email },
    select: PORTAL_ALUMNO_SELECT,
    orderBy: { id: "asc" },
  });
}

function buildEmpresaPortalWhere(alumno: PortalAlumno) {
  if (alumno.cicloFormativoId) {
    return {
      OR: [{ cicloFormativoId: alumno.cicloFormativoId }, { cicloFormativoId: null }],
    };
  }

  if (alumno.cicloFormativoCodigo) {
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

  return {};
}

export async function getPortalAlumnoActual(session?: AuthSession): Promise<PortalAlumno> {
  const activeSession = session ?? (await requireAlumnoSession("/portal-alumno"));
  const alumno = await findPortalAlumnoBySession(activeSession);

  if (!alumno) {
    throw new Error("No existe una ficha de alumno asociada a la sesion actual.");
  }

  return normalizeAlumno(alumno);
}

export async function getPortalAlumnoSummary(alumno?: PortalAlumno) {
  const resolvedAlumno = alumno ?? (await getPortalAlumnoActual());
  const empresaWhere = buildEmpresaPortalWhere(resolvedAlumno);

  const [empresasDisponibles, empresasCompatibles, formacionesAsignadas] = await Promise.all([
    prisma.empresa.count(),
    prisma.empresa.count({ where: empresaWhere }),
    prisma.formacionEmpresa.count({
      where: { alumnoId: resolvedAlumno.id },
    }),
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
  const resolvedAlumno =
    alumno ?? (await getPortalAlumnoActual(await requireAlumnoSession("/portal-alumno/empresas")));

  const empresas = await prisma.empresa.findMany({
    where: buildEmpresaPortalWhere(resolvedAlumno),
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
  const resolvedAlumno = alumno ?? (await getPortalAlumnoActual());
  const formaciones = await prisma.formacionEmpresa.findMany({
    where: {
      alumnoId: resolvedAlumno.id,
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
