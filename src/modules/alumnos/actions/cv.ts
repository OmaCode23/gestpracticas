import type { PrismaClient } from "@prisma/client";

export const ALUMNO_CV_MAX_BYTES = 500 * 1024;
export const ALUMNO_CV_ACCEPTED_MIME_TYPES = ["application/pdf"] as const;

type PrismaTransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

type AlumnoCvRecord = {
  id: number;
  nombre: string;
  nia: string;
  cvOid: number;
  cvNombre: string;
  cvMimeType: string;
  cvTamano: number;
};

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

function sanitizeFileSegment(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w.-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

function ensurePdfFileName(fileName: string) {
  return fileName.toLowerCase().endsWith(".pdf") ? fileName : `${fileName}.pdf`;
}

function buildCvArchiveFileName(input: { nombre: string; nia: string; originalName: string }) {
  const baseName = sanitizeFileSegment(input.nombre) || `alumno_${input.nia}`;
  const nia = sanitizeFileSegment(input.nia) || String(Date.now());
  const originalName = sanitizeFileSegment(
    input.originalName.replace(/\.pdf$/i, "")
  );

  return ensurePdfFileName(
    [nia, baseName, originalName].filter(Boolean).join("_")
  );
}

function getDosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const dosTime =
    ((date.getHours() & 0x1f) << 11) |
    ((date.getMinutes() & 0x3f) << 5) |
    Math.floor(date.getSeconds() / 2);
  const dosDate =
    (((year - 1980) & 0x7f) << 9) |
    (((date.getMonth() + 1) & 0x0f) << 5) |
    (date.getDate() & 0x1f);

  return { dosDate, dosTime };
}

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);

  for (let i = 0; i < 256; i += 1) {
    let crc = i;
    for (let j = 0; j < 8; j += 1) {
      crc = (crc & 1) === 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
    table[i] = crc >>> 0;
  }

  return table;
})();

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function buildStoredZip(files: Array<{ fileName: string; data: Buffer }>) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const fileNameBuffer = Buffer.from(file.fileName, "utf8");
    const { dosDate, dosTime } = getDosDateTime();
    const checksum = crc32(file.data);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(file.data.length, 18);
    localHeader.writeUInt32LE(file.data.length, 22);
    localHeader.writeUInt16LE(fileNameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, fileNameBuffer, file.data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(file.data.length, 20);
    centralHeader.writeUInt32LE(file.data.length, 24);
    centralHeader.writeUInt16LE(fileNameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(centralHeader, fileNameBuffer);
    offset += localHeader.length + fileNameBuffer.length + file.data.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const localDirectory = Buffer.concat(localParts);
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(files.length, 8);
  endRecord.writeUInt16LE(files.length, 10);
  endRecord.writeUInt32LE(centralDirectory.length, 12);
  endRecord.writeUInt32LE(localDirectory.length, 16);
  endRecord.writeUInt16LE(0, 20);

  return Buffer.concat([localDirectory, centralDirectory, endRecord]);
}

export async function readAllAlumnosCv(tx: PrismaTransactionClient) {
  const alumnos = await tx.alumno.findMany({
    where: {
      cvOid: { not: null },
      cvNombre: { not: null },
      cvMimeType: { not: null },
      cvTamano: { not: null },
    },
    orderBy: { nombre: "asc" },
    select: {
      id: true,
      nombre: true,
      nia: true,
      cvOid: true,
      cvNombre: true,
      cvMimeType: true,
      cvTamano: true,
    },
  });

  const validRecords = alumnos.filter(
    (alumno): alumno is AlumnoCvRecord =>
      alumno.cvOid !== null &&
      alumno.cvNombre !== null &&
      alumno.cvMimeType !== null &&
      alumno.cvTamano !== null
  );

  const files: Array<{ fileName: string; data: Buffer }> = [];

  for (const alumno of validRecords) {
    const rows = await tx.$queryRawUnsafe<Array<{ data: Buffer }>>(
      "SELECT lo_get($1) AS data",
      alumno.cvOid
    );
    const buffer = rows[0]?.data;

    if (!buffer) continue;

    files.push({
      fileName: buildCvArchiveFileName({
        nombre: alumno.nombre,
        nia: alumno.nia,
        originalName: alumno.cvNombre,
      }),
      data: buffer,
    });
  }

  if (files.length === 0) {
    return null;
  }

  return {
    count: files.length,
    zipBuffer: buildStoredZip(files),
  };
}

export async function clearAllAlumnosCv(tx: PrismaTransactionClient) {
  const alumnos = await tx.alumno.findMany({
    where: {
      cvOid: { not: null },
    },
    select: {
      id: true,
      cvOid: true,
    },
  });

  for (const alumno of alumnos) {
    if (alumno.cvOid) {
      await deleteAlumnoCvLo(tx, alumno.cvOid);
    }
  }

  if (alumnos.length > 0) {
    await tx.alumno.updateMany({
      where: {
        id: { in: alumnos.map((alumno) => alumno.id) },
      },
      data: {
        cvOid: null,
        cvNombre: null,
        cvMimeType: null,
        cvTamano: null,
        cvUpdatedAt: null,
      },
    });
  }

  return alumnos.length;
}
