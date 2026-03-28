import type { BadgeVariant } from "@/components/ui";
import type { CardConfig } from "./types";

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
    columnas: ["NIA", "NIF", "NUSS", "Nombre", "Telefono", "Correo", "Ciclo", "Curso"],
    requiredColumns: ["NIA", "NIF", "NUSS", "Nombre", "Ciclo", "Curso"],
    fileName: "alumnos",
    importPath: "/api/alumnos",
    enabled: false,
    pendingMessage: "Pendiente de integracion con el modulo Alumnos.",
  },
  {
    entidad: "empresas",
    titulo: "Empresas",
    icono: "\u{1F3E2}",
    headerBg: "bg-[#10b981]",
    descripcion: "Gestiona el directorio de empresas colaboradoras.",
    columnas: [
      "CIF",
      "Nombre",
      "Direccion",
      "Localidad",
      "Sector",
      "Ciclo Formativo",
      "Telefono",
      "Correo Empresa",
      "Contacto",
      "Correo Contacto",
    ],
    requiredColumns: ["CIF", "Nombre", "Localidad", "Sector"],
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
    columnas: ["Empresa", "Alumno", "Periodo", "Descripcion", "Contacto", "Curso"],
    requiredColumns: ["Empresa", "Alumno", "Curso"],
    fileName: "formacion_empresa",
    importPath: "/api/formacion",
    enabled: false,
    pendingMessage: "Pendiente de integracion con el modulo Formacion.",
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
