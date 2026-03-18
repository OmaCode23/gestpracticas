/**
 * src/modules/alumnos/types/schema.ts
 */

import { z } from "zod";

// Para crear un alumno (POST)
export const alumnoSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  nia: z.string().min(1, "El NIA es obligatorio"),
  telefono: z.string().optional(),
  email: z.string().email("Email no válido").optional(),
  ciclo: z.string().min(1, "El ciclo es obligatorio"),
  curso: z.string().min(1, "El curso es obligatorio"),
});

// Para actualizar un alumno (PATCH)
export const alumnoUpdateSchema = alumnoSchema.partial();

