import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ensureApiUser } from "@/modules/auth/api";
import { deleteOfertaPractica, updateOfertaPractica } from "@/modules/ofertas/actions/mutations";
import { getOfertaPracticaById } from "@/modules/ofertas/actions/queries";
import { ofertaPracticaSchema } from "@/modules/ofertas/types/schema";
import type { ApiResponse } from "@/shared/types/api";

const REVALIDATE_PATHS = ["/", "/ofertas", "/portal-alumno", "/portal-alumno/ofertas"];

function parseId(idParam: string) {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function revalidateOfertaPaths() {
  REVALIDATE_PATHS.forEach((path) => revalidatePath(path));
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResponse = await ensureApiUser();
    if (authResponse) return authResponse;

    const id = parseId(params.id);
    if (!id) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "ID invalido" },
        { status: 400 }
      );
    }

    const oferta = await getOfertaPracticaById(id);
    if (!oferta) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "Oferta no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<typeof oferta>>({ ok: true, data: oferta });
  } catch (error) {
    console.error("[GET /api/ofertas/:id]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al obtener la oferta" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResponse = await ensureApiUser();
    if (authResponse) return authResponse;

    const id = parseId(params.id);
    if (!id) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "ID invalido" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = ofertaPracticaSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const existe = await getOfertaPracticaById(id);
    if (!existe) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "Oferta no encontrada" },
        { status: 404 }
      );
    }

    const oferta = await updateOfertaPractica(id, parsed.data);
    revalidateOfertaPaths();

    return NextResponse.json<ApiResponse<typeof oferta>>({ ok: true, data: oferta });
  } catch (error) {
    if (error instanceof Error && error.message === "CICLO_FORMATIVO_INVALIDO") {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "El ciclo formativo seleccionado no existe o esta inactivo." },
        { status: 400 }
      );
    }

    console.error("[PATCH /api/ofertas/:id]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al actualizar la oferta" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResponse = await ensureApiUser();
    if (authResponse) return authResponse;

    const id = parseId(params.id);
    if (!id) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "ID invalido" },
        { status: 400 }
      );
    }

    const existe = await getOfertaPracticaById(id);
    if (!existe) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "Oferta no encontrada" },
        { status: 404 }
      );
    }

    await deleteOfertaPractica(id);
    revalidateOfertaPaths();

    return NextResponse.json<ApiResponse<null>>({ ok: true, data: null });
  } catch (error) {
    console.error("[DELETE /api/ofertas/:id]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al eliminar la oferta" },
      { status: 500 }
    );
  }
}
