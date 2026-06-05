import { z } from "zod";
import { CURSO_MODALIDADES, CURSO_NIVELES } from "@/shared/catalogs/cursos";

const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message).optional().or(z.literal(""));

const requiredCatalogId = (message: string) =>
  z.preprocess(
    (value) => {
      if (value === undefined || value === null || value === "") return undefined;
      return value;
    },
    z.coerce.number().int(message).positive(message)
  );

export const cursoExternoSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(1, "El titulo es obligatorio.")
    .max(120, "El titulo no puede superar los 120 caracteres."),
  proveedorId: requiredCatalogId("El proveedor es obligatorio."),
  areaId: requiredCatalogId("El area es obligatoria."),
  nivel: z.enum(CURSO_NIVELES, {
    required_error: "El nivel es obligatorio.",
    invalid_type_error: "El nivel seleccionado no es valido.",
  }),
  modalidad: z.enum(CURSO_MODALIDADES, {
    required_error: "La modalidad es obligatoria.",
    invalid_type_error: "La modalidad seleccionada no es valida.",
  }),
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
