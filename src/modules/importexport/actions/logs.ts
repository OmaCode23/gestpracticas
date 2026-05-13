import { prisma } from "@/database/prisma";
import { getOptionalSession } from "@/modules/auth/session";
import { getResultadosPorPaginaConfigurados } from "@/modules/settings/actions/queries";

type LogAction = "Importacion" | "Exportacion";
type LogStatus = "Completado" | "Fallido";

/**
 * Usuario tecnico utilizado mientras el modulo no tenga autenticacion real.
 */
const DEFAULT_USER = {
  nombre: "Sistema Import/Export",
  email: "sistema.importexport@gestpracticas.local",
  iniciales: "SI",
};

/**
 * Garantiza que siempre exista un usuario asociado a los logs del modulo.
 */
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

async function getCurrentAuditUser() {
  try {
    const session = await getOptionalSession();
    if (session?.user) {
      return prisma.usuario.findUnique({
        where: { id: session.user.id },
      });
    }
  } catch {
    // Algunas pruebas o ejecuciones fuera de request pueden no disponer de cookies.
  }

  return getOrCreateDefaultUser();
}

/**
 * Crea una entrada en el historial de importaciones/exportaciones.
 */
export async function createImportExportLog(input: {
  entidad: string;
  accion: LogAction;
  registros: number;
  estado: LogStatus;
  usuarioNombre?: string;
  detalle?: string;
}) {
  const usuario = await getCurrentAuditUser();

  if (!usuario) {
    throw new Error("No se pudo resolver el usuario para el log de auditoria.");
  }

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

/**
 * Recupera el historial paginado aplicando filtros opcionales por entidad, accion y estado.
 */
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
  const defaultPerPage = await getResultadosPorPaginaConfigurados();
  const perPage = input?.limit ?? defaultPerPage;

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
