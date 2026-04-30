import { UserRole } from "@prisma/client";
import { z } from "zod";

export const managedUserCreateSchema = z.object({
  nombre: z.string().trim().min(2, "El nombre es obligatorio."),
  email: z.string().trim().email("Debes indicar un email valido."),
  rol: z.nativeEnum(UserRole),
  activo: z.boolean().default(true),
  password: z
    .string()
    .min(8, "La contrasena temporal debe tener al menos 8 caracteres."),
}).partial({ password: true });

export const managedUserUpdateSchema = z.object({
  nombre: z.string().trim().min(2, "El nombre es obligatorio."),
  email: z.string().trim().email("Debes indicar un email valido."),
  rol: z.nativeEnum(UserRole),
  activo: z.boolean(),
});

export const managedUserPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "La contrasena temporal debe tener al menos 8 caracteres."),
});
