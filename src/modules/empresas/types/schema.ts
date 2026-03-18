/**
 * modules/empresas/types/schema.ts
 *
 * Esquema Zod para validar el formulario de empresa.
 * Se importa en el formulario (cliente) y en la API Route (servidor),
 * así la validación es la misma en ambos lados.
 */

import { z } from "zod";

export const empresaSchema = z.object({
    nombre: z.string().trim().min(1, "El nombre es obligatorio."),
    cif: z.string().trim().min(9, "El CIF es obligatorio.").max(9, "El CIF debe tener 9 caracteres."),
    direccion: z.string().trim().optional().or(z.literal("")),
    localidad: z.string().trim().min(1, "La localidad es obligatoria."),
    sector: z.string().trim().min(1, "El sector es obligatorio."),
    cicloFormativo: z.string().trim().optional().or(z.literal("")),
    telefono: z.string().trim().optional().or(z.literal("")),
    email: z.string().trim().email("El email de empresa no es válido.").optional().or(z.literal("")),
    contacto: z.string().trim().optional().or(z.literal("")),
    emailContacto: z.string().trim().email("El email del contacto no es válido.").optional().or(z.literal("")),
});

export const empresaFilterSchema = z.object({
    sector: z.string().trim().optional(),
    localidad: z.string().trim().optional(),
    search: z.string().trim().optional(),
    page: z.coerce.number().int().positive().default(1),
});

export type EmpresaInput = z.infer<typeof empresaSchema>;
export type EmpresaFiltersInput = z.infer<typeof empresaFilterSchema>;