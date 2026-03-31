import type { PrismaClient } from "@prisma/client";

export const ALUMNO_CV_MAX_BYTES = 100 * 1024;
export const ALUMNO_CV_ACCEPTED_MIME_TYPES = ["application/pdf"] as const;

type PrismaTransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

function ensureSupportedMimeType(mimeType: string) {
  if (!ALUMNO_CV_ACCEPTED_MIME_TYPES.includes(mimeType as (typeof ALUMNO_CV_ACCEPTED_MIME_TYPES)[number])) {
    throw new Error("CV_MIME_TYPE_INVALIDO");
  }
}

function ensureSupportedSize(size: number) {
  if (size > ALUMNO_CV_MAX_BYTES) {
    throw new Error("CV_SIZE_EXCEEDED");
  }
}

export async function deleteAlumnoCvLo(tx: PrismaTransactionClient, cvOid: number) {
  await tx.$executeRawUnsafe("SELECT lo_unlink($1)", cvOid);
}

async function createAlumnoCvLo(tx: PrismaTransactionClient, buffer: Buffer) {
  const rows = await tx.$queryRawUnsafe<Array<{ oid: number }>>(
    "SELECT lo_from_bytea(0, $1) AS oid",
    buffer
  );

  const oid = Number(rows[0]?.oid);

  if (!oid) {
    throw new Error("CV_LO_CREATE_FAILED");
  }

  return oid;
}

export async function saveAlumnoCv(input: {
  tx: PrismaTransactionClient;
  alumnoId: number;
  fileName: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
}) {
  ensureSupportedMimeType(input.mimeType);
  ensureSupportedSize(input.size);

  const existing = await input.tx.alumno.findUnique({
    where: { id: input.alumnoId },
    select: { cvOid: true },
  });

  const cvOid = await createAlumnoCvLo(input.tx, input.buffer);

  await input.tx.alumno.update({
    where: { id: input.alumnoId },
    data: {
      cvOid,
      cvNombre: input.fileName,
      cvMimeType: input.mimeType,
      cvTamano: input.size,
      cvUpdatedAt: new Date(),
    },
  });

  if (existing?.cvOid) {
    await deleteAlumnoCvLo(input.tx, existing.cvOid);
  }

  return cvOid;
}

export async function clearAlumnoCv(tx: PrismaTransactionClient, alumnoId: number) {
  const alumno = await tx.alumno.findUnique({
    where: { id: alumnoId },
    select: { cvOid: true },
  });

  if (alumno?.cvOid) {
    await deleteAlumnoCvLo(tx, alumno.cvOid);
  }

  await tx.alumno.update({
    where: { id: alumnoId },
    data: {
      cvOid: null,
      cvNombre: null,
      cvMimeType: null,
      cvTamano: null,
      cvUpdatedAt: null,
    },
  });
}

export async function readAlumnoCv(tx: PrismaTransactionClient, alumnoId: number) {
  const alumno = await tx.alumno.findUnique({
    where: { id: alumnoId },
    select: {
      cvOid: true,
      cvNombre: true,
      cvMimeType: true,
      cvTamano: true,
    },
  });

  if (!alumno?.cvOid || !alumno.cvNombre || !alumno.cvMimeType || !alumno.cvTamano) {
    return null;
  }

  const rows = await tx.$queryRawUnsafe<Array<{ data: Buffer }>>(
    "SELECT lo_get($1) AS data",
    alumno.cvOid
  );

  const buffer = rows[0]?.data;

  if (!buffer) {
    return null;
  }

  return {
    fileName: alumno.cvNombre,
    mimeType: alumno.cvMimeType,
    size: alumno.cvTamano,
    buffer,
  };
}
