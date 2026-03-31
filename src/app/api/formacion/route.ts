/**
 * app/api/formacion/route.ts
 *
 * GET  /api/formacion   → lista paginada con filtros
 * POST /api/formacion   → crear formación
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getFormacionesPaginated } from "@/modules/formacion/actions/queries";
import { createFormacion } from "@/modules/formacion/actions/mutations";
import {
  formacionCrudSchema,
  formacionFilterSchema,
} from "@/modules/formacion/types/schema";
import { getCursosAcademicosConfigurados } from "@/modules/settings/actions/queries";
import {
  importFormaciones,
  type FormacionImportRow,
} from "@/modules/importexport/actions/import";
import type { ApiResponse } from "@/shared/types/api";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const parsedFilters = formacionFilterSchema.safeParse({
      curso: searchParams.get("curso") || undefined,
      ciclo: searchParams.get("ciclo") || undefined,
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") || 1,
      perPage: searchParams.get("perPage") || 10,
    });

    if (!parsedFilters.success) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: parsedFilters.error.errors[0].message },
        { status: 400 }
      );
    }

    const result = await getFormacionesPaginated(parsedFilters.data);

    return NextResponse.json<ApiResponse<typeof result>>({
      ok: true,
      data: result,
    });
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
    const body = await req.json();

    if (Array.isArray(body.rows)) {
      const result = await importFormaciones(body.rows as FormacionImportRow[]);

      if (!result.ok) {
        return NextResponse.json<ApiResponse<never, string[]>>(
          { ok: false, error: result.message, details: result.errors },
          { status: 400 }
        );
      }

      revalidatePath("/");
      revalidatePath("/formacion");
      revalidatePath("/importexport");

      return NextResponse.json<ApiResponse<typeof result>>({
        ok: true,
        data: result,
      });
    }

    const parsed = formacionCrudSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const cursosValidos = await getCursosAcademicosConfigurados();

    if (!cursosValidos.includes(parsed.data.curso)) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "El curso no es valido" },
        { status: 400 }
      );
    }

    const formacion = await createFormacion(parsed.data);
    revalidatePath("/");
    revalidatePath("/formacion");

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
