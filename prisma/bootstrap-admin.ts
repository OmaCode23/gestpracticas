import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { PrismaClient, UserRole } from "@prisma/client";
import { deriveInitials, hashPassword, normalizeEmail } from "../src/modules/auth/core";
import { getAuthMode, isLocalAuthMode } from "../src/modules/auth/config";

const prisma = new PrismaClient();

type BootstrapArgs = {
  email: string;
  password: string | null;
  nombre: string;
};

function readArg(flag: string) {
  const index = process.argv.findIndex((value) => value === flag);
  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

async function promptValue(question: string) {
  const rl = createInterface({ input, output });

  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

async function readBootstrapArgs(): Promise<BootstrapArgs> {
  const authMode = getAuthMode();
  const email =
    readArg("--email") ??
    process.env.BOOTSTRAP_ADMIN_EMAIL ??
    (await promptValue("Email del administrador inicial: "));
  const nombre =
    readArg("--name") ??
    process.env.BOOTSTRAP_ADMIN_NAME ??
    "Administrador GestPracticas";

  if (!email) {
    throw new Error("Debes indicar el email del administrador inicial.");
  }

  if (!isLocalAuthMode()) {
    return {
      email: normalizeEmail(email),
      password: null,
      nombre: nombre.trim(),
    };
  }

  const password =
    readArg("--password") ??
    process.env.BOOTSTRAP_ADMIN_PASSWORD ??
    (await promptValue("Contrasena temporal del administrador inicial: "));

  if (!password) {
    throw new Error(
      "En modo local debes indicar --password o definir BOOTSTRAP_ADMIN_PASSWORD."
    );
  }

  console.log(`Bootstrap de administrador en modo ${authMode}.`);

  return {
    email: normalizeEmail(email),
    password,
    nombre: nombre.trim(),
  };
}

async function main() {
  const input = await readBootstrapArgs();
  const passwordHash = input.password ? await hashPassword(input.password) : null;

  const usuario = await prisma.usuario.upsert({
    where: { email: input.email },
    update: {
      nombre: input.nombre,
      iniciales: deriveInitials(input.nombre, input.email),
      rol: UserRole.ADMIN,
      activo: true,
      authProvider: null,
      authSubject: null,
    },
    create: {
      nombre: input.nombre,
      email: input.email,
      iniciales: deriveInitials(input.nombre, input.email),
      rol: UserRole.ADMIN,
      activo: true,
    },
  });

  if (passwordHash) {
    await prisma.localAuthAccount.upsert({
      where: { usuarioId: usuario.id },
      update: {
        passwordHash,
        mustChangePass: true,
      },
      create: {
        usuarioId: usuario.id,
        passwordHash,
        mustChangePass: true,
      },
    });
  } else {
    await prisma.localAuthAccount.deleteMany({
      where: { usuarioId: usuario.id },
    });
  }

  console.log(`Administrador preparado: ${usuario.email}`);
}

main()
  .catch((error) => {
    console.error("Error al preparar el administrador inicial:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
