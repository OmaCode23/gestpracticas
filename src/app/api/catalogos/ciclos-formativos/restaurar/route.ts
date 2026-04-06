import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { restoreCiclosFormativosBase } from "@/modules/catalogos/actions/mutations";
import type { ApiResponse } from "@/shared/types/api";

export async function POST() {
  try {
    const result = await restoreCiclosFormativosBase();

    revalidatePath("/configuracion");

    return NextResponse.json<ApiResponse<typeof result>>({
      ok: true,
      data: result,
    });
  } catch (error) {
    const restoreError = error as Error & {
      meta?: { codigos?: string[] };
    };

    if (restoreError?.message === "CICLO_FORMATIVO_BASE_CONFLICT") {
      const codigos = restoreError.meta?.codigos ?? [];

      return NextResponse.json<ApiResponse<never>>(
        {
          ok: false,
          error: `No se puede restaurar el catalogo base porque existen ciclos personalizados en uso con codigos reservados: ${codigos.join(", ")}.`,
        },
        { status: 400 }
      );
    }

    console.error("[POST /api/catalogos/ciclos-formativos/restaurar]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al restaurar los ciclos formativos iniciales" },
      { status: 500 }
    );
  }
}
