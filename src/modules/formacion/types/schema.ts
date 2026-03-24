/**
 * src/modules/formacion/types/schema.ts
 */

import { z } from "zod";

// Para crear una formación en empresa (POST)
export const formacionSchema = z.object({
  empresaId: z
    .number({
      required_error: "La empresa es obligatoria",
      invalid_type_error: "El ID de empresa debe ser numérico",
    })
    .int()
    .positive("El ID de empresa debe ser positivo"),

  alumnoId: z
    .number({
      required_error: "El alumno es obligatorio",
      invalid_type_error: "El ID de alumno debe ser numérico",
    })
    .int()
    .positive("El ID de alumno debe ser positivo"),

  curso: z
    .string()
    .trim()
    .min(1, "El curso académico es obligatorio"),

  periodo: z
    .string()
    .trim()
    .min(1, "El periodo es obligatorio")
    .max(100, "El periodo no puede superar los 100 caracteres"),

  descripcion: z
    .string()
    .trim()
    .max(500, "La descripción no puede superar los 500 caracteres")
    .optional()
    .or(z.literal("")),

  contacto: z
    .string()
    .trim()
    .max(120, "La persona de contacto no puede superar los 120 caracteres")
    .optional()
    .or(z.literal("")),
});

// Para actualizar una formación (PATCH)
export const formacionUpdateSchema = formacionSchema.partial();


