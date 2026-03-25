import { prisma } from "@/database/prisma";

type LogAction = "Importacion" | "Exportacion";
type LogStatus = "Completado" | "Fallido";

const DEFAULT_USER = {
  nombre: "Administrador",
  email: "admin@gestpracticas.local",
  iniciales: "AD",
};

async function getOrCreateDefaultUser() {
  return prisma.usuario.upsert({
    where: { email: DEFAULT_USER.email },
    update: {
      nombre: DEFAULT_USER.nombre,
      iniciales: DEFAULT_USER.iniciales,
      activo: true,
    },
    create: DEFAULT_USER,
  });
}

export async function createImportExportLog(input: {
  entidad: string;
  accion: LogAction;
  registros: number;
  estado: LogStatus;
  usuarioNombre?: string;
  detalle?: string;
}) {
  const usuario = await getOrCreateDefaultUser();

  return prisma.importExportLog.create({
    data: {
      entidad: input.entidad,
      accion: input.accion,
      registros: input.registros,
      estado: input.estado,
      usuarioId: usuario.id,
      usuarioNombre: input.usuarioNombre ?? usuario.nombre,
      detalle: input.detalle?.trim() || null,
    },
    include: {
      usuario: true,
    },
  });
}

export async function getImportExportLogs(input?: {
  limit?: number;
  page?: number;
  entidad?: string;
  accion?: string;
  estado?: string;
}) {
  const where = {
    ...(input?.entidad ? { entidad: input.entidad } : {}),
    ...(input?.accion ? { accion: input.accion } : {}),
    ...(input?.estado ? { estado: input.estado } : {}),
  };
  const page = Math.max(1, input?.page ?? 1);
  const perPage = input?.limit ?? 5;

  const [items, total] = await Promise.all([
    prisma.importExportLog.findMany({
      where,
      include: {
        usuario: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.importExportLog.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}
