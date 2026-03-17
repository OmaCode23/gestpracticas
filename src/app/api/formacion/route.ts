/**
 * app/api/formacion/route.ts
 *
 * GET  /api/formacion  → lista paginada con filtros
 * POST /api/formacion  → crear formación
 */

import { NextRequest, NextResponse } from "next/server";
import { getFormaciones }   from "@/modules/formacion/actions/queries";
import { createFormacion }  from "@/modules/formacion/actions/mutations";
import { formacionSchema }  from "@/modules/formacion/types/schema";
import type { ApiResponse } from "@/shared/types/api";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const result = await getFormaciones({
      ciclo:  searchParams.get("ciclo")  ?? undefined,
      curso:  searchParams.get("curso")  ?? undefined,
      search: searchParams.get("search") ?? undefined,
      page:   Number(searchParams.get("page") ?? 1),
    });
    return NextResponse.json<ApiResponse<typeof result>>({ ok: true, data: result });
  } catch (error) {
    console.error("[GET /api/formacion]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al obtener las formaciones" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json();
    const parsed = formacionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }
    const formacion = await createFormacion(parsed.data);
    return NextResponse.json<ApiResponse<typeof formacion>>(
      { ok: true, data: formacion },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/formacion]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al crear la formación" },
      { status: 500 }
    );
  }
}
