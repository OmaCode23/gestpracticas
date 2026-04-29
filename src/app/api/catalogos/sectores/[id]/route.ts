import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { deleteSector, updateSector } from "@/modules/catalogos/actions/mutations";
import { getSectores } from "@/modules/catalogos/actions/queries";
import { sectorUpdateSchema } from "@/modules/catalogos/types/sectores";
import { CACHE_TAGS } from "@/shared/cache";
import type { ApiResponse } from "@/shared/types/api";

function parseId(idParam: string) {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function getSectorById(id: number) {
  const items = await getSectores();
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
    const parsed = sectorUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const existente = await getSectorById(id);
    if (!existente) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "No encontrado" },
        { status: 404 }
      );
    }

    const sector = await updateSector(id, parsed.data);
    revalidateTag(CACHE_TAGS.catalogos);
    revalidatePath("/configuracion");

    return NextResponse.json<ApiResponse<typeof sector>>({
      ok: true,
      data: sector,
    });
  } catch (error: any) {
    const updateError = error as Error & {
      meta?: { empresasCount?: number };
    };

    if (updateError?.message === "SECTOR_EN_USO") {
      const empresasCount = updateError.meta?.empresasCount ?? 0;

      return NextResponse.json<ApiResponse<never>>(
        {
          ok: false,
          error: `No se puede editar porque el sector esta siendo usado en ${empresasCount} empresa(s).`,
        },
        { status: 400 }
      );
    }

    if (error?.code === "P2002") {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "Ya existe un sector con ese nombre." },
        { status: 409 }
      );
    }

    console.error("[PATCH /api/catalogos/sectores/:id]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al actualizar el sector" },
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
    const existente = await getSectorById(id);
    if (!existente) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "No encontrado" },
        { status: 404 }
      );
    }

    await deleteSector(id);
    revalidateTag(CACHE_TAGS.catalogos);
    revalidatePath("/configuracion");

    return NextResponse.json<ApiResponse<null>>({
      ok: true,
      data: null,
    });
  } catch (error: unknown) {
    const deleteError = error as Error & {
      meta?: { empresasCount?: number };
    };

    if (deleteError?.message === "SECTOR_EN_USO") {
      const empresasCount = deleteError.meta?.empresasCount ?? 0;

      return NextResponse.json<ApiResponse<never>>(
        {
          ok: false,
          error: `No se puede eliminar porque el sector esta siendo usado en ${empresasCount} empresa(s).`,
        },
        { status: 400 }
      );
    }

    console.error("[DELETE /api/catalogos/sectores/:id]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al eliminar el sector" },
      { status: 500 }
    );
  }
}
