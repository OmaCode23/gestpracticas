/**
 * src/modules/formacion/types/schema.ts
 */

import { z } from "zod";
import { CURSOS } from "@/shared/catalogs/academico";

const TEXTO_UTIL = /[\p{L}\p{N}]/u;
const CONTACTO_REGEX = /^[\p{L}\s'.-]+$/u;
const SIMBOLO_REPETIDO = /([^\p{L}\p{N}\s])\1{2,}/u;

export const formacionSchema = z.object({
  empresaId: z
    .number({
      required_error: "La empresa es obligatoria",
      invalid_type_error: "El ID de empresa debe ser numérico",
    })
    .int()
    .positive(),

  alumnoId: z
    .number({
      required_error: "El alumno es obligatorio",
      invalid_type_error: "El ID de alumno debe ser numérico",
    })
    .int()
    .positive(),

  curso: z
    .string()
    .trim()
    .min(1, "El curso es obligatorio")
    .refine((value) => CURSOS.includes(value), "El curso no es válido"),

  periodo: z
    .string()
    .trim()
    .min(1, "El periodo es obligatorio")
    .max(120, "El periodo no puede superar los 120 caracteres")
    .refine((v) => TEXTO_UTIL.test(v), "El periodo debe contener texto útil")
    .refine((v) => !SIMBOLO_REPETIDO.test(v), "El periodo contiene símbolos repetidos"),

  descripcion: z
    .string()
    .trim()
    .max(500, "La descripción no puede superar los 500 caracteres")
    .optional()
    .or(z.literal("")),

  contacto: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || CONTACTO_REGEX.test(v), "El contacto contiene caracteres no válidos")
    .refine((v) => !v || !/\d/.test(v), "El contacto no puede contener números"),
});

// PATCH
export const formacionUpdateSchema = formacionSchema.partial();

// Filtros para GET /api/formacion
export const formacionFilterSchema = z.object({
  curso: z.string().trim().optional(),
  ciclo: z.string().trim().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().default(10),
});
