/**
 * src/modules/formacion/types/index.ts
 */


import { z } from "zod";
import { formacionSchema, formacionUpdateSchema } from "./schema";

export type FormacionCreateInput = z.infer<typeof formacionSchema>;
export type FormacionUpdateInput = z.infer<typeof formacionUpdateSchema>;

export interface FormacionEmpresa extends FormacionCreateInput {
  id: number;
  createdAt?: string;
  updatedAt?: string;
  empresa?: {
    id: number;
    nombre: string;
  } | null;
  alumno?: {
    id: number;
    nombre: string;
    nia: string;
  } | null;
}


