/**
 * src/modules/alumnos/types/schema.ts
 *
 * Validación estricta para alumnos.
 */

import { z } from "zod";
import { CICLOS, CURSOS } from "@/shared/catalogs/academico";

const TEXTO_UTIL = /[\p{L}\p{N}]/u;
const SIMBOLO_REPETIDO = /([^\p{L}\p{N}\s])\1{2,}/u;
const EMAIL_REGEX =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;

export const alumnoSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio.")
    .max(80, "El nombre no puede superar los 80 caracteres.")
    .refine((v) => TEXTO_UTIL.test(v), "El nombre debe contener texto útil.")
    .refine((v) => !SIMBOLO_REPETIDO.test(v), "El nombre contiene símbolos repetidos."),

  nia: z
    .string()
    .trim()
    .min(1, "El NIA es obligatorio.")
    .max(20, "El NIA no puede superar los 20 caracteres.")
    .regex(/^[A-Za-z0-9-]+$/, "El NIA solo puede contener letras, números y guiones."),

  telefono: z
    .string()
    .trim()
    .min(1, "El teléfono es obligatorio.")
    .regex(/^[6789]\d{8}$/, "El teléfono debe tener 9 dígitos y empezar por 6, 7, 8 o 9."),

  email: z
    .string()
    .trim()
    .min(1, "El correo electrónico es obligatorio.")
    .regex(EMAIL_REGEX, "El email no es válido."),

  ciclo: z
    .string()
    .trim()
    .min(1, "El ciclo es obligatorio.")
    .refine((v) => CICLOS.includes(v), "El ciclo no es válido."),

  curso: z
    .string()
    .trim()
    .min(1, "El curso es obligatorio.")
    .refine((v) => CURSOS.includes(v), "El curso no es válido."),
});

// PATCH
export const alumnoUpdateSchema = alumnoSchema.partial();

// Filtros para GET /api/alumnos
export const alumnoFilterSchema = z.object({
  ciclo: z.string().trim().optional(),
  curso: z.string().trim().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().default(10),
});

