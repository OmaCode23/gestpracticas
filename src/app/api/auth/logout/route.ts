import { NextResponse } from "next/server";
import { logoutCurrentUser } from "@/modules/auth/actions";
import type { ApiResponse } from "@/shared/types/api";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await logoutCurrentUser();

    return NextResponse.json<ApiResponse<null>>({
      ok: true,
      data: null,
    });
  } catch (error) {
    console.error("[POST /api/auth/logout]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "No se pudo cerrar la sesion." },
      { status: 500 }
    );
  }
}
