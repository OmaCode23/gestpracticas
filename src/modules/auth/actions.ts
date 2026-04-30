import { AuthProvider } from "@prisma/client";
import { prisma } from "@/database/prisma";
import { getAuthMode, isLocalAuthMode } from "@/modules/auth/config";
import {
  deriveInitials,
  hashPassword,
  normalizeEmail,
  verifyPassword,
} from "@/modules/auth/core";
import {
  createUserSession,
  getOptionalSession,
  invalidateCurrentSession,
  requireApiUserSession,
} from "@/modules/auth/session";

export type LoginResult =
  | { ok: true; mustChangePass: boolean }
  | { ok: false; error: string };

export async function loginWithLocalCredentials(email: string, password: string): Promise<LoginResult> {
  if (!isLocalAuthMode()) {
    return {
      ok: false,
      error: "El modo de autenticacion externo aun no esta integrado en esta aplicacion.",
    };
  }

  const normalizedEmail = normalizeEmail(email);

  const usuario = await prisma.usuario.findUnique({
    where: { email: normalizedEmail },
    include: { localAuth: true },
  });

  if (!usuario || !usuario.activo || !usuario.localAuth) {
    return { ok: false, error: "Credenciales no validas." };
  }

  const passwordIsValid = await verifyPassword(password, usuario.localAuth.passwordHash);
  if (!passwordIsValid) {
    return { ok: false, error: "Credenciales no validas." };
  }

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      email: normalizedEmail,
      iniciales: usuario.iniciales ?? deriveInitials(usuario.nombre, normalizedEmail),
      authProvider: AuthProvider.LOCAL,
      lastLoginAt: new Date(),
    },
  });

  await createUserSession(usuario.id);

  return { ok: true, mustChangePass: usuario.localAuth.mustChangePass };
}

export async function logoutCurrentUser() {
  await invalidateCurrentSession();
}

export async function getCurrentSessionSummary() {
  const session = await getOptionalSession();
  if (!session) {
    return {
      authMode: getAuthMode(),
      session: null,
    };
  }

  return {
    authMode: getAuthMode(),
    session: {
      user: session.user,
      expiresAt: session.expiresAt,
    },
  };
}

export async function changeOwnPassword(currentPassword: string, newPassword: string) {
  if (!isLocalAuthMode()) {
    return {
      ok: false as const,
      error: "Las contrasenas se gestionan en el proveedor externo.",
    };
  }

  const session = await requireApiUserSession();

  if (!session) {
    return { ok: false as const, error: "No autenticado." };
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    include: { localAuth: true },
  });

  if (!usuario?.localAuth) {
    return {
      ok: false as const,
      error: "La cuenta actual no admite cambio de contrasena local.",
    };
  }

  const passwordIsValid = await verifyPassword(currentPassword, usuario.localAuth.passwordHash);
  if (!passwordIsValid) {
    return { ok: false as const, error: "La contrasena actual no es correcta." };
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.localAuthAccount.update({
    where: { usuarioId: usuario.id },
    data: {
      passwordHash,
      mustChangePass: false,
    },
  });

  return { ok: true as const };
}
