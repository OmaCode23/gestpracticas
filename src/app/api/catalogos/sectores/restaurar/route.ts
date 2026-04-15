import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { restoreSectoresBase } from "@/modules/catalogos/actions/mutations";
import { CACHE_TAGS } from "@/shared/cache";
import type { ApiResponse } from "@/shared/types/api";

export async function POST() {
  try {
    const result = await restoreSectoresBase();

    revalidateTag(CACHE_TAGS.catalogos);
    revalidatePath("/configuracion");

    return NextResponse.json<ApiResponse<typeof result>>({
      ok: true,
      data: result,
    });
  } catch (error) {
    console.error("[POST /api/catalogos/sectores/restaurar]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al restaurar los sectores iniciales" },
      { status: 500 }
    );
  }
}
