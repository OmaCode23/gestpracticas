import { prisma } from "@/database/prisma";

/**
 * Obtiene las empresas de la base de datos y las transforma al formato de columnas
 * consumido por la exportacion Excel.
 */
export async function getEmpresasExport() {
  const empresas = await prisma.empresa.findMany({
    orderBy: { createdAt: "desc" },
  });

  return empresas.map((empresa) => ({
    CIF: empresa.cif,
    Nombre: empresa.nombre,
    Direccion: empresa.direccion ?? "",
    Localidad: empresa.localidad,
    Sector: empresa.sector,
    "Ciclo Formativo": empresa.cicloFormativo ?? "",
    Telefono: empresa.telefono ?? "",
    "Correo Empresa": empresa.email ?? "",
    Contacto: empresa.contacto ?? "",
    "Correo Contacto": empresa.emailContacto ?? "",
  }));
}

export async function getAlumnosExport() {
  const alumnos = await prisma.alumno.findMany({
    orderBy: { nombre: "asc" },
  });

  return alumnos.map((alumno) => ({
    NIA: alumno.nia,
    Nombre: alumno.nombre,
    Telefono: alumno.telefono ?? "",
    Correo: alumno.email ?? "",
    Ciclo: alumno.ciclo,
    Curso: alumno.curso,
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
    Empresa: formacion.empresa.nombre,
    Alumno: formacion.alumno?.nombre ?? "",
    Periodo: formacion.periodo ?? "",
    Descripcion: formacion.descripcion ?? "",
    Contacto: formacion.contacto ?? "",
    Curso: formacion.curso,
  }));
}
