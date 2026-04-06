import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { deleteCicloFormativo, updateCicloFormativo } from "@/modules/catalogos/actions/mutations";
import { getCiclosFormativos } from "@/modules/catalogos/actions/queries";
import { cicloFormativoUpdateSchema } from "@/modules/catalogos/types/ciclos";
import type { ApiResponse } from "@/shared/types/api";

function parseId(idParam: string) {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function getCicloById(id: number) {
  const items = await getCiclosFormativos();
  return items.find((item) => item.id === id) ?? null;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (!id) {
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "ID invalido" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const parsed = cicloFormativoUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const existente = await getCicloById(id);
    if (!existente) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "No encontrado" },
        { status: 404 }
      );
    }

    const ciclo = await updateCicloFormativo(id, parsed.data);
    revalidatePath("/configuracion");

    return NextResponse.json<ApiResponse<typeof ciclo>>({
      ok: true,
      data: ciclo,
    });
  } catch (error: any) {
    const updateError = error as Error & {
      meta?: { alumnosCount?: number; empresasCount?: number };
    };

    if (updateError?.message === "CICLO_FORMATIVO_BASE_NO_EDITABLE") {
      return NextResponse.json<ApiResponse<never>>(
        {
          ok: false,
          error: "No se puede editar un ciclo formativo base.",
        },
        { status: 400 }
      );
    }

    if (updateError?.message === "CICLO_FORMATIVO_CODIGO_RESERVADO") {
      return NextResponse.json<ApiResponse<never>>(
        {
          ok: false,
          error: "Ese codigo esta reservado para un ciclo formativo base. Usa la restauracion de valores por defecto.",
        },
        { status: 400 }
      );
    }

    if (updateError?.message === "CICLO_FORMATIVO_EN_USO") {
      const alumnosCount = updateError.meta?.alumnosCount ?? 0;
      const empresasCount = updateError.meta?.empresasCount ?? 0;
      const parts: string[] = [];

      if (alumnosCount > 0) parts.push(`${alumnosCount} alumno(s)`);
      if (empresasCount > 0) parts.push(`${empresasCount} empresa(s)`);

      return NextResponse.json<ApiResponse<never>>(
        {
          ok: false,
          error: `No se puede editar porque el ciclo esta siendo usado en ${parts.join(" y ")}.`,
        },
        { status: 400 }
      );
    }

    if (error?.code === "P2002") {
      const target = Array.isArray(error?.meta?.target) ? error.meta.target.join(", ") : "";
      const message = target.includes("codigo")
        ? "Ya existe un ciclo con ese codigo."
        : "Ya existe un ciclo con ese nombre.";

      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: message },
        { status: 409 }
      );
    }

    console.error("[PATCH /api/catalogos/ciclos-formativos/:id]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al actualizar el ciclo formativo" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (!id) {
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "ID invalido" },
      { status: 400 }
    );
  }

  try {
    const existente = await getCicloById(id);
    if (!existente) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "No encontrado" },
        { status: 404 }
      );
    }

    await deleteCicloFormativo(id);
    revalidatePath("/configuracion");

    return NextResponse.json<ApiResponse<null>>({
      ok: true,
      data: null,
    });
  } catch (error: unknown) {
    const deleteError = error as Error & {
      meta?: { alumnosCount?: number; empresasCount?: number };
    };

    if (deleteError?.message === "CICLO_FORMATIVO_BASE_NO_ELIMINABLE") {
      return NextResponse.json<ApiResponse<never>>(
        {
          ok: false,
          error: "No se puede eliminar un ciclo formativo base.",
        },
        { status: 400 }
      );
    }

    if (deleteError?.message === "CICLO_FORMATIVO_EN_USO") {
      const alumnosCount = deleteError.meta?.alumnosCount ?? 0;
      const empresasCount = deleteError.meta?.empresasCount ?? 0;
      const parts: string[] = [];

      if (alumnosCount > 0) parts.push(`${alumnosCount} alumno(s)`);
      if (empresasCount > 0) parts.push(`${empresasCount} empresa(s)`);

      return NextResponse.json<ApiResponse<never>>(
        {
          ok: false,
          error: `No se puede eliminar porque el ciclo esta siendo usado en ${parts.join(" y ")}.`,
        },
        { status: 400 }
      );
    }

    console.error("[DELETE /api/catalogos/ciclos-formativos/:id]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al eliminar el ciclo formativo" },
      { status: 500 }
    );
  }
}
