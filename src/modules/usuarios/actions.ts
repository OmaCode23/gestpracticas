import { AuthProvider, type UserRole } from "@prisma/client";
import { prisma } from "@/database/prisma";
import { isLocalAuthMode } from "@/modules/auth/config";
import { deriveInitials, hashPassword, normalizeEmail } from "@/modules/auth/core";

type LinkedEntityType = "ALUMNO" | "PROFESOR" | "NONE";

function getLinkedEntityType(alumnoExists: boolean, profesorExists: boolean): LinkedEntityType {
  if (alumnoExists) {
    return "ALUMNO";
  }

  if (profesorExists) {
    return "PROFESOR";
  }

  return "NONE";
}

function getAllowedRoleTargets(
  linkedEntityType: LinkedEntityType,
  currentRole: UserRole
): readonly UserRole[] {
  switch (linkedEntityType) {
    case "ALUMNO":
      return ["ALUMNO"];
    case "PROFESOR":
      return ["PROFESOR", "ADMIN"];
    default:
      return [currentRole];
  }
}

export async function listManagedUsers() {
  const users = await prisma.usuario.findMany({
    orderBy: [{ rol: "asc" }, { nombre: "asc" }],
  });
  const emails = users.map((user) => user.email);

  const [localAuthAccounts, alumnos, profesores] = await Promise.all([
    prisma.localAuthAccount.findMany({
      select: {
        email: true,
        mustChangePass: true,
      },
    }),
    emails.length > 0
      ? prisma.alumno.findMany({
          where: { email: { in: emails } },
          select: { email: true },
        })
      : Promise.resolve([]),
    emails.length > 0
      ? prisma.profesor.findMany({
          where: { email: { in: emails } },
          select: { email: true },
        })
      : Promise.resolve([]),
  ]);

  const localAuthByEmail = new Map(
    localAuthAccounts.map((account) => [account.email, account])
  );
  const alumnoEmails = new Set(alumnos.map((item) => item.email));
  const profesorEmails = new Set(profesores.map((item) => item.email));

  return users.map((user) => ({
    ...(function deriveIdentityFlags() {
      const linkedEntityType = getLinkedEntityType(
        alumnoEmails.has(user.email),
        profesorEmails.has(user.email)
      );

      return {
        linkedEntityType,
        nameEditable: linkedEntityType === "NONE",
        roleEditable: linkedEntityType === "PROFESOR",
        deleteAllowed: linkedEntityType === "NONE" && user.rol === "ADMIN",
        allowedRoleTargets: [...getAllowedRoleTargets(linkedEntityType, user.rol)],
      };
    })(),
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

  const [alumnoLinked, profesorLinked] = await Promise.all([
    prisma.alumno.findFirst({
      where: {
        email: {
          equals: user.email,
          mode: "insensitive",
        },
      },
      select: { id: true },
    }),
    prisma.profesor.findFirst({
      where: {
        email: {
          equals: user.email,
          mode: "insensitive",
        },
      },
      select: { id: true },
    }),
  ]);

  const linkedEntityType = getLinkedEntityType(Boolean(alumnoLinked), Boolean(profesorLinked));
  if (linkedEntityType !== "NONE" || user.rol !== "ADMIN") {
    throw new Error("MANAGED_USER_DELETE_LOCKED");
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
  if (input.rol !== "ADMIN") {
    throw new Error("MANAGED_USER_CREATE_ADMIN_ONLY");
  }

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
  actorUserId: number,
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
    select: { email: true, nombre: true, rol: true },
  });

  if (!existingUser) {
    throw new Error("USER_NOT_FOUND");
  }

  if (userId === actorUserId && input.activo === false) {
    throw new Error("CANNOT_DEACTIVATE_SELF");
  }

  const [alumnoLinked, profesorLinked] = await Promise.all([
    prisma.alumno.findFirst({
      where: {
        email: {
          equals: existingUser.email,
          mode: "insensitive",
        },
      },
      select: { id: true },
    }),
    prisma.profesor.findFirst({
      where: {
        email: {
          equals: existingUser.email,
          mode: "insensitive",
        },
      },
      select: { id: true },
    }),
  ]);

  const linkedEntityType = getLinkedEntityType(Boolean(alumnoLinked), Boolean(profesorLinked));
  const allowedRoleTargets = getAllowedRoleTargets(linkedEntityType, existingUser.rol);

  if (linkedEntityType !== "NONE" && existingUser.nombre !== input.nombre.trim()) {
    throw new Error("MANAGED_USER_NAME_LOCKED");
  }

  if (linkedEntityType !== "NONE" && existingUser.email !== email) {
    throw new Error("MANAGED_USER_EMAIL_LOCKED");
  }

  if (
    input.rol !== existingUser.rol &&
    !allowedRoleTargets.includes(input.rol)
  ) {
    throw new Error("MANAGED_USER_ROLE_LOCKED");
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
