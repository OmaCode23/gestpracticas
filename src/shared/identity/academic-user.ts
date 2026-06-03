import { AuthProvider, Prisma, type UserRole } from "@prisma/client";
import { isLocalAuthMode } from "@/modules/auth/config";
import { deriveInitials, normalizeEmail } from "@/modules/auth/core";

export type AcademicLinkedEntity = "ALUMNO" | "PROFESOR";

export class AcademicUserSyncError extends Error {
  constructor(
    public readonly code:
      | "ACADEMIC_USER_ROLE_CONFLICT"
      | "ACADEMIC_USER_EMAIL_TAKEN"
      | "ACADEMIC_USER_LOCAL_AUTH_EMAIL_TAKEN"
  ) {
    super(code);
  }
}

function getDefaultRoleForEntity(entity: AcademicLinkedEntity): UserRole {
  return entity === "ALUMNO" ? "ALUMNO" : "PROFESOR";
}

function isRoleCompatibleWithEntity(role: UserRole, entity: AcademicLinkedEntity) {
  if (entity === "ALUMNO") {
    return role === "ALUMNO";
  }

  return role === "PROFESOR" || role === "ADMIN";
}

function getSyncedRole(currentRole: UserRole | null, entity: AcademicLinkedEntity): UserRole {
  if (entity === "PROFESOR" && currentRole === "ADMIN") {
    return "ADMIN";
  }

  return getDefaultRoleForEntity(entity);
}

export async function syncAcademicUserIdentity(
  tx: Prisma.TransactionClient,
  input: {
    entity: AcademicLinkedEntity;
    nombre: string;
    email: string;
    previousEmail?: string | null;
    defaultActivo?: boolean;
  }
) {
  const nombre = input.nombre.trim();
  const email = normalizeEmail(input.email);
  const previousEmail = input.previousEmail ? normalizeEmail(input.previousEmail) : null;

  const [userByCurrentEmail, userByPreviousEmail] = await Promise.all([
    tx.usuario.findUnique({
      where: { email },
      select: { id: true, rol: true, email: true },
    }),
    previousEmail && previousEmail !== email
      ? tx.usuario.findUnique({
          where: { email: previousEmail },
          select: { id: true, rol: true, email: true },
        })
      : Promise.resolve(null),
  ]);

  if (userByCurrentEmail && userByPreviousEmail && userByCurrentEmail.id !== userByPreviousEmail.id) {
    throw new AcademicUserSyncError("ACADEMIC_USER_EMAIL_TAKEN");
  }

  const existingUser = userByCurrentEmail ?? userByPreviousEmail;

  if (previousEmail && previousEmail !== email) {
    const localAuthAtNewEmail = await tx.localAuthAccount.findUnique({
      where: { email },
      select: { id: true },
    });

    if (localAuthAtNewEmail) {
      throw new AcademicUserSyncError("ACADEMIC_USER_LOCAL_AUTH_EMAIL_TAKEN");
    }
  }

  if (existingUser && !isRoleCompatibleWithEntity(existingUser.rol, input.entity)) {
    throw new AcademicUserSyncError("ACADEMIC_USER_ROLE_CONFLICT");
  }

  const iniciales = deriveInitials(nombre, email);
  const role = getSyncedRole(existingUser?.rol ?? null, input.entity);

  const usuario = existingUser
    ? await tx.usuario.update({
        where: { id: existingUser.id },
        data: {
          nombre,
          email,
          iniciales,
          rol: role,
        },
      })
    : await tx.usuario.create({
        data: {
          nombre,
          email,
          iniciales,
          rol: role,
          activo: input.defaultActivo ?? false,
          authProvider: isLocalAuthMode() ? AuthProvider.LOCAL : null,
        },
      });

  if (previousEmail && previousEmail !== email) {
    await tx.localAuthAccount.updateMany({
      where: { email: previousEmail },
      data: { email },
    });
  }

  return usuario;
}

export async function syncAcademicUserRemoval(
  tx: Prisma.TransactionClient,
  input: {
    entity: AcademicLinkedEntity;
    email: string;
  }
) {
  const email = normalizeEmail(input.email);
  const usuario = await tx.usuario.findUnique({
    where: { email },
    select: { id: true, rol: true, activo: true },
  });

  if (!usuario) {
    return null;
  }

  if (input.entity === "PROFESOR" && usuario.rol === "ADMIN") {
    return usuario;
  }

  if (!usuario.activo) {
    return usuario;
  }

  return tx.usuario.update({
    where: { id: usuario.id },
    data: {
      activo: false,
    },
  });
}
