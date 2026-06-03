import { prisma } from "@/database/prisma";
import { normalizeEmail } from "@/modules/auth/core";
import { getEmailDomainsConfig } from "@/modules/settings/actions/queries";

export type AcademicIdentityEntity = "ALUMNO" | "PROFESOR";

export class EmailDomainNotAllowedError extends Error {
  constructor(public readonly entity: AcademicIdentityEntity) {
    super(
      entity === "ALUMNO"
        ? "EMAIL_DOMAIN_NOT_ALLOWED_ALUMNO"
        : "EMAIL_DOMAIN_NOT_ALLOWED_PROFESOR"
    );
  }
}

export function isEmailDomainAllowed(email: string, allowedDomains: string[]): boolean {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  return allowedDomains.map((d) => d.toLowerCase()).includes(domain);
}

export async function assertAcademicEmailDomain(
  email: string,
  entity: AcademicIdentityEntity
): Promise<void> {
  const config = await getEmailDomainsConfig();
  const allowed =
    entity === "ALUMNO" ? config.dominiosAlumnos : config.dominiosProfesores;
  if (!isEmailDomainAllowed(email, allowed)) {
    throw new EmailDomainNotAllowedError(entity);
  }
}

export class AcademicEmailConflictError extends Error {
  constructor(
    public readonly entity: AcademicIdentityEntity,
    public readonly reason: "same-entity" | "other-entity"
  ) {
    super(
      entity === "ALUMNO"
        ? reason === "same-entity"
          ? "EMAIL_YA_EXISTE_EN_ALUMNOS"
          : "EMAIL_EN_USO_POR_ALUMNO"
        : reason === "same-entity"
          ? "EMAIL_YA_EXISTE_EN_PROFESORES"
          : "EMAIL_EN_USO_POR_PROFESOR"
    );
  }
}

function buildInsensitiveEmailOr(emails: string[]) {
  return emails.map((email) => ({
    email: {
      equals: email,
      mode: "insensitive" as const,
    },
  }));
}

export async function assertAcademicEmailAvailable(input: {
  email: string;
  entity: AcademicIdentityEntity;
  excludeId?: number;
}) {
  const email = normalizeEmail(input.email);

  const [alumno, profesor] = await Promise.all([
    prisma.alumno.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
        ...(input.entity === "ALUMNO" && input.excludeId
          ? { NOT: { id: input.excludeId } }
          : {}),
      },
      select: { id: true },
    }),
    prisma.profesor.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
        ...(input.entity === "PROFESOR" && input.excludeId
          ? { NOT: { id: input.excludeId } }
          : {}),
      },
      select: { id: true },
    }),
  ]);

  if (input.entity === "ALUMNO") {
    if (alumno) {
      throw new AcademicEmailConflictError("ALUMNO", "same-entity");
    }
    if (profesor) {
      throw new AcademicEmailConflictError("PROFESOR", "other-entity");
    }
  } else {
    if (profesor) {
      throw new AcademicEmailConflictError("PROFESOR", "same-entity");
    }
    if (alumno) {
      throw new AcademicEmailConflictError("ALUMNO", "other-entity");
    }
  }

  return email;
}

export async function getAcademicEmailUsage(emails: string[]) {
  const normalizedEmails = Array.from(new Set(emails.map(normalizeEmail).filter(Boolean)));

  if (normalizedEmails.length === 0) {
    return {
      alumnos: new Set<string>(),
      profesores: new Set<string>(),
    };
  }

  const emailOr = buildInsensitiveEmailOr(normalizedEmails);

  const [alumnos, profesores] = await Promise.all([
    prisma.alumno.findMany({
      where: {
        OR: emailOr,
      },
      select: { email: true },
    }),
    prisma.profesor.findMany({
      where: {
        OR: emailOr,
      },
      select: { email: true },
    }),
  ]);

  return {
    alumnos: new Set(alumnos.map((item) => normalizeEmail(item.email))),
    profesores: new Set(profesores.map((item) => normalizeEmail(item.email))),
  };
}
