/**
 * src/modules/alumnos/types/schema.ts
 *
 * Validacion estricta para alumnos.
 */

import { z } from "zod";
const TEXTO_UTIL = /[\p{L}\p{N}]/u;
const SIMBOLO_REPETIDO = /([^\p{L}\p{N}\s])\1{2,}/u;
const NIF_REGEX = /^([XYZ]\d{7}[A-Z]|\d{8}[A-Z])$/;
const NUSS_REGEX = /^\d{12}$/;
const optionalTrimmedString = () => z.string().trim().optional().or(z.literal(""));

export const alumnoSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio.")
    .max(80, "El nombre no puede superar los 80 caracteres.")
    .refine((v) => TEXTO_UTIL.test(v), "El nombre debe contener texto util.")
    .refine((v) => !SIMBOLO_REPETIDO.test(v), "El nombre contiene simbolos repetidos."),

  nia: z
    .string()
    .trim()
    .min(1, "El NIA es obligatorio.")
    .max(20, "El NIA no puede superar los 20 caracteres.")
    .regex(/^[A-Za-z0-9-]+$/, "El NIA solo puede contener letras, numeros y guiones."),

  nif: optionalTrimmedString()
    .transform((value) => (value ?? "").trim().toUpperCase())
    .refine((value) => value === "" || NIF_REGEX.test(value), "El NIF debe tener un formato valido."),

  nuss: optionalTrimmedString()
    .transform((value) => (value ?? "").trim())
    .refine((value) => value === "" || NUSS_REGEX.test(value), "El NUSS debe tener exactamente 12 digitos."),

  telefono: z
    .string()
    .trim()
    .min(1, "El telefono es obligatorio.")
    .regex(/^[6789]\d{8}$/, "El telefono debe tener 9 digitos y empezar por 6, 7, 8 o 9."),

  email: z
    .string()
    .trim()
    .min(1, "El correo electronico es obligatorio.")
    .email("El email no es valido."),

  ciclo: z
    .string()
    .trim()
    .min(1, "El ciclo es obligatorio."),

  cursoCiclo: z
    .coerce
    .number({
      required_error: "El curso ciclo es obligatorio.",
      invalid_type_error: "El curso ciclo debe ser numerico.",
    })
    .int()
    .refine((v) => v === 1 || v === 2, "El curso ciclo debe ser 1 o 2."),

  curso: z
    .string()
    .trim()
    .min(1, "El curso es obligatorio."),
});

export const alumnoCrudSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio.")
    .max(80, "El nombre no puede superar los 80 caracteres.")
    .refine((v) => TEXTO_UTIL.test(v), "El nombre debe contener texto util.")
    .refine((v) => !SIMBOLO_REPETIDO.test(v), "El nombre contiene simbolos repetidos."),

  nia: z
    .string()
    .trim()
    .min(1, "El NIA es obligatorio.")
    .max(20, "El NIA no puede superar los 20 caracteres.")
    .regex(/^[A-Za-z0-9-]+$/, "El NIA solo puede contener letras, numeros y guiones."),

  nif: optionalTrimmedString()
    .transform((value) => (value ?? "").trim().toUpperCase())
    .refine((value) => value === "" || NIF_REGEX.test(value), "El NIF debe tener un formato valido."),

  nuss: optionalTrimmedString()
    .transform((value) => (value ?? "").trim())
    .refine((value) => value === "" || NUSS_REGEX.test(value), "El NUSS debe tener exactamente 12 digitos."),

  telefono: z
    .string()
    .trim()
    .min(1, "El telefono es obligatorio.")
    .regex(/^[6789]\d{8}$/, "El telefono debe tener 9 digitos y empezar por 6, 7, 8 o 9."),

  email: z
    .string()
    .trim()
    .min(1, "El correo electronico es obligatorio.")
    .email("El email no es valido."),

  cicloFormativoId: z.coerce
    .number({
      required_error: "El ciclo formativo es obligatorio.",
      invalid_type_error: "El ciclo formativo debe ser numerico.",
    })
    .int()
    .positive("El ciclo formativo es obligatorio."),

  cursoCiclo: z.coerce
    .number({
      required_error: "El curso ciclo es obligatorio.",
      invalid_type_error: "El curso ciclo debe ser numerico.",
    })
    .int()
    .refine((v) => v === 1 || v === 2, "El curso ciclo debe ser 1 o 2."),

  curso: z
    .string()
    .trim()
    .min(1, "El curso es obligatorio."),
});

// PATCH
export const alumnoUpdateSchema = alumnoSchema.partial();
export const alumnoCrudUpdateSchema = alumnoCrudSchema.partial();

// Filtros para GET /api/alumnos
export const alumnoFilterSchema = z.object({
  ciclo: z.string().trim().optional(),
  curso: z.string().trim().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().default(10),
});
