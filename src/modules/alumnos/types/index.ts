/**
 * src/modules/alumnos/types/index.ts
 */

import { z } from "zod";
import { alumnoSchema, alumnoUpdateSchema } from "./schema";

// Datos que introduce el usuario (POST)
export type AlumnoCreateInput = z.infer<typeof alumnoSchema>;

// Datos que introduce el usuario (PATCH)
export type AlumnoUpdateInput = z.infer<typeof alumnoUpdateSchema>;

// Datos que devuelve la API (incluye id y fechas)
export interface Alumno extends AlumnoCreateInput {
  id: number;
  createdAt?: string;
  updatedAt?: string;
}
