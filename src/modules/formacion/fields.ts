import type { ImportFieldDef } from "@/modules/importexport/types";

export const FORMACION_FIELDS: ImportFieldDef[] = [
  { key: "cif", label: "CIF", required: true, formLabel: "CIF Empresa" },
  { key: "nia", label: "NIA", required: true, formLabel: "NIA Alumno" },
  {
    key: "periodo",
    label: "Período",
    required: true,
    formLabel: "Período",
    placeholder: "Ej: Marzo - Junio",
  },
  {
    key: "descripcion",
    label: "Descripción",
    formLabel: "Descripción",
    placeholder: "Descripción de la formación...",
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
  { key: "curso", label: "Curso", required: true, formLabel: "Curso académico" },
];
