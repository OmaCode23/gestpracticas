import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ensureApiUser } from "@/modules/auth/api";
import { deleteCursoExterno, updateCursoExterno } from "@/modules/cursos/actions/mutations";
import { getCursoExternoById } from "@/modules/cursos/actions/queries";
import { cursoExternoSchema } from "@/modules/cursos/types/schema";
import type { ApiResponse } from "@/shared/types/api";

function parseId(idParam: string) {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResponse = await ensureApiUser();
    if (authResponse) return authResponse;

    const id = parseId(params.id);
    if (!id) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "ID invalido" },
        { status: 400 }
      );
    }

    const curso = await getCursoExternoById(id);
    if (!curso) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "Curso no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<typeof curso>>({ ok: true, data: curso });
  } catch (error) {
    console.error("[GET /api/cursos/:id]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al obtener el curso" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResponse = await ensureApiUser();
    if (authResponse) return authResponse;

    const id = parseId(params.id);
    if (!id) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "ID invalido" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = cursoExternoSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const existe = await getCursoExternoById(id);
    if (!existe) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "Curso no encontrado" },
        { status: 404 }
      );
    }

    const curso = await updateCursoExterno(id, parsed.data);
    revalidatePath("/");
    revalidatePath("/cursos");
    revalidatePath("/portal-alumno");
    revalidatePath("/portal-alumno/cursos");

    return NextResponse.json<ApiResponse<typeof curso>>({ ok: true, data: curso });
  } catch (error: any) {
    if (error instanceof Error && error.message === "CURSO_PROVEEDOR_INVALIDO") {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "El proveedor seleccionado no existe o esta inactivo." },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === "CURSO_AREA_INVALIDA") {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "El area seleccionada no existe o esta inactiva." },
        { status: 400 }
      );
    }

    if (error?.code === "P2002") {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "Ya existe un curso con ese titulo y proveedor." },
        { status: 409 }
      );
    }

    console.error("[PATCH /api/cursos/:id]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al actualizar el curso" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResponse = await ensureApiUser();
    if (authResponse) return authResponse;

    const id = parseId(params.id);
    if (!id) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "ID invalido" },
        { status: 400 }
      );
    }

    const existe = await getCursoExternoById(id);
    if (!existe) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "Curso no encontrado" },
        { status: 404 }
      );
    }

    await deleteCursoExterno(id);
    revalidatePath("/");
    revalidatePath("/cursos");
    revalidatePath("/portal-alumno");
    revalidatePath("/portal-alumno/cursos");

    return NextResponse.json<ApiResponse<null>>({ ok: true, data: null });
  } catch (error) {
    console.error("[DELETE /api/cursos/:id]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al eliminar el curso" },
      { status: 500 }
    );
  }
}
