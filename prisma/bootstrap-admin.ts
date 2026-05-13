import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { randomBytes, scrypt as nodeScrypt } from "node:crypto";
import { promisify } from "node:util";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();
const scrypt = promisify(nodeScrypt);
const PASSWORD_KEY_LENGTH = 64;

type BootstrapArgs = {
  email: string;
  password: string | null;
  nombre: string;
};

function getAuthMode() {
  return process.env.AUTH_MODE?.trim().toLowerCase() === "external" ? "external" : "local";
}

function isLocalAuthMode() {
  return getAuthMode() === "local";
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function deriveInitials(nombre: string, email?: string) {
  const source = nombre.trim();
  if (source) {
    const initials = source
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((segment) => segment[0]?.toUpperCase() ?? "")
      .join("");

    if (initials) {
      return initials;
    }
  }

  return email ? normalizeEmail(email).slice(0, 2).toUpperCase() : "US";
}

function toBase64Url(buffer: Buffer) {
  return buffer.toString("base64url");
}

async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, PASSWORD_KEY_LENGTH)) as Buffer;
  return `${toBase64Url(salt)}:${toBase64Url(derived)}`;
}

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
    (await promptValue("Contraseña temporal del administrador inicial: "));

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
      where: { email: usuario.email },
      update: {
        passwordHash,
        mustChangePass: true,
      },
      create: {
        email: usuario.email,
        passwordHash,
        mustChangePass: true,
      },
    });
  } else {
    await prisma.localAuthAccount.deleteMany({
      where: { email: usuario.email },
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
