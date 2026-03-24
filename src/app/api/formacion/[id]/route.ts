/**
 * app/api/formacion/[id]/route.ts
 *
 * GET    /api/formacion/:id
 * PATCH  /api/formacion/:id
 * DELETE /api/formacion/:id
 */

import { NextRequest, NextResponse } from "next/server";
import { getFormacionById } from "@/modules/formacion/actions/queries";
import { updateFormacion, deleteFormacion } from "@/modules/formacion/actions/mutations";
import { formacionUpdateSchema } from "@/modules/formacion/types/schema";
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
    const parsed = formacionUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const existente = await getFormacionById(id);
    if (!existente) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "No encontrada" },
        { status: 404 }
      );
    }

    const formacion = await updateFormacion(id, parsed.data);

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
