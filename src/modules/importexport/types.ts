import type { ApiResponse } from "@/shared/types/api";

/**
 * Entidades soportadas por el panel de importacion/exportacion.
 */
export type Entidad = "alumnos" | "empresas" | "formacion";

/**
 * Representa una fila generica de Excel ya normalizada a pares columna/valor.
 */
export type SheetRow = Record<string, string>;

/**
 * Fila serializada para mostrar el historial de operaciones en cliente.
 */
export type ImportExportLogRow = {
  id: number;
  entidad: string;
  accion: string;
  registros: number;
  estado: string;
  usuario: string;
  detalle: string | null;
  createdAt: string;
};

/**
 * Estado de los filtros aplicados al listado de actividad.
 */
export type LogFilters = {
  entidad: string;
  accion: string;
  estado: string;
};

/**
 * Respuesta paginada del endpoint de logs.
 */
export type PaginatedImportExportLogs = {
  items: ImportExportLogRow[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

/**
 * Accion actualmente en curso por entidad.
 * Se usa para bloquear botones y pintar estados de carga.
 */
export type BusyAction = "plantilla" | "importacion" | "exportacion" | null;

/**
 * Respuesta satisfactoria de una importacion.
 */
export type ImportResponse = {
  message: string;
  importedCount: number;
};

/**
 * Error tipado que devuelve la API de importacion cuando hay incidencias por fila.
 */
export type ImportErrorResponse = ApiResponse<never, string[]>;

/**
 * Contrato de configuracion de cada tarjeta del modulo.
 */
export interface CardConfig {
  entidad: Entidad;
  titulo: string;
  icono: string;
  headerBg: string;
  descripcion: string;
  columnas: string[];
  requiredColumns: string[];
  fileName: string;
  importPath: string;
  enabled: boolean;
  pendingMessage?: string;
}
