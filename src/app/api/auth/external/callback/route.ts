import { NextRequest, NextResponse } from "next/server";
import { isExternalAuthMode, isExternalMockCallbackEnabled } from "@/modules/auth/config";
import { authorizeExternalIdentity, consumeExternalState } from "@/modules/auth/external";

export const dynamic = "force-dynamic";

function buildLoginUrl(req: NextRequest, error: string) {
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("error", error);
  return loginUrl;
}

export async function GET(req: NextRequest) {
  try {
    if (!isExternalAuthMode()) {
      return NextResponse.redirect(buildLoginUrl(req, "external-mode-disabled"));
    }

    const searchParams = req.nextUrl.searchParams;
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(buildLoginUrl(req, "external-provider-error"));
    }

    if (!state) {
      return NextResponse.redirect(buildLoginUrl(req, "external-state-missing"));
    }

    const { nextPath } = consumeExternalState(state);

    if (isExternalMockCallbackEnabled()) {
      const email = searchParams.get("email");
      const subject = searchParams.get("subject");
      const name = searchParams.get("name");

      if (email && subject) {
        const result = await authorizeExternalIdentity({
          email,
          subject,
          name,
        });

        if (!result.ok) {
          return NextResponse.redirect(buildLoginUrl(req, "external-user-not-authorized"));
        }

        return NextResponse.redirect(new URL(nextPath, req.url));
      }
    }

    return NextResponse.redirect(buildLoginUrl(req, "external-callback-pending"));
  } catch (callbackError) {
    const code =
      callbackError instanceof Error
        ? callbackError.message === "STATE_MISMATCH"
          ? "external-state-mismatch"
          : callbackError.message === "STATE_INVALID"
            ? "external-state-invalid"
            : "external-callback-failed"
        : "external-callback-failed";

    return NextResponse.redirect(buildLoginUrl(req, code));
  }
}
