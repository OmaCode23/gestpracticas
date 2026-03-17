/**
 * app/api/alumnos/route.ts
 *
 * GET  /api/alumnos   → lista paginada con filtros
 * POST /api/alumnos   → crear alumno
 */

import { NextRequest, NextResponse } from "next/server";
import { getAlumnos }   from "@/modules/alumnos/actions/queries";
import { createAlumno } from "@/modules/alumnos/actions/mutations";
import { alumnoSchema } from "@/modules/alumnos/types/schema";
import type { ApiResponse } from "@/shared/types/api";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const result = await getAlumnos({
      ciclo:  searchParams.get("ciclo")  ?? undefined,
      curso:  searchParams.get("curso")  ?? undefined,
      search: searchParams.get("search") ?? undefined,
      page:   Number(searchParams.get("page") ?? 1),
    });
    return NextResponse.json<ApiResponse<typeof result>>({ ok: true, data: result });
  } catch (error) {
    console.error("[GET /api/alumnos]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al obtener los alumnos" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json();
    const parsed = alumnoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }
    const alumno = await createAlumno(parsed.data);
    return NextResponse.json<ApiResponse<typeof alumno>>(
      { ok: true, data: alumno },
      { status: 201 }
    );
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "Ya existe un alumno con ese NIA" },
        { status: 409 }
      );
    }
    console.error("[POST /api/alumnos]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al crear el alumno" },
      { status: 500 }
    );
  }
}
