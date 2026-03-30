/**
 * src/modules/formacion/types/index.ts
 */

import { z } from "zod";
import { formacionSchema, formacionUpdateSchema, formacionFilterSchema } from "./schema";

// Datos que introduce el usuario (POST)
export type FormacionInput = z.infer<typeof formacionSchema>;

// Datos que introduce el usuario (PATCH)
export type FormacionUpdateInput = z.infer<typeof formacionUpdateSchema>;

// Filtros para GET /api/formacion
export type FormacionFilters = z.infer<typeof formacionFilterSchema>;

// Datos que devuelve la API (incluye id, fechas y relaciones)
export interface Formacion {
  id: number;
  empresaId: number;
  alumnoId: number;
  curso: string;
  periodo: string;
  descripcion: string | null;
  contacto: string | null;
  tutorLaboral: string | null;
  emailTutorLaboral: string | null;
  createdAt: string;
  updatedAt: string;

  empresa?: {
    id: number;
    nombre: string;
    sector: string;
    localidad: string;
  } | null;

  alumno?: {
    id: number;
    nombre: string;
    nia: string;
    nif: string | null;
    nuss: string | null;
    ciclo: string;
    cursoCiclo: number;
    curso: string;
  } | null;
}

export type PaginatedFormaciones = {
  items: Formacion[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};
