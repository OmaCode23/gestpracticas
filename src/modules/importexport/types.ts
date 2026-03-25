import type { ApiResponse } from "@/shared/types/api";

export type Entidad = "alumnos" | "empresas" | "formacion";
export type SheetRow = Record<string, string>;

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

export type LogFilters = {
  entidad: string;
  accion: string;
  estado: string;
};

export type PaginatedImportExportLogs = {
  items: ImportExportLogRow[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type BusyAction = "plantilla" | "importacion" | "exportacion" | null;

export type ImportResponse = {
  message: string;
  importedCount: number;
};

export type ImportErrorResponse = ApiResponse<never, string[]>;

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
