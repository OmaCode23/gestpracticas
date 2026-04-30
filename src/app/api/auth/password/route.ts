import { NextRequest, NextResponse } from "next/server";
import { changeOwnPassword } from "@/modules/auth/actions";
import type { ApiResponse } from "@/shared/types/api";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      currentPassword?: string;
      newPassword?: string;
    };

    const currentPassword = body.currentPassword ?? "";
    const newPassword = body.newPassword ?? "";

    if (!currentPassword || !newPassword) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "Debes indicar la contrasena actual y la nueva." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "La nueva contrasena debe tener al menos 8 caracteres." },
        { status: 400 }
      );
    }

    const result = await changeOwnPassword(currentPassword, newPassword);
    if (!result.ok) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: result.error },
        { status: result.error === "No autenticado." ? 401 : 400 }
      );
    }

    return NextResponse.json<ApiResponse<null>>({
      ok: true,
      data: null,
    });
  } catch (error) {
    console.error("[POST /api/auth/password]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "No se pudo actualizar la contrasena." },
      { status: 500 }
    );
  }
}
