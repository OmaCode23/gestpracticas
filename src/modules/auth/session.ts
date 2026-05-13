import type { UserRole } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/database/prisma";
import { AUTH_COOKIE_NAME, isLocalAuthMode } from "@/modules/auth/config";
import { isAdminRole } from "@/modules/auth/permissions";
import {
  buildSignedSessionValue,
  generateSessionToken,
  getSessionExpirationDate,
  hashSessionToken,
  verifySignedSessionValue,
} from "@/modules/auth/core";

export type AuthenticatedUser = {
  id: number;
  nombre: string;
  email: string;
  iniciales: string | null;
  rol: UserRole;
  activo: boolean;
  mustChangePass: boolean;
};

export type AuthSession = {
  sessionId: number;
  expiresAt: Date;
  user: AuthenticatedUser;
};

function buildCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

export async function createUserSession(usuarioId: number) {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = getSessionExpirationDate();

  await prisma.session.create({
    data: {
      usuarioId,
      tokenHash,
      expiresAt,
      lastUsedAt: new Date(),
    },
  });

  cookies().set(AUTH_COOKIE_NAME, buildSignedSessionValue(token), buildCookieOptions());
}

export async function invalidateCurrentSession() {
  const signedValue = cookies().get(AUTH_COOKIE_NAME)?.value;
  const token = verifySignedSessionValue(signedValue);

  if (token) {
    await prisma.session.deleteMany({
      where: {
        tokenHash: hashSessionToken(token),
      },
    });
  }

  cookies().set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getOptionalSession(): Promise<AuthSession | null> {
  const signedValue = cookies().get(AUTH_COOKIE_NAME)?.value;
  const token = verifySignedSessionValue(signedValue);

  if (!token) {
    return null;
  }

  const tokenHash = hashSessionToken(token);
  const now = new Date();
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      usuario: true,
    },
  });

  if (!session || session.expiresAt <= now || !session.usuario.activo) {
    return null;
  }

  const localAuth = session.usuario.email
    ? await prisma.localAuthAccount.findUnique({
        where: { email: session.usuario.email },
        select: { mustChangePass: true },
      })
    : null;

  await prisma.session.update({
    where: { id: session.id },
    data: {
      lastUsedAt: now,
    },
  });

  return {
    sessionId: session.id,
    expiresAt: session.expiresAt,
    user: {
      id: session.usuario.id,
      nombre: session.usuario.nombre,
      email: session.usuario.email,
      iniciales: session.usuario.iniciales,
      rol: session.usuario.rol,
      activo: session.usuario.activo,
      mustChangePass: localAuth?.mustChangePass ?? false,
    },
  };
}

export async function requireUserSession(nextPath?: string) {
  const session = await getOptionalSession();

  if (!session) {
    const search = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/login${search}`);
  }

  if (isLocalAuthMode() && session.user.mustChangePass && nextPath !== "/cuenta/password") {
    redirect("/cuenta/password");
  }

  return session;
}

export async function requireAdminSession(nextPath?: string) {
  const session = await requireUserSession(nextPath);

  if (!isAdminRole(session.user.rol)) {
    redirect("/");
  }

  return session;
}

export async function requireApiUserSession() {
  return getOptionalSession();
}

export async function requireApiAdminSession() {
  const session = await getOptionalSession();
  if (!session || !isAdminRole(session.user.rol)) {
    return null;
  }

  return session;
}

export async function deleteExpiredSessions() {
  await prisma.session.deleteMany({
    where: {
      expiresAt: {
        lte: new Date(),
      },
    },
  });
}
