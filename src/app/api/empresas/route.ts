/**
 * app/api/empresas/route.ts
 *
 * API Route para el recurso Empresa.
 *
 * GET  /api/empresas          → lista paginada (con filtros por query params)
 * POST /api/empresas          → crear nueva empresa
 */

import { NextRequest, NextResponse } from "next/server";
import { getEmpresas }   from "@/modules/empresas/actions/queries";
import { createEmpresa } from "@/modules/empresas/actions/mutations";
import { empresaSchema } from "@/modules/empresas/types/schema";
import type { ApiResponse } from "@/shared/types/api";

// ─── GET /api/empresas ────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    // Leemos los filtros desde los query params de la URL
    const { searchParams } = req.nextUrl;
    const filtros = {
      sector:    searchParams.get("sector")    ?? undefined,
      localidad: searchParams.get("localidad") ?? undefined,
      search:    searchParams.get("search")    ?? undefined,
      page:      Number(searchParams.get("page") ?? 1),
    };

    const result = await getEmpresas(filtros);

    return NextResponse.json<ApiResponse<typeof result>>({
      ok: true,
      data: result,
    });
  } catch (error) {
    console.error("[GET /api/empresas]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al obtener las empresas" },
      { status: 500 }
    );
  }
}

// ─── POST /api/empresas ───────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validamos con Zod antes de tocar la BD
    const parsed = empresaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const empresa = await createEmpresa(parsed.data);

    return NextResponse.json<ApiResponse<typeof empresa>>(
      { ok: true, data: empresa },
      { status: 201 }
    );
  } catch (error: any) {
    // Código P2002 de Prisma = violación de unique constraint (CIF duplicado)
    if (error?.code === "P2002") {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "Ya existe una empresa con ese CIF" },
        { status: 409 }
      );
    }
    console.error("[POST /api/empresas]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al crear la empresa" },
      { status: 500 }
    );
  }
}
