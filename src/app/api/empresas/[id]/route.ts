/**
 * app/api/empresas/[id]/route.ts
 *
 * API Route para operaciones sobre una empresa concreta.
 *
 * GET    /api/empresas/:id   → obtener empresa por ID
 * PATCH  /api/empresas/:id   → actualizar empresa
 * DELETE /api/empresas/:id   → eliminar empresa
 */

import { NextRequest, NextResponse } from "next/server";
import { getEmpresaById }  from "@/modules/empresas/actions/queries";
import { updateEmpresa, deleteEmpresa } from "@/modules/empresas/actions/mutations";
import { empresaSchema }   from "@/modules/empresas/types/schema";
import type { ApiResponse } from "@/shared/types/api";

// Helper para parsear el ID del path y devolver error si no es válido
function parseId(params: { id: string }) {
  const id = Number(params.id);
  if (isNaN(id)) return null;
  return id;
}

// ─── GET /api/empresas/:id ────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseId(params);
  if (!id) return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });

  const empresa = await getEmpresaById(id);
  if (!empresa) return NextResponse.json({ ok: false, error: "No encontrada" }, { status: 404 });

  return NextResponse.json<ApiResponse<typeof empresa>>({ ok: true, data: empresa });
}

// ─── PATCH /api/empresas/:id ──────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseId(params);
  if (!id) return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });

  try {
    const body = await req.json();
    // partial() permite enviar solo los campos que se quieren cambiar
    const parsed = empresaSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const empresa = await updateEmpresa(id, parsed.data);
    return NextResponse.json<ApiResponse<typeof empresa>>({ ok: true, data: empresa });
  } catch (error) {
    console.error("[PATCH /api/empresas/:id]", error);
    return NextResponse.json({ ok: false, error: "Error al actualizar" }, { status: 500 });
  }
}

// ─── DELETE /api/empresas/:id ─────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseId(params);
  if (!id) return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });

  try {
    await deleteEmpresa(id);
    return NextResponse.json<ApiResponse<null>>({ ok: true, data: null });
  } catch (error) {
    console.error("[DELETE /api/empresas/:id]", error);
    return NextResponse.json({ ok: false, error: "Error al eliminar" }, { status: 500 });
  }
}
