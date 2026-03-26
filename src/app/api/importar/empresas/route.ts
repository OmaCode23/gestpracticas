import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { importEmpresas, type EmpresaImportRow } from "@/modules/importexport/actions/import";
import type { ApiResponse } from "@/shared/types/api";

type ImportBody = {
  rows?: EmpresaImportRow[];
};

/**
 * Recibe un lote de empresas ya parseadas desde el cliente y delega la importacion
 * completa al modulo de negocio.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ImportBody;

    if (!Array.isArray(body.rows)) {
      return NextResponse.json<ApiResponse<never, string[]>>(
        {
          ok: false,
          error: "Debes enviar un array de filas para importar.",
          details: [],
        },
        { status: 400 }
      );
    }

    const result = await importEmpresas(body.rows);

    if (!result.ok) {
      return NextResponse.json<ApiResponse<never, string[]>>(
        {
          ok: false,
          error: result.message,
          details: result.errors,
        },
        { status: 400 }
      );
    }

    // Se invalida cache de las vistas afectadas para reflejar los nuevos datos importados.
    revalidatePath("/");
    revalidatePath("/empresas");
    revalidatePath("/importexport");

    return NextResponse.json<ApiResponse<typeof result>>({
      ok: true,
      data: result,
    });
  } catch (error) {
    console.error("[POST /api/importar/empresas]", error);
    return NextResponse.json<ApiResponse<never, string[]>>(
      {
        ok: false,
        error: "Error al importar las empresas",
        details: [],
      },
      { status: 500 }
    );
  }
}
