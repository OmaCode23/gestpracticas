import { prisma } from "@/database/prisma";
import { ALUMNO_FIELDS } from "@/modules/alumnos/fields";
import { EMPRESA_FIELDS } from "@/modules/empresas/fields";
import { FORMACION_FIELDS } from "@/modules/formacion/fields";

/**
 * Obtiene las empresas de la base de datos y las transforma al formato de columnas
 * consumido por la exportacion Excel.
 */
export async function getEmpresasExport() {
  const empresas = await prisma.empresa.findMany({
    include: {
      cicloFormativoRef: {
        select: {
          nombre: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return empresas.map((empresa) => ({
    [EMPRESA_FIELDS[0].label]: empresa.cif,
    [EMPRESA_FIELDS[1].label]: empresa.nombre,
    [EMPRESA_FIELDS[2].label]: empresa.direccion ?? "",
    [EMPRESA_FIELDS[3].label]: empresa.localidad,
    [EMPRESA_FIELDS[4].label]: empresa.sector,
    [EMPRESA_FIELDS[5].label]: empresa.cicloFormativoRef?.nombre ?? "",
    [EMPRESA_FIELDS[6].label]: empresa.telefono ?? "",
    [EMPRESA_FIELDS[7].label]: empresa.email ?? "",
    [EMPRESA_FIELDS[8].label]: empresa.contacto ?? "",
    [EMPRESA_FIELDS[9].label]: empresa.emailContacto ?? "",
  }));
}

export async function getAlumnosExport() {
  const alumnos = await prisma.alumno.findMany({
    include: {
      cicloFormativoRef: {
        select: {
          nombre: true,
        },
      },
    },
    orderBy: { nombre: "asc" },
  });

  return alumnos.map((alumno) => ({
    [ALUMNO_FIELDS[0].label]: alumno.nia,
    [ALUMNO_FIELDS[1].label]: alumno.nif ?? "",
    [ALUMNO_FIELDS[2].label]: alumno.nuss ?? "",
    [ALUMNO_FIELDS[3].label]: alumno.nombre,
    [ALUMNO_FIELDS[4].label]: alumno.telefono,
    [ALUMNO_FIELDS[5].label]: alumno.email,
    [ALUMNO_FIELDS[6].label]: alumno.cicloFormativoRef?.nombre ?? "",
    [ALUMNO_FIELDS[7].label]: alumno.cursoCiclo,
    [ALUMNO_FIELDS[8].label]: alumno.curso,
  }));
}

export async function getFormacionExport() {
  const formaciones = await prisma.formacionEmpresa.findMany({
    include: {
      empresa: {
        select: { nombre: true },
      },
      alumno: {
        select: { nombre: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return formaciones.map((formacion) => ({
    [FORMACION_FIELDS[0].label]: formacion.empresa.nombre,
    [FORMACION_FIELDS[1].label]: formacion.alumno?.nombre ?? "",
    [FORMACION_FIELDS[2].label]: formacion.periodo ?? "",
    [FORMACION_FIELDS[3].label]: formacion.descripcion ?? "",
    [FORMACION_FIELDS[4].label]: formacion.tutorLaboral ?? "",
    [FORMACION_FIELDS[5].label]: formacion.emailTutorLaboral ?? "",
    [FORMACION_FIELDS[6].label]: formacion.curso,
  }));
}
