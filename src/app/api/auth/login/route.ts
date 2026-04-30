import { NextRequest, NextResponse } from "next/server";
import { loginWithLocalCredentials } from "@/modules/auth/actions";
import type { ApiResponse } from "@/shared/types/api";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    const email = body.email?.trim() ?? "";
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "Debes indicar email y contrasena." },
        { status: 400 }
      );
    }

    const result = await loginWithLocalCredentials(email, password);
    if (!result.ok) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: result.error },
        { status: 401 }
      );
    }

    return NextResponse.json<ApiResponse<{ mustChangePass: boolean }>>({
      ok: true,
      data: {
        mustChangePass: result.mustChangePass,
      },
    });
  } catch (error) {
    console.error("[POST /api/auth/login]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "No se pudo iniciar sesion." },
      { status: 500 }
    );
  }
}
