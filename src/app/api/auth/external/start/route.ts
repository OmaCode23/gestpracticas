import { NextRequest, NextResponse } from "next/server";
import { isExternalAuthMode } from "@/modules/auth/config";
import { createExternalAuthorizationRequest } from "@/modules/auth/external";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    if (!isExternalAuthMode()) {
      return NextResponse.redirect(new URL("/login?error=external-mode-disabled", req.url));
    }

    const nextPath = req.nextUrl.searchParams.get("next");
    const authorizationUrl = createExternalAuthorizationRequest(nextPath);

    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set(
      "error",
      error instanceof Error && error.message === "EXTERNAL_AUTH_NOT_CONFIGURED"
        ? "external-not-configured"
        : "external-start-failed"
    );

    return NextResponse.redirect(loginUrl);
  }
}
