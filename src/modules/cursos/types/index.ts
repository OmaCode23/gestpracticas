import { z } from "zod";
import { cursoExternoFilterSchema, cursoExternoSchema } from "./schema";

export type CursoExternoInput = z.infer<typeof cursoExternoSchema>;
export type CursoExternoUpdateInput = Partial<CursoExternoInput>;
export type CursoExternoFilters = z.infer<typeof cursoExternoFilterSchema>;

export type CursoExterno = {
  id: number;
  titulo: string;
  proveedorId: number | null;
  proveedor: string;
  areaId: number | null;
  area: string;
  nivel: string;
  modalidad: string;
  duracion: string | null;
  descripcion: string | null;
  enlace: string | null;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type PaginatedCursosExternos = {
  items: CursoExterno[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};
