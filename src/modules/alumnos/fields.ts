import type { ImportFieldDef } from "@/modules/importexport/types";

export const ALUMNO_FIELDS: ImportFieldDef[] = [
  {
    key: "nia",
    label: "NIA",
    required: true,
    formLabel: "NIA",
    placeholder: "Numero de identificacion",
  },
  {
    key: "nombre",
    label: "Nombre",
    required: true,
    formLabel: "Nombre completo",
    placeholder: "Nombre y apellidos",
  },
  {
    key: "telefono",
    label: "Telefono",
    required: true,
    formLabel: "Telefono",
    placeholder: "600000000",
  },
  {
    key: "email",
    label: "Correo",
    required: true,
    formLabel: "Correo electronico",
    placeholder: "alumno@educa.gva.es",
  },
  {
    key: "ciclo",
    label: "Ciclo",
    required: true,
    formLabel: "Ciclo formativo",
  },
  {
    key: "curso",
    label: "Curso",
    required: true,
    formLabel: "Curso academico",
  },
];
