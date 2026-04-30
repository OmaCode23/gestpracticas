import { AuthProvider } from "@prisma/client";
import { cookies } from "next/headers";
import { prisma } from "@/database/prisma";
import {
  EXTERNAL_AUTH_STATE_COOKIE_NAME,
  EXTERNAL_AUTH_STATE_TTL_SECONDS,
  getExternalAuthSettings,
} from "@/modules/auth/config";
import {
  buildSignedSessionValue,
  deriveInitials,
  generateSessionToken,
  normalizeEmail,
  verifySignedSessionValue,
} from "@/modules/auth/core";
import { createUserSession } from "@/modules/auth/session";

export type ExternalIdentity = {
  email: string;
  name?: string | null;
  subject: string;
};

export function getExternalAuthSummary() {
  const settings = getExternalAuthSettings();

  return {
    configured: Boolean(settings),
    settings,
  };
}

function sanitizeNextPath(nextPath?: string | null) {
  if (!nextPath || !nextPath.startsWith("/")) {
    return "/";
  }

  if (nextPath.startsWith("//")) {
    return "/";
  }

  return nextPath;
}

function buildStatePayload(nextPath?: string | null) {
  return Buffer.from(
    JSON.stringify({
      nonce: generateSessionToken(),
      nextPath: sanitizeNextPath(nextPath),
    }),
    "utf8"
  ).toString("base64url");
}

function parseStatePayload(payload: string) {
  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
    nonce?: string;
    nextPath?: string;
  };
  if (!parsed.nonce) {
    throw new Error("STATE_INVALID");
  }

  return {
    nonce: parsed.nonce,
    nextPath: sanitizeNextPath(parsed.nextPath),
  };
}

export function createExternalAuthorizationRequest(nextPath?: string | null) {
  const settings = getExternalAuthSettings();
  if (!settings) {
    throw new Error("EXTERNAL_AUTH_NOT_CONFIGURED");
  }

  const statePayload = buildStatePayload(nextPath);
  const signedState = buildSignedSessionValue(statePayload);

  cookies().set(EXTERNAL_AUTH_STATE_COOKIE_NAME, signedState, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: EXTERNAL_AUTH_STATE_TTL_SECONDS,
  });

  const authorizationUrl = new URL(settings.authorizeUrl);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("client_id", settings.clientId);
  authorizationUrl.searchParams.set("redirect_uri", settings.redirectUri);
  authorizationUrl.searchParams.set("scope", settings.scope);
  authorizationUrl.searchParams.set("state", signedState);

  return authorizationUrl.toString();
}

export function consumeExternalState(state: string) {
  const cookieValue = cookies().get(EXTERNAL_AUTH_STATE_COOKIE_NAME)?.value;
  cookies().set(EXTERNAL_AUTH_STATE_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  if (!cookieValue || cookieValue !== state) {
    throw new Error("STATE_MISMATCH");
  }

  const payload = verifySignedSessionValue(state);
  if (!payload) {
    throw new Error("STATE_INVALID");
  }

  return parseStatePayload(payload);
}

export async function authorizeExternalIdentity(identity: ExternalIdentity) {
  const email = normalizeEmail(identity.email);
  const usuario = await prisma.usuario.findUnique({
    where: { email },
  });

  if (!usuario || !usuario.activo) {
    return { ok: false as const, error: "Usuario no autorizado." };
  }

  if (usuario.authSubject && usuario.authSubject !== identity.subject) {
    return {
      ok: false as const,
      error: "La identidad externa no coincide con la cuenta autorizada.",
    };
  }

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      nombre: identity.name?.trim() || usuario.nombre,
      iniciales:
        usuario.iniciales || deriveInitials(identity.name?.trim() || usuario.nombre, email),
      authProvider: AuthProvider.GVA,
      authSubject: identity.subject,
      lastLoginAt: new Date(),
    },
  });

  await createUserSession(usuario.id);

  return {
    ok: true as const,
    nextPath: "/",
  };
}
