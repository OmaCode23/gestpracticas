import type { ImportFieldDef } from "@/modules/importexport/types";

export const PROFESOR_FIELDS: ImportFieldDef[] = [
  {
    key: "nombre",
    label: "Nombre",
    required: true,
    formLabel: "Nombre completo",
    placeholder: "Nombre y apellidos",
  },
  {
    key: "nif",
    label: "NIF",
    formLabel: "NIF",
    placeholder: "Ej: 12345678A",
  },
  {
    key: "especialidad",
    label: "Especialidad",
    formLabel: "Especialidad",
    placeholder: "Ej: Informatica y Comunicaciones",
  },
  {
    key: "telefono",
    label: "Telefono",
    formLabel: "Telefono",
    placeholder: "963000000",
  },
  {
    key: "email",
    label: "Correo",
    required: true,
    formLabel: "Correo electronico",
    placeholder: "profesor@ies.es",
  },
  {
    key: "cicloFormativo",
    label: "Ciclo Formativo",
    formLabel: "Ciclo formativo",
  },
];
