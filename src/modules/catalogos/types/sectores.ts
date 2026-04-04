import { z } from "zod";

export const sectorSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio.")
    .max(120, "El nombre no puede superar los 120 caracteres."),
  activo: z.boolean().optional(),
});

export const sectorUpdateSchema = sectorSchema.partial();

export type SectorInput = z.infer<typeof sectorSchema>;
export type SectorUpdateInput = z.infer<typeof sectorUpdateSchema>;
