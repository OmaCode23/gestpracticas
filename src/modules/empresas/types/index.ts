/**
 * modules/empresas/types/index.ts
 *
 * Tipos TypeScript del módulo Empresas.
 * Se usan tanto en el cliente como en el servidor,
 * por eso viven en types/ y no en actions/ ni components/.
 */

import { z } from "zod";
import { empresaSchema, empresaFilterSchema } from "./schema";

export type EmpresaInput = z.infer<typeof empresaSchema>;
export type EmpresaUpdateInput = Partial<EmpresaInput>;
export type EmpresaFilters = z.infer<typeof empresaFilterSchema>;

export type Empresa = {
    id: number;
    nombre: string;
    cif: string;
    direccion: string | null;
    localidad: string;
    sector: string;
    cicloFormativo: string | null;
    telefono: string | null;
    email: string | null;
    contacto: string | null;
    emailContacto: string | null;
    createdAt: Date;
    updatedAt: Date;
};

export type PaginatedEmpresas = {
    items: Empresa[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
}