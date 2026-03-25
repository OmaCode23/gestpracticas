/**
 * src/modules/alumnos/types/schema.ts
 *
 * Validación estricta para alumnos.
 */

import { z } from "zod";
import { CICLOS, CURSOS } from "@/shared/catalogs/academico";

const TEXTO_UTIL = /[\p{L}\p{N}]/u;
const SIMBOLO_REPETIDO = /([^\p{L}\p{N}\s])\1{2,}/u;

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
    .regex(/^[6789]\d{8}$/, "El teléfono debe tener 9 dígitos y empezar por 6, 7, 8 o 9.")
    .optional()
    .or(z.literal("")),

  email: z
    .string()
    .trim()
    .email("El email no es válido.")
    .optional()
    .or(z.literal("")),

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


