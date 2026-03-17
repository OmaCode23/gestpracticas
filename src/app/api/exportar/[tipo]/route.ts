/**
 * app/api/exportar/[tipo]/route.ts
 *
 * Devuelve los datos en JSON para que el cliente los convierta a Excel.
 *
 * GET /api/exportar/alumnos
 * GET /api/exportar/empresas
 * GET /api/exportar/formacion
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getAlumnosExport,
  getEmpresasExport,
  getFormacionesExport,
} from "@/modules/importexport/actions/export";
import type { ApiResponse } from "@/shared/types/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: { tipo: string } }
) {
  try {
    let data: Record<string, string>[];

    switch (params.tipo) {
      case "alumnos":
        data = await getAlumnosExport();
        break;
      case "empresas":
        data = await getEmpresasExport();
        break;
      case "formacion":
        data = await getFormacionesExport();
        break;
      default:
        return NextResponse.json<ApiResponse<never>>(
          { ok: false, error: `Tipo de exportación desconocido: ${params.tipo}` },
          { status: 400 }
        );
    }

    return NextResponse.json<ApiResponse<typeof data>>({ ok: true, data });
  } catch (error) {
    console.error(`[GET /api/exportar/${params.tipo}]`, error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al exportar los datos" },
      { status: 500 }
    );
  }
}
