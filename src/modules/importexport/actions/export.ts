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
