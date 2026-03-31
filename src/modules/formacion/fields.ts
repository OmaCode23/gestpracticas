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
    key: "tutorLaboral",
    label: "Tutor Laboral",
    formLabel: "Tutor laboral",
    placeholder: "Nombre y apellidos",
  },
  {
    key: "emailTutorLaboral",
    label: "Correo Tutor Laboral",
    formLabel: "Correo tutor laboral",
    placeholder: "tutor@empresa.com",
  },
  { key: "curso", label: "Curso", required: true, formLabel: "Curso academico" },
];
