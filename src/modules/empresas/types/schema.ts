/**
 * modules/empresas/types/schema.ts
 *
 * Esquema Zod para validar el formulario de empresa.
 * Se importa en el formulario (cliente) y en la API Route (servidor),
 * asi la validacion es la misma en ambos lados.
 */

import { z } from "zod";
import { CICLOS_FORMATIVOS } from "@/shared/catalogs/academico";
import { SECTORES } from "@/shared/catalogs/empresa";
import { LOCALIDADES } from "@/shared/catalogs/ubicacion";

const CIF_NIF_REGEX =
  /^([ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]|[XYZ]\d{7}[A-Z]|\d{8}[A-Z])$/;
const NOMBRE_EMPRESA_REGEX = /^[\p{L}\p{N}\s&'().,/-]+$/u;
const CONTACTO_REGEX = /^[\p{L}\s'.-]+$/u;
const TIENE_TEXTO_UTIL_REGEX = /[\p{L}\p{N}]/u;
const SIMBOLO_REPETIDO_REGEX = /([^\p{L}\p{N}\s])\1{2,}/u;

export const empresaSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio.")
    .max(80, "El nombre no puede superar los 80 caracteres.")
    .refine(
      (value) => TIENE_TEXTO_UTIL_REGEX.test(value),
      "El nombre no puede estar formado solo por simbolos."
    )
    .refine(
      (value) => NOMBRE_EMPRESA_REGEX.test(value),
      "El nombre contiene caracteres no permitidos."
    )
    .refine(
      (value) => !SIMBOLO_REPETIDO_REGEX.test(value),
      "El nombre no puede tener simbolos repetidos de forma excesiva."
    ),
  cif: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      CIF_NIF_REGEX,
      "El CIF/NIF debe tener un formato espanol valido y no puede ser solo letras o solo numeros."
    ),
  direccion: z.string().trim().optional().or(z.literal("")),
  localidad: z
    .string()
    .trim()
    .min(1, "La localidad es obligatoria.")
    .refine(
      (value) => LOCALIDADES.includes(value),
      "La localidad debe existir en el catalogo de ubicaciones."
    ),
  sector: z
    .string()
    .trim()
    .min(1, "El sector es obligatorio.")
    .refine(
      (value) => SECTORES.includes(value),
      "El sector debe existir en el catalogo de empresa."
    ),
  cicloFormativo: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine(
      (value) => !value || CICLOS_FORMATIVOS.includes(value),
      "El ciclo formativo debe existir en el catalogo academico."
    ),
  telefono: z
    .string()
    .trim()
    .regex(
      /^[6789]\d{8}$/,
      "El telefono debe tener 9 digitos y empezar por 6, 7, 8 o 9."
    )
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("El email de empresa no es valido.")
    .optional()
    .or(z.literal("")),
  contacto: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine(
      (value) => !value || !/\d/.test(value),
      "La persona de contacto no puede contener numeros."
    )
    .refine(
      (value) => !value || CONTACTO_REGEX.test(value),
      "La persona de contacto contiene caracteres no permitidos."
    ),
  emailContacto: z
    .string()
    .trim()
    .email("El email del contacto no es valido.")
    .optional()
    .or(z.literal("")),
});

export const empresaFilterSchema = z.object({
  sector: z.string().trim().optional(),
  localidad: z.string().trim().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).optional(),
  all: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((value) => value === true || value === "true"),
});

export type EmpresaInput = z.infer<typeof empresaSchema>;
export type EmpresaFiltersInput = z.infer<typeof empresaFilterSchema>;
