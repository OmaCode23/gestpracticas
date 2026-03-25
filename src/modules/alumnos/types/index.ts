/**
 * src/modules/alumnos/types/index.ts
 */

import { z } from "zod";
import { alumnoSchema, alumnoUpdateSchema } from "./schema";

// Datos que introduce el usuario (POST)
export type AlumnoInput = z.infer<typeof alumnoSchema>;

// Datos que introduce el usuario (PATCH)
export type AlumnoUpdateInput = z.infer<typeof alumnoUpdateSchema>;

// Datos que devuelve la API (incluye id y fechas)
export interface Alumno {
  id: number;
  nombre: string;
  nia: string;
  telefono: string | null;
  email: string | null;
  ciclo: string;
  curso: string;
  createdAt: string;
  updatedAt: string;
}
