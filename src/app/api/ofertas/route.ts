import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ensureApiUser } from "@/modules/auth/api";
import { createOfertaPractica } from "@/modules/ofertas/actions/mutations";
import { getOfertasPracticas } from "@/modules/ofertas/actions/queries";
import { ofertaPracticaFilterSchema, ofertaPracticaSchema } from "@/modules/ofertas/types/schema";
import type { ApiResponse } from "@/shared/types/api";

const REVALIDATE_PATHS = ["/", "/ofertas", "/portal-alumno", "/portal-alumno/ofertas"];

function revalidateOfertaPaths() {
  REVALIDATE_PATHS.forEach((path) => revalidatePath(path));
}

export async function GET(req: NextRequest) {
  try {
    const authResponse = await ensureApiUser();
    if (authResponse) return authResponse;

    const { searchParams } = req.nextUrl;
    const parsedFilters = ofertaPracticaFilterSchema.safeParse({
      search: searchParams.get("search") || undefined,
      estado: searchParams.get("estado") || undefined,
      ciclo: searchParams.get("ciclo") || undefined,
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || undefined,
      all: searchParams.get("all") || undefined,
    });

    if (!parsedFilters.success) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: parsedFilters.error.errors[0].message },
        { status: 400 }
      );
    }

    const result = await getOfertasPracticas(parsedFilters.data);
    return NextResponse.json<ApiResponse<typeof result>>({ ok: true, data: result });
  } catch (error) {
    console.error("[GET /api/ofertas]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al obtener las ofertas" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResponse = await ensureApiUser();
    if (authResponse) return authResponse;

    const body = await req.json();
    const parsed = ofertaPracticaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const oferta = await createOfertaPractica(parsed.data);
    revalidateOfertaPaths();

    return NextResponse.json<ApiResponse<typeof oferta>>(
      { ok: true, data: oferta },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "CICLO_FORMATIVO_INVALIDO") {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "El ciclo formativo seleccionado no existe o esta inactivo." },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === "EMPRESA_INVALIDA") {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "La empresa seleccionada no existe." },
        { status: 400 }
      );
    }

    console.error("[POST /api/ofertas]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al crear la oferta" },
      { status: 500 }
    );
  }
}
