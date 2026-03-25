import { NextResponse } from "next/server";
import { getImportExportLogs } from "@/modules/importexport/actions/logs";
import type { ApiResponse } from "@/shared/types/api";

export async function GET() {
  try {
    const logs = await getImportExportLogs();
    const serializedLogs = logs.map((log) => ({
      id: log.id,
      entidad: log.entidad,
      accion: log.accion,
      registros: log.registros,
      estado: log.estado,
      usuario: log.usuario?.nombre ?? log.usuarioNombre,
      detalle: log.detalle,
      createdAt: log.createdAt.toISOString(),
    }));

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
