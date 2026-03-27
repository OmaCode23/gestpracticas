/**
 * app/api/exportar/[tipo]/route.ts
 *
 * Devuelve los datos en JSON para que el cliente los convierta a Excel.
 *
 * GET /api/exportar/empresas
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getAlumnosExport,
  getEmpresasExport,
  getFormacionExport,
} from "@/modules/importexport/actions/export";
import { createImportExportLog } from "@/modules/importexport/actions/logs";
import type { ApiResponse } from "@/shared/types/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: { tipo: string } }
) {
  try {
    const exportConfig = {
      empresas: { entidad: "Empresas", getData: getEmpresasExport },
      alumnos: { entidad: "Alumnos", getData: getAlumnosExport },
      formacion: { entidad: "Form. Empresa", getData: getFormacionExport },
    } as const;

    const currentExport = exportConfig[params.tipo as keyof typeof exportConfig];

    if (!currentExport) {
      return NextResponse.json<ApiResponse<never>>(
        {
          ok: false,
          error: `Exportacion no disponible para "${params.tipo}".`,
        },
        { status: 400 }
      );
    }

    const data = await currentExport.getData();

    await createImportExportLog({
      entidad: currentExport.entidad,
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
