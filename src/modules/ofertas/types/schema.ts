import { z } from "zod";

export const OFERTA_ESTADOS = ["BORRADOR", "PUBLICADA", "CERRADA"] as const;

const optionalCicloFormativoId = z.preprocess(
  (value) => {
    if (value === undefined || value === null || value === "") return null;
    return value;
  },
  z.coerce.number().int().positive().nullable()
);

const requiredEmpresaId = z.preprocess(
  (value) => {
    if (value === undefined || value === null || value === "") return undefined;
    return value;
  },
  z.coerce.number().int("La empresa es obligatoria.").positive("La empresa es obligatoria.")
);

const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message).optional().or(z.literal(""));

export const ofertaPracticaSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(1, "El titulo es obligatorio.")
    .max(140, "El titulo no puede superar los 140 caracteres."),
  empresaId: requiredEmpresaId,
  cicloFormativoId: optionalCicloFormativoId,
  plazas: z.coerce
    .number()
    .int("Las plazas deben ser un numero entero.")
    .positive("Debe haber al menos una plaza.")
    .max(100, "No se pueden publicar mas de 100 plazas."),
  requisitos: optionalText(500, "Los requisitos no pueden superar los 500 caracteres."),
  periodo: optionalText(100, "El periodo no puede superar los 100 caracteres."),
  descripcion: optionalText(700, "La descripcion no puede superar los 700 caracteres."),
  estado: z.enum(OFERTA_ESTADOS).default("PUBLICADA"),
});

export const ofertaPracticaFilterSchema = z.object({
  search: z.string().trim().optional(),
  estado: z.enum(OFERTA_ESTADOS).optional(),
  ciclo: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).optional(),
  all: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((value) => value === true || value === "true"),
});

export type OfertaPracticaInput = z.infer<typeof ofertaPracticaSchema>;
export type OfertaPracticaFiltersInput = z.infer<typeof ofertaPracticaFilterSchema>;
