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
import { revalidatePath } from "next/cache";
import { getEmpresaById } from "@/modules/empresas/actions/queries";
import { updateEmpresa, deleteEmpresa } from "@/modules/empresas/actions/mutations";
import { empresaSchema } from "@/modules/empresas/types/schema";
import type { ApiResponse } from "@/shared/types/api";

function parseId(idParam: string) {
  const id = Number(idParam);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseId(params.id);

    if (!id) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "ID inválido" },
        { status: 400 }
      );
    }

    const empresa = await getEmpresaById(id);

    if (!empresa) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "Empresa no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<typeof empresa>>({
      ok: true,
      data: empresa,
    });
  } catch (error) {
    console.error("[GET /api/empresas/:id]", error);

    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al obtener la empresa" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseId(params.id);

    if (!id) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "ID inválido" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = empresaSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const empresaExistente = await getEmpresaById(id);

    if (!empresaExistente) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "Empresa no encontrada" },
        { status: 404 }
      );
    }

    const empresa = await updateEmpresa(id, parsed.data);
    revalidatePath("/");
    revalidatePath("/empresas");

    return NextResponse.json<ApiResponse<typeof empresa>>({
      ok: true,
      data: empresa,
    });
  } catch (error: any) {
    if (error instanceof Error && error.message === "CICLO_FORMATIVO_INVALIDO") {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "El ciclo formativo no es valido." },
        { status: 400 }
      );
    }

    if (error?.code === "P2002") {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "Ya existe una empresa con ese CIF" },
        { status: 409 }
      );
    }

    console.error("[PATCH /api/empresas/:id]", error);

    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al actualizar la empresa" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseId(params.id);

    if (!id) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "ID inválido" },
        { status: 400 }
      );
    }

    const empresaExistente = await getEmpresaById(id);

    if (!empresaExistente) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "Empresa no encontrada" },
        { status: 404 }
      );
    }

    await deleteEmpresa(id);
    revalidatePath("/");
    revalidatePath("/empresas");

    return NextResponse.json<ApiResponse<null>>({
      ok: true,
      data: null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "EMPRESA_CON_FORMACIONES") {
      return NextResponse.json<ApiResponse<never>>(
        {
          ok: false,
          error: "No se puede eliminar la empresa porque participa en formaciones registradas.",
        },
        { status: 409 }
      );
    }

    console.error("[DELETE /api/empresas/:id]", error);

    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al eliminar la empresa" },
      { status: 500 }
    );
  }
}
