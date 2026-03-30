import type { BadgeVariant } from "@/components/ui";
import { ALUMNO_FIELDS } from "@/modules/alumnos/fields";
import { EMPRESA_FIELDS } from "@/modules/empresas/fields";
import { FORMACION_FIELDS } from "@/modules/formacion/fields";
import type { CardConfig } from "./types";

function buildColumns(fields: { label: string }[]) {
  return fields.map((field) => field.label);
}

function buildRequiredColumns(fields: { label: string; required?: boolean }[]) {
  return fields.filter((field) => field.required).map((field) => field.label);
}

/**
 * Configuracion visual y funcional de cada bloque del panel de importacion/exportacion.
 * Cada tarjeta define sus columnas, endpoint asociado y si la funcionalidad esta disponible.
 */
export const CARDS: CardConfig[] = [
  {
    entidad: "alumnos",
    titulo: "Alumnos",
    icono: "\u{1F393}",
    headerBg: "bg-blue-light",
    descripcion: "Importa o exporta el listado completo de alumnos.",
    plantillaDescripcion: "Plantilla base de alumnos",
    importDescripcion: "Carga masiva de alumnos desde Excel",
    exportDescripcion: "Listado completo de alumnos",
    columnas: buildColumns(ALUMNO_FIELDS),
    requiredColumns: buildRequiredColumns(ALUMNO_FIELDS),
    fileName: "alumnos",
    importPath: "/api/alumnos",
    enabled: true,
  },
  {
    entidad: "empresas",
    titulo: "Empresas",
    icono: "\u{1F3E2}",
    headerBg: "bg-[#10b981]",
    descripcion: "Gestiona el directorio de empresas colaboradoras.",
    plantillaDescripcion: "Plantilla base de empresas",
    importDescripcion: "Carga masiva de empresas desde Excel",
    exportDescripcion: "Directorio completo de empresas",
    columnas: buildColumns(EMPRESA_FIELDS),
    requiredColumns: buildRequiredColumns(EMPRESA_FIELDS),
    fileName: "empresas",
    importPath: "/api/importar/empresas",
    enabled: true,
  },
  {
    entidad: "formacion",
    titulo: "Formacion Empresa",
    icono: "\u{1F4CB}",
    headerBg: "bg-purple-600",
    descripcion: "Importa o exporta las formaciones en empresa por curso.",
    plantillaDescripcion: "Plantilla base de formacion en empresa",
    importDescripcion: "Carga masiva de formacion en empresa",
    exportDescripcion: "Listado completo de formacion en empresa",
    columnas: buildColumns(FORMACION_FIELDS),
    requiredColumns: buildRequiredColumns(FORMACION_FIELDS),
    fileName: "formacion_empresa",
    importPath: "/api/formacion",
    enabled: true,
  },
];

/**
 * Relaciona el nombre mostrado de cada entidad con la variante visual del badge.
 */
export const ENTIDAD_BADGE: Record<string, BadgeVariant> = {
  Alumnos: "blue",
  Empresas: "green",
  "Form. Empresa": "purple",
};

/**
 * Colores de estado usados en el historial de operaciones.
 */
export const ESTADO_BADGE: Record<string, BadgeVariant> = {
  Completado: "green",
  Fallido: "red",
};

/**
 * Opciones disponibles en los filtros del historial.
 * Se centralizan aqui para reutilizarlas en la tabla y mantener consistencia.
 */
export const LOG_FILTER_OPTIONS = {
  entidad: [
    { value: "", label: "Todas las entidades" },
    { value: "Empresas", label: "Empresas" },
    { value: "Alumnos", label: "Alumnos" },
    { value: "Form. Empresa", label: "Form. Empresa" },
  ],
  accion: [
    { value: "", label: "Todas las acciones" },
    { value: "Importacion", label: "Importacion" },
    { value: "Exportacion", label: "Exportacion" },
  ],
  estado: [
    { value: "", label: "Todos los estados" },
    { value: "Completado", label: "Completado" },
    { value: "Fallido", label: "Fallido" },
  ],
};
