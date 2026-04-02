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
import { alumnoCrudUpdateSchema } from "@/modules/alumnos/types/schema";
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
    const parsed = alumnoCrudUpdateSchema.safeParse(body);

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
          { ok: false, error: "El curso no es valido." },
          { status: 400 }
        );
      }
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
  } catch (error: any) {
    if (error?.code === "P2003") {
      return NextResponse.json<ApiResponse<never>>(
        {
          ok: false,
          error: "No se puede eliminar el alumno porque esta incluido en una formacion.",
        },
        { status: 409 }
      );
    }

    console.error("[DELETE /api/alumnos/:id]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al eliminar" },
      { status: 500 }
    );
  }
}
