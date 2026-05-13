import { AuthProvider, type UserRole } from "@prisma/client";
import { prisma } from "@/database/prisma";
import { isLocalAuthMode } from "@/modules/auth/config";
import { deriveInitials, hashPassword, normalizeEmail } from "@/modules/auth/core";

export async function listManagedUsers() {
  const users = await prisma.usuario.findMany({
    orderBy: [{ rol: "asc" }, { nombre: "asc" }],
  });

  const localAuthAccounts = await prisma.localAuthAccount.findMany({
    select: {
      email: true,
      mustChangePass: true,
    },
  });

  const localAuthByEmail = new Map(
    localAuthAccounts.map((account) => [account.email, account])
  );

  return users.map((user) => ({
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    iniciales: user.iniciales,
    rol: user.rol,
    activo: user.activo,
    authProvider: user.authProvider,
    lastLoginAt: user.lastLoginAt,
    mustChangePass: localAuthByEmail.get(user.email)?.mustChangePass ?? false,
    hasLocalAuth: localAuthByEmail.has(user.email),
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
      email: true,
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

  await prisma.$transaction([
    prisma.localAuthAccount.deleteMany({
      where: { email: user.email },
    }),
    prisma.usuario.delete({
      where: { id: userId },
    }),
  ]);
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
    },
  });

  if (passwordHash) {
    await prisma.localAuthAccount.create({
      data: {
        email,
        passwordHash,
        mustChangePass: true,
      },
    });
  }

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
  const existingUser = await prisma.usuario.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!existingUser) {
    throw new Error("USER_NOT_FOUND");
  }

  const updatedUser = await prisma.usuario.update({
    where: { id: userId },
    data: {
      nombre: input.nombre.trim(),
      email,
      iniciales: deriveInitials(input.nombre, email),
      rol: input.rol,
      activo: input.activo,
    },
  });

  if (existingUser.email !== email) {
    await prisma.localAuthAccount.updateMany({
      where: { email: existingUser.email },
      data: { email },
    });
  }

  return updatedUser;
}

export async function resetManagedUserPassword(userId: number, password: string) {
  if (!isLocalAuthMode()) {
    throw new Error("PASSWORD_RESET_NOT_AVAILABLE");
  }

  const user = await prisma.usuario.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  const passwordHash = await hashPassword(password);

  return prisma.localAuthAccount.upsert({
    where: { email: user.email },
    update: {
      passwordHash,
      mustChangePass: true,
    },
    create: {
      email: user.email,
      passwordHash,
      mustChangePass: true,
    },
  });
}
