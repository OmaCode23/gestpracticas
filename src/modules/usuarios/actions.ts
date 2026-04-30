import { AuthProvider, type UserRole } from "@prisma/client";
import { prisma } from "@/database/prisma";
import { isLocalAuthMode } from "@/modules/auth/config";
import { deriveInitials, hashPassword, normalizeEmail } from "@/modules/auth/core";

export async function listManagedUsers() {
  const users = await prisma.usuario.findMany({
    include: {
      localAuth: {
        select: {
          mustChangePass: true,
        },
      },
    },
    orderBy: [{ rol: "asc" }, { nombre: "asc" }],
  });

  return users.map((user) => ({
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    iniciales: user.iniciales,
    rol: user.rol,
    activo: user.activo,
    authProvider: user.authProvider,
    lastLoginAt: user.lastLoginAt,
    mustChangePass: user.localAuth?.mustChangePass ?? false,
    hasLocalAuth: Boolean(user.localAuth),
  }));
}

export async function deleteManagedUser(userId: number, actorUserId: number) {
  if (userId === actorUserId) {
    throw new Error("CANNOT_DELETE_SELF");
  }

  const user = await prisma.usuario.findUnique({
    where: { id: userId },
    select: {
      id: true,
      rol: true,
      activo: true,
    },
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  if (user.rol === "ADMIN") {
    const adminCount = await prisma.usuario.count({
      where: {
        rol: "ADMIN",
        activo: true,
      },
    });

    if (user.activo && adminCount <= 1) {
      throw new Error("LAST_ACTIVE_ADMIN");
    }
  }

  await prisma.usuario.delete({
    where: { id: userId },
  });
}

export async function createManagedUser(input: {
  nombre: string;
  email: string;
  rol: UserRole;
  activo: boolean;
  password?: string;
}) {
  const email = normalizeEmail(input.email);
  const localMode = isLocalAuthMode();
  const passwordHash = localMode && input.password ? await hashPassword(input.password) : null;

  const usuario = await prisma.usuario.create({
    data: {
      nombre: input.nombre.trim(),
      email,
      iniciales: deriveInitials(input.nombre, email),
      rol: input.rol,
      activo: input.activo,
      authProvider: localMode ? AuthProvider.LOCAL : null,
      ...(passwordHash
        ? {
            localAuth: {
              create: {
                passwordHash,
                mustChangePass: true,
              },
            },
          }
        : {}),
    },
    include: {
      localAuth: true,
    },
  });

  return usuario;
}

export async function updateManagedUser(
  userId: number,
  input: {
    nombre: string;
    email: string;
    rol: UserRole;
    activo: boolean;
  }
) {
  const email = normalizeEmail(input.email);

  return prisma.usuario.update({
    where: { id: userId },
    data: {
      nombre: input.nombre.trim(),
      email,
      iniciales: deriveInitials(input.nombre, email),
      rol: input.rol,
      activo: input.activo,
    },
  });
}

export async function resetManagedUserPassword(userId: number, password: string) {
  if (!isLocalAuthMode()) {
    throw new Error("PASSWORD_RESET_NOT_AVAILABLE");
  }

  const passwordHash = await hashPassword(password);

  return prisma.localAuthAccount.upsert({
    where: { usuarioId: userId },
    update: {
      passwordHash,
      mustChangePass: true,
    },
    create: {
      usuarioId: userId,
      passwordHash,
      mustChangePass: true,
    },
  });
}
