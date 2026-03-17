/**
 * app/api/alumnos/[id]/route.ts
 *
 * GET    /api/alumnos/:id
 * PATCH  /api/alumnos/:id
 * DELETE /api/alumnos/:id
 */

import { NextRequest, NextResponse } from "next/server";
import { getAlumnoById } from "@/modules/alumnos/actions/queries";
import { updateAlumno, deleteAlumno } from "@/modules/alumnos/actions/mutations";
import { alumnoSchema }  from "@/modules/alumnos/types/schema";
import type { ApiResponse } from "@/shared/types/api";

function parseId(params: { id: string }) {
  const id = Number(params.id);
  return isNaN(id) ? null : id;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseId(params);
  if (!id) return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
  const alumno = await getAlumnoById(id);
  if (!alumno) return NextResponse.json({ ok: false, error: "No encontrado" }, { status: 404 });
  return NextResponse.json<ApiResponse<typeof alumno>>({ ok: true, data: alumno });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseId(params);
  if (!id) return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
  try {
    const body   = await req.json();
    const parsed = alumnoSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.errors[0].message }, { status: 400 });
    }
    const alumno = await updateAlumno(id, parsed.data);
    return NextResponse.json<ApiResponse<typeof alumno>>({ ok: true, data: alumno });
  } catch (error) {
    console.error("[PATCH /api/alumnos/:id]", error);
    return NextResponse.json({ ok: false, error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseId(params);
  if (!id) return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
  try {
    await deleteAlumno(id);
    return NextResponse.json<ApiResponse<null>>({ ok: true, data: null });
  } catch (error) {
    console.error("[DELETE /api/alumnos/:id]", error);
    return NextResponse.json({ ok: false, error: "Error al eliminar" }, { status: 500 });
  }
}
