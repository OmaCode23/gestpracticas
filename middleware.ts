import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/modules/auth/config";

const PUBLIC_PATHS = new Set(["/login"]);

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET?.trim();
  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV !== "production") {
    return "dev-only-auth-secret-change-me";
  }

  throw new Error("AUTH_SECRET no esta configurado.");
}

async function signToken(token: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getAuthSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(token));
  const bytes = new Uint8Array(signature);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function hasValidSessionCookie(request: NextRequest) {
  const signedValue = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!signedValue) {
    return false;
  }

  const [token, signature] = signedValue.split(".");
  if (!token || !signature) {
    return false;
  }

  const expectedSignature = await signToken(token);
  return expectedSignature === signature;
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const hasValidCookie = await hasValidSessionCookie(request);

  if (PUBLIC_PATHS.has(pathname)) {
    if (hasValidCookie) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  if (hasValidCookie) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { ok: false, error: "No autenticado." },
      { status: 401 }
    );
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)"],
};
