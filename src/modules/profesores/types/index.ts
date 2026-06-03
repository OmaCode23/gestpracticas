import { z } from "zod";
import { profesorSchema, profesorFilterSchema } from "./schema";

export type ProfesorInput = z.infer<typeof profesorSchema>;
export type ProfesorUpdateInput = Partial<ProfesorInput>;
export type ProfesorFilters = z.infer<typeof profesorFilterSchema>;

export type Profesor = {
  id: number;
  nombre: string;
  nif: string | null;
  especialidad: string | null;
  telefono: string | null;
  email: string;
  cicloFormativo: string | null;
  cicloFormativoCodigo: string | null;
  cicloFormativoId: number | null;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type PaginatedProfesores = {
  items: Profesor[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};
