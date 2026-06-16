import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ensureApiAdmin } from "@/modules/auth/api";
import { importProfesores, type ProfesorImportRow } from "@/modules/importexport/actions/import";
import type { ApiResponse } from "@/shared/types/api";

type ImportBody = {
  rows?: ProfesorImportRow[];
};

export async function POST(req: NextRequest) {
  try {
    const authResponse = await ensureApiAdmin();
    if (authResponse) {
      return authResponse;
    }

    const body = (await req.json()) as ImportBody;

    if (!Array.isArray(body.rows)) {
      return NextResponse.json<ApiResponse<never, string[]>>(
        { ok: false, error: "Debes enviar un array de filas para importar.", details: [] },
        { status: 400 }
      );
    }

    const result = await importProfesores(body.rows);

    if (!result.ok) {
      return NextResponse.json<ApiResponse<never, string[]>>(
        { ok: false, error: result.message, details: result.errors },
        { status: 400 }
      );
    }

    revalidatePath("/");
    revalidatePath("/profesores");
    revalidatePath("/importexport");

    return NextResponse.json<ApiResponse<typeof result>>({ ok: true, data: result });
  } catch (error) {
    console.error("[POST /api/importar/profesores]", error);
    return NextResponse.json<ApiResponse<never, string[]>>(
      { ok: false, error: "Error al importar los profesores", details: [] },
      { status: 500 }
    );
  }
}
