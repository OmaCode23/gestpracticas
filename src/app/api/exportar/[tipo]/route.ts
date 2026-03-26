/**
 * app/api/exportar/[tipo]/route.ts
 *
 * Devuelve los datos en JSON para que el cliente los convierta a Excel.
 *
 * GET /api/exportar/empresas
 */

import { NextRequest, NextResponse } from "next/server";
import { getEmpresasExport } from "@/modules/importexport/actions/export";
import { createImportExportLog } from "@/modules/importexport/actions/logs";
import type { ApiResponse } from "@/shared/types/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: { tipo: string } }
) {
  try {
    if (params.tipo !== "empresas") {
      return NextResponse.json<ApiResponse<never>>(
        {
          ok: false,
          error: `Exportacion no disponible para "${params.tipo}". Solo empresas esta habilitado por ahora.`,
        },
        { status: 400 }
      );
    }

    const data = await getEmpresasExport();

    await createImportExportLog({
      entidad: "Empresas",
      accion: "Exportacion",
      registros: data.length,
      estado: "Completado",
      detalle: `${data.length} registro(s) exportado(s) correctamente.`,
    });

    return NextResponse.json<ApiResponse<typeof data>>({ ok: true, data });
  } catch (error) {
    console.error(`[GET /api/exportar/${params.tipo}]`, error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al exportar los datos" },
      { status: 500 }
    );
  }
}
