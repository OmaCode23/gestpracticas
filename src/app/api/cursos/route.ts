import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ensureApiUser } from "@/modules/auth/api";
import { createCursoExterno } from "@/modules/cursos/actions/mutations";
import { getCursosExternos } from "@/modules/cursos/actions/queries";
import { cursoExternoFilterSchema, cursoExternoSchema } from "@/modules/cursos/types/schema";
import type { ApiResponse } from "@/shared/types/api";

export async function GET(req: NextRequest) {
  try {
    const authResponse = await ensureApiUser();
    if (authResponse) return authResponse;

    const { searchParams } = req.nextUrl;
    const parsedFilters = cursoExternoFilterSchema.safeParse({
      search: searchParams.get("search") || undefined,
      activo: searchParams.get("activo") || undefined,
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

    const result = await getCursosExternos(parsedFilters.data);
    return NextResponse.json<ApiResponse<typeof result>>({ ok: true, data: result });
  } catch (error) {
    console.error("[GET /api/cursos]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al obtener los cursos" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResponse = await ensureApiUser();
    if (authResponse) return authResponse;

    const body = await req.json();
    const parsed = cursoExternoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const curso = await createCursoExterno(parsed.data);
    revalidatePath("/");
    revalidatePath("/cursos");
    revalidatePath("/portal-alumno");
    revalidatePath("/portal-alumno/cursos");

    return NextResponse.json<ApiResponse<typeof curso>>(
      { ok: true, data: curso },
      { status: 201 }
    );
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "Ya existe un curso con ese titulo y proveedor." },
        { status: 409 }
      );
    }

    console.error("[POST /api/cursos]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al crear el curso" },
      { status: 500 }
    );
  }
}
