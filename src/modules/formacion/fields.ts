import type { ImportFieldDef } from "@/modules/importexport/types";

export const FORMACION_FIELDS: ImportFieldDef[] = [
  { key: "empresa", label: "Empresa", required: true, formLabel: "Empresa" },
  { key: "alumno", label: "Alumno", required: true, formLabel: "Alumno" },
  {
    key: "periodo",
    label: "Periodo",
    required: true,
    formLabel: "Periodo",
    placeholder: "Ej: Marzo - Junio",
  },
  {
    key: "descripcion",
    label: "Descripcion",
    formLabel: "Descripcion",
    placeholder: "Descripcion de la formacion...",
  },
  {
    key: "contacto",
    label: "Contacto",
    formLabel: "Persona de contacto",
    placeholder: "Nombre y apellidos",
  },
  { key: "curso", label: "Curso", required: true, formLabel: "Curso academico" },
];
