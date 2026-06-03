import { z } from "zod";

const NIF_REGEX = /^(\d{8}[A-Z]|[XYZ]\d{7}[A-Z])$/;
const NOMBRE_REGEX = /^[\p{L}\s'.-]+$/u;
const EMAIL_REGEX =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;

const optionalCicloFormativoId = z.preprocess(
  (value) => {
    if (value === undefined || value === null || value === "") return null;
    return value;
  },
  z.coerce.number().int().positive().nullable()
);

export const profesorSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio.")
    .max(100, "El nombre no puede superar los 100 caracteres.")
    .refine(
      (value) => NOMBRE_REGEX.test(value),
      "El nombre solo puede contener letras, espacios, apostrofes, puntos y guiones."
    ),
  nif: z
    .string()
    .trim()
    .toUpperCase()
    .regex(NIF_REGEX, "El NIF debe tener un formato valido (ej: 12345678A).")
    .optional()
    .or(z.literal("")),
  especialidad: z
    .string()
    .trim()
    .max(100, "La especialidad no puede superar los 100 caracteres.")
    .optional()
    .or(z.literal("")),
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
    .min(1, "El correo electronico es obligatorio.")
    .regex(EMAIL_REGEX, "El correo electronico no es valido."),
  cicloFormativoId: optionalCicloFormativoId,
});

export const profesorFilterSchema = z.object({
  ciclo: z.string().trim().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).optional(),
  all: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((value) => value === true || value === "true"),
});

export type ProfesorInput = z.infer<typeof profesorSchema>;
export type ProfesorFiltersInput = z.infer<typeof profesorFilterSchema>;
