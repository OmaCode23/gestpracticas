import { z } from "zod";

const CODIGO_REGEX = /^[A-Z0-9-]{2,20}$/;

export const cicloFormativoSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio.")
    .max(120, "El nombre no puede superar los 120 caracteres."),
  codigo: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, "El codigo es obligatorio.")
    .max(20, "El codigo no puede superar los 20 caracteres.")
    .regex(CODIGO_REGEX, "El codigo solo puede contener letras, numeros y guiones."),
  activo: z.boolean().optional(),
});

export const cicloFormativoUpdateSchema = cicloFormativoSchema.partial();

export type CicloFormativoInput = z.infer<typeof cicloFormativoSchema>;
export type CicloFormativoUpdateInput = z.infer<typeof cicloFormativoUpdateSchema>;
