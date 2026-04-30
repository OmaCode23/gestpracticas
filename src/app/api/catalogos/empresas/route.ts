import { NextResponse } from "next/server";
import { ensureApiUser } from "@/modules/auth/api";
import { getEmpresaCatalogos } from "@/modules/catalogos/actions/queries";
import type { ApiResponse } from "@/shared/types/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authResponse = await ensureApiUser();
    if (authResponse) {
      return authResponse;
    }

    const data = await getEmpresaCatalogos();

    return NextResponse.json<ApiResponse<typeof data>>({
      ok: true,
      data,
    });
  } catch (error) {
    console.error("[GET /api/catalogos/empresas]", error);

    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al obtener los catalogos de empresas" },
      { status: 500 }
    );
  }
}
