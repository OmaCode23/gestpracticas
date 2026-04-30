import { NextResponse } from "next/server";
import { getCurrentSessionSummary } from "@/modules/auth/actions";
import type { ApiResponse } from "@/shared/types/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCurrentSessionSummary();

    return NextResponse.json<ApiResponse<typeof session>>({
      ok: true,
      data: session,
    });
  } catch (error) {
    console.error("[GET /api/auth/session]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "No se pudo recuperar la sesion." },
      { status: 500 }
    );
  }
}
