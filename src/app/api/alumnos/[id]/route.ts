/**
 * app/api/alumnos/[id]/route.ts
 *
 * GET    /api/alumnos/:id
 * PATCH  /api/alumnos/:id
 * DELETE /api/alumnos/:id
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAlumnoById } from "@/modules/alumnos/actions/queries";
import { updateAlumno, deleteAlumno } from "@/modules/alumnos/actions/mutations";
import { alumnoUpdateSchema } from "@/modules/alumnos/types/schema";
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

  const alumno = await getAlumnoById(id);
  if (!alumno) {
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "No encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json<ApiResponse<typeof alumno>>({
    ok: true,
    data: alumno,
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
    const parsed = alumnoUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const existente = await getAlumnoById(id);
    if (!existente) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "No encontrado" },
        { status: 404 }
      );
    }

    const alumno = await updateAlumno(id, parsed.data);
    revalidatePath("/");
    revalidatePath("/alumnos");

    return NextResponse.json<ApiResponse<typeof alumno>>({
      ok: true,
      data: alumno,
    });
  } catch (error) {
    console.error("[PATCH /api/alumnos/:id]", error);
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
    const existente = await getAlumnoById(id);
    if (!existente) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "No encontrado" },
        { status: 404 }
      );
    }

    await deleteAlumno(id);
    revalidatePath("/");
    revalidatePath("/alumnos");

    return NextResponse.json<ApiResponse<null>>({
      ok: true,
      data: null,
    });
  } catch (error) {
    console.error("[DELETE /api/alumnos/:id]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al eliminar" },
      { status: 500 }
    );
  }
}
