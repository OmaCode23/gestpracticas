import { NextRequest, NextResponse } from "next/server";
import { getImportExportLogs } from "@/modules/importexport/actions/logs";
import type { ApiResponse } from "@/shared/types/api";

/**
 * Devuelve el historial paginado del modulo de importacion/exportacion.
 * Acepta filtros opcionales por query string.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    // La ruta convierte los parametros de URL en el contrato tipado del modulo.
    const paginatedLogs = await getImportExportLogs({
      page: Number(searchParams.get("page") || 1),
      limit: Number(searchParams.get("limit") || 5),
      entidad: searchParams.get("entidad") || undefined,
      accion: searchParams.get("accion") || undefined,
      estado: searchParams.get("estado") || undefined,
    });

    // Se serializan fechas y nombre de usuario para que el cliente reciba un payload plano.
    const serializedLogs = {
      ...paginatedLogs,
      items: paginatedLogs.items.map((log) => ({
        id: log.id,
        entidad: log.entidad,
        accion: log.accion,
        registros: log.registros,
        estado: log.estado,
        usuario: log.usuario?.nombre ?? log.usuarioNombre,
        detalle: log.detalle,
        createdAt: log.createdAt.toISOString(),
      })),
    };

    return NextResponse.json<ApiResponse<typeof serializedLogs>>({
      ok: true,
      data: serializedLogs,
    });
  } catch (error) {
    console.error("[GET /api/importexport/logs]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al obtener el historial de importacion y exportacion" },
      { status: 500 }
    );
  }
}
