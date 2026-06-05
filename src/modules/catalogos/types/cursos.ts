import { z } from "zod";

export const cursoCatalogoSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio.")
    .max(120, "El nombre no puede superar los 120 caracteres."),
  activo: z.boolean().optional(),
});

export const cursoCatalogoUpdateSchema = cursoCatalogoSchema.partial();

export type CursoCatalogoInput = z.infer<typeof cursoCatalogoSchema>;
export type CursoCatalogoUpdateInput = z.infer<typeof cursoCatalogoUpdateSchema>;
