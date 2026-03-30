import type { ImportFieldDef } from "@/modules/importexport/types";

export const EMPRESA_FIELDS: ImportFieldDef[] = [
  {
    key: "cif",
    label: "CIF",
    required: true,
    formLabel: "CIF",
    placeholder: "Ej: B12345678",
  },
  {
    key: "nombre",
    label: "Nombre",
    required: true,
    formLabel: "Nombre de la empresa",
    placeholder: "Ej: Tecnologias Mediterraneo S.L.",
  },
  {
    key: "direccion",
    label: "Direccion",
    formLabel: "Direccion",
    placeholder: "Calle, numero, piso...",
  },
  {
    key: "localidad",
    label: "Localidad",
    required: true,
    formLabel: "Localidad",
  },
  {
    key: "sector",
    label: "Sector",
    required: true,
    formLabel: "Sector",
  },
  {
    key: "cicloFormativo",
    label: "Ciclo Formativo",
    formLabel: "Ciclo formativo",
  },
  {
    key: "telefono",
    label: "Telefono",
    formLabel: "Telefono",
    placeholder: "963000000",
  },
  {
    key: "email",
    label: "Correo Empresa",
    formLabel: "Correo empresa",
    placeholder: "contacto@empresa.com",
  },
  {
    key: "contacto",
    label: "Contacto",
    formLabel: "Persona de contacto",
    placeholder: "Nombre y apellidos",
  },
  {
    key: "emailContacto",
    label: "Correo Contacto",
    formLabel: "Correo contacto",
    placeholder: "responsable@empresa.com",
  },
];
