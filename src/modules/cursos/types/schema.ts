import { z } from "zod";

const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message).optional().or(z.literal(""));

export const cursoExternoSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(1, "El titulo es obligatorio.")
    .max(120, "El titulo no puede superar los 120 caracteres."),
  proveedor: z
    .string()
    .trim()
    .min(1, "El proveedor es obligatorio.")
    .max(100, "El proveedor no puede superar los 100 caracteres."),
  area: z
    .string()
    .trim()
    .min(1, "El area es obligatoria.")
    .max(80, "El area no puede superar los 80 caracteres."),
  nivel: z
    .string()
    .trim()
    .min(1, "El nivel es obligatorio.")
    .max(60, "El nivel no puede superar los 60 caracteres."),
  modalidad: z
    .string()
    .trim()
    .min(1, "La modalidad es obligatoria.")
    .max(60, "La modalidad no puede superar los 60 caracteres."),
  duracion: optionalText(60, "La duracion no puede superar los 60 caracteres."),
  descripcion: optionalText(500, "La descripcion no puede superar los 500 caracteres."),
  enlace: z
    .string()
    .trim()
    .url("El enlace debe ser una URL valida.")
    .optional()
    .or(z.literal("")),
  activo: z.boolean().default(true),
});

export const cursoExternoFilterSchema = z.object({
  search: z.string().trim().optional(),
  activo: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((value) =>
      value === undefined ? undefined : value === true || value === "true"
    ),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).optional(),
  all: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((value) => value === true || value === "true"),
});

export type CursoExternoInput = z.infer<typeof cursoExternoSchema>;
export type CursoExternoFiltersInput = z.infer<typeof cursoExternoFilterSchema>;
