/**
 * app/api/empresas/route.ts
 *
 * API Route para el recurso Empresa.
 *
 * GET  /api/empresas          → lista paginada (con filtros por query params)
 * POST /api/empresas          → crear nueva empresa
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getEmpresas } from "@/modules/empresas/actions/queries";
import { createEmpresa } from "@/modules/empresas/actions/mutations";
import { empresaFilterSchema, empresaSchema } from "@/modules/empresas/types/schema";
import type { ApiResponse } from "@/shared/types/api";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const parsedFilters = empresaFilterSchema.safeParse({
      sector: searchParams.get("sector") || undefined,
      localidad: searchParams.get("localidad") || undefined,
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || undefined,
      all: searchParams.get("all") || undefined,
    });

    if (!parsedFilters.success) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: parsedFilters.error.errors[0].message },
        { status: 400 }
      );
    }

    const result = await getEmpresas(parsedFilters.data);

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = empresaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const empresa = await createEmpresa(parsed.data);
    revalidatePath("/");
    revalidatePath("/empresas");

    return NextResponse.json<ApiResponse<typeof empresa>>(
      { ok: true, data: empresa },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof Error && error.message === "CICLO_FORMATIVO_INVALIDO") {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "El ciclo formativo no es valido." },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "SECTOR_INVALIDO") {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "El sector no existe en el catalogo activo." },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "LOCALIDAD_INVALIDA") {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "La localidad no existe en el catalogo activo." },
        { status: 400 }
      );
    }

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
