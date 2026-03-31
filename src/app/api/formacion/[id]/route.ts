/**
 * app/api/formacion/[id]/route.ts
 *
 * GET    /api/formacion/:id
 * PATCH  /api/formacion/:id
 * DELETE /api/formacion/:id
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getFormacionById } from "@/modules/formacion/actions/queries";
import { updateFormacion, deleteFormacion } from "@/modules/formacion/actions/mutations";
import { formacionCrudUpdateSchema } from "@/modules/formacion/types/schema";
import { getCursosAcademicosConfigurados } from "@/modules/settings/actions/queries";
import type { ApiResponse } from "@/shared/types/api";

function parseId(idParam: string) {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (!id) {
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "ID inválido" },
      { status: 400 }
    );
  }

  const formacion = await getFormacionById(id);
  if (!formacion) {
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "No encontrada" },
      { status: 404 }
    );
  }

  return NextResponse.json<ApiResponse<typeof formacion>>({
    ok: true,
    data: formacion,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (!id) {
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "ID inválido" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const parsed = formacionCrudUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    if (parsed.data.curso !== undefined) {
      const cursosValidos = await getCursosAcademicosConfigurados();

      if (!cursosValidos.includes(parsed.data.curso)) {
        return NextResponse.json<ApiResponse<never>>(
          { ok: false, error: "El curso no es valido" },
          { status: 400 }
        );
      }
    }

    const existente = await getFormacionById(id);
    if (!existente) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "No encontrada" },
        { status: 404 }
      );
    }

    const formacion = await updateFormacion(id, parsed.data);
    revalidatePath("/");
    revalidatePath("/formacion");

    return NextResponse.json<ApiResponse<typeof formacion>>({
      ok: true,
      data: formacion,
    });
  } catch (error) {
    console.error("[PATCH /api/formacion/:id]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al actualizar" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (!id) {
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "ID inválido" },
      { status: 400 }
    );
  }

  try {
    const existente = await getFormacionById(id);
    if (!existente) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "No encontrada" },
        { status: 404 }
      );
    }

    await deleteFormacion(id);
    revalidatePath("/");
    revalidatePath("/formacion");

    return NextResponse.json<ApiResponse<null>>({
      ok: true,
      data: null,
    });
  } catch (error) {
    console.error("[DELETE /api/formacion/:id]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al eliminar" },
      { status: 500 }
    );
  }
}
