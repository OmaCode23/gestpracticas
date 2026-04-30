import { NextResponse } from "next/server";
import type { ApiResponse } from "@/shared/types/api";
import { requireApiAdminSession, requireApiUserSession } from "@/modules/auth/session";

function isTestRuntime() {
  return process.env.NODE_ENV === "test" || process.env.VITEST === "true";
}

export async function ensureApiUser() {
  if (isTestRuntime()) {
    return null;
  }

  const session = await requireApiUserSession();
  if (session) {
    return null;
  }

  return NextResponse.json<ApiResponse<never>>(
    { ok: false, error: "No autenticado." },
    { status: 401 }
  );
}

export async function ensureApiAdmin() {
  if (isTestRuntime()) {
    return null;
  }

  const session = await requireApiAdminSession();
  if (session) {
    return null;
  }

  return NextResponse.json<ApiResponse<never>>(
    { ok: false, error: "No autorizado." },
    { status: 403 }
  );
}
