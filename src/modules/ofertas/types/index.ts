import type { OfertaEstado } from "@prisma/client";
import { z } from "zod";
import { ofertaPracticaFilterSchema, ofertaPracticaSchema } from "./schema";

export type OfertaPracticaInput = z.infer<typeof ofertaPracticaSchema>;
export type OfertaPracticaUpdateInput = Partial<OfertaPracticaInput>;
export type OfertaPracticaFilters = z.infer<typeof ofertaPracticaFilterSchema>;

export type OfertaPractica = {
  id: number;
  titulo: string;
  empresa: string;
  cicloFormativoId: number | null;
  cicloFormativo: string | null;
  cicloFormativoCodigo: string | null;
  plazas: number;
  requisitos: string | null;
  periodo: string | null;
  descripcion: string | null;
  estado: OfertaEstado;
  createdAt: Date;
  updatedAt: Date;
};

export type PaginatedOfertasPracticas = {
  items: OfertaPractica[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};
