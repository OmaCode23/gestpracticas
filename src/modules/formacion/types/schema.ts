/**
 * src/modules/formacion/types/schema.ts
 */

import { z } from "zod";
const TEXTO_UTIL = /[\p{L}\p{N}]/u;
const CONTACTO_REGEX = /^[\p{L}\s'.-]+$/u;
const SIMBOLO_REPETIDO = /([^\p{L}\p{N}\s])\1{2,}/u;

export const formacionSchema = z.object({
  empresaId: z
    .number({
      required_error: "La empresa es obligatoria",
      invalid_type_error: "El ID de empresa debe ser numerico",
    })
    .int()
    .positive(),

  alumnoId: z
    .number({
      required_error: "El alumno es obligatorio",
      invalid_type_error: "El ID de alumno debe ser numerico",
    })
    .int()
    .positive(),

  curso: z
    .string()
    .trim()
    .min(1, "El curso es obligatorio"),

  periodo: z
    .string()
    .trim()
    .min(1, "El periodo es obligatorio")
    .max(120, "El periodo no puede superar los 120 caracteres")
    .refine((v) => TEXTO_UTIL.test(v), "El periodo debe contener texto util")
    .refine((v) => !SIMBOLO_REPETIDO.test(v), "El periodo contiene simbolos repetidos"),

  descripcion: z
    .string()
    .trim()
    .max(500, "La descripcion no puede superar los 500 caracteres")
    .optional()
    .or(z.literal("")),

  tutorLaboral: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || CONTACTO_REGEX.test(v), "El tutor laboral contiene caracteres no validos")
    .refine((v) => !v || !/\d/.test(v), "El tutor laboral no puede contener numeros"),

  emailTutorLaboral: z
    .string()
    .trim()
    .email("El email del tutor laboral no es valido")
    .optional()
    .or(z.literal("")),
});

export const formacionCrudSchema = z.object({
  empresaId: z
    .number({
      required_error: "La empresa es obligatoria",
      invalid_type_error: "El ID de empresa debe ser numerico",
    })
    .int()
    .positive(),

  alumnoId: z
    .number({
      required_error: "El alumno es obligatorio",
      invalid_type_error: "El ID de alumno debe ser numerico",
    })
    .int()
    .positive(),

  curso: z.string().trim().min(1, "El curso es obligatorio"),

  periodo: z
    .string()
    .trim()
    .min(1, "El periodo es obligatorio")
    .max(120, "El periodo no puede superar los 120 caracteres")
    .refine((v) => TEXTO_UTIL.test(v), "El periodo debe contener texto util")
    .refine((v) => !SIMBOLO_REPETIDO.test(v), "El periodo contiene simbolos repetidos"),

  descripcion: z
    .string()
    .trim()
    .max(500, "La descripcion no puede superar los 500 caracteres")
    .optional()
    .or(z.literal("")),

  tutorLaboral: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || CONTACTO_REGEX.test(v), "El tutor laboral contiene caracteres no validos")
    .refine((v) => !v || !/\d/.test(v), "El tutor laboral no puede contener numeros"),

  emailTutorLaboral: z
    .string()
    .trim()
    .email("El email del tutor laboral no es valido")
    .optional()
    .or(z.literal("")),
});

// PATCH
export const formacionUpdateSchema = formacionSchema.partial();
export const formacionCrudUpdateSchema = formacionCrudSchema.partial();

// Filtros para GET /api/formacion
export const formacionFilterSchema = z.object({
  curso: z.string().trim().optional(),
  ciclo: z.string().trim().optional(),
  cursoCiclo: z.coerce.number().int().refine((v) => v === 1 || v === 2).optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(10),
  all: z.coerce.boolean().optional().default(false),
});
