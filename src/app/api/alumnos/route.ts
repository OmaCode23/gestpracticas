/**
 * app/api/alumnos/route.ts
 *
 * GET  /api/alumnos   → lista paginada con filtros
 * POST /api/alumnos   → crear alumno
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  getAlumnosPaginated,
  getAlumnosPickerOptions,
} from "@/modules/alumnos/actions/queries";
import { createAlumno } from "@/modules/alumnos/actions/mutations";
import { alumnoCrudSchema, alumnoFilterSchema } from "@/modules/alumnos/types/schema";
import {
  getCursosAcademicosConfigurados,
  getResultadosPorPaginaConfigurados,
} from "@/modules/settings/actions/queries";
import { importAlumnos, type AlumnoImportRow } from "@/modules/importexport/actions/import";
import type { ApiResponse } from "@/shared/types/api";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const all = searchParams.get("all") === "true";
    const fields = searchParams.get("fields");
    const defaultPerPage = all ? undefined : await getResultadosPorPaginaConfigurados();

    if (all && fields === "picker") {
      const items = await getAlumnosPickerOptions();

      return NextResponse.json<
        ApiResponse<{
          items: typeof items;
          total: number;
          page: number;
          perPage: number;
          totalPages: number;
        }>
      >({
        ok: true,
        data: {
          items,
          total: items.length,
          page: 1,
          perPage: items.length,
          totalPages: items.length > 0 ? 1 : 0,
        },
      });
    }

    const parsedFilters = alumnoFilterSchema.safeParse({
      ciclo: searchParams.get("ciclo") || undefined,
      curso: searchParams.get("curso") || undefined,
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") || 1,
      perPage: searchParams.get("perPage") || defaultPerPage,
      all: searchParams.get("all") || undefined,
    });

    if (!parsedFilters.success) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: parsedFilters.error.errors[0].message },
        { status: 400 }
      );
    }

    const result = await getAlumnosPaginated(parsedFilters.data);

    return NextResponse.json<ApiResponse<typeof result>>({
      ok: true,
      data: result,
    });
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
    const body = await req.json();

    if (Array.isArray(body.rows)) {
      const result = await importAlumnos(body.rows as AlumnoImportRow[]);

      if (!result.ok) {
        return NextResponse.json<ApiResponse<never, string[]>>(
          { ok: false, error: result.message, details: result.errors },
          { status: 400 }
        );
      }

      revalidatePath("/");
      revalidatePath("/alumnos");
      revalidatePath("/importexport");

      return NextResponse.json<ApiResponse<typeof result>>({
        ok: true,
        data: result,
      });
    }

    const parsed = alumnoCrudSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const cursosValidos = await getCursosAcademicosConfigurados();

    if (!cursosValidos.includes(parsed.data.curso)) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "El curso no es valido." },
        { status: 400 }
      );
    }

    const alumno = await createAlumno(parsed.data);
    revalidatePath("/");
    revalidatePath("/alumnos");

    return NextResponse.json<ApiResponse<typeof alumno>>(
      { ok: true, data: alumno },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof Error && error.message === "CICLO_FORMATIVO_INVALIDO") {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "El ciclo formativo no es valido." },
        { status: 400 }
      );
    }

    if (error?.code === "P2002") {
      const target = Array.isArray(error?.meta?.target) ? error.meta.target.join(", ") : "";
      const message = target.includes("nif")
        ? "Ya existe un alumno con ese NIF"
        : target.includes("nuss")
          ? "Ya existe un alumno con ese NUSS"
          : "Ya existe un alumno con ese NIA";

      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: message },
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
