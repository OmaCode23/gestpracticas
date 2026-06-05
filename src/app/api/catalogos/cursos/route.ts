import { NextResponse } from "next/server";
import { ensureApiUser } from "@/modules/auth/api";
import { getCursoCatalogos } from "@/modules/catalogos/actions/queries";
import type { ApiResponse } from "@/shared/types/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authResponse = await ensureApiUser();
    if (authResponse) {
      return authResponse;
    }

    const data = await getCursoCatalogos();

    return NextResponse.json<ApiResponse<typeof data>>({
      ok: true,
      data,
    });
  } catch (error) {
    console.error("[GET /api/catalogos/cursos]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al obtener los catalogos de cursos" },
      { status: 500 }
    );
  }
}
