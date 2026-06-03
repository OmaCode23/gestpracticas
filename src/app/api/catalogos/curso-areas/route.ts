import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { ensureApiAdmin, ensureApiUser } from "@/modules/auth/api";
import { createCursoArea } from "@/modules/catalogos/actions/mutations";
import { getCursoAreas } from "@/modules/catalogos/actions/queries";
import { cursoCatalogoSchema } from "@/modules/catalogos/types/cursos";
import { CACHE_TAGS } from "@/shared/cache";
import type { ApiResponse } from "@/shared/types/api";

const REVALIDATE_PATHS = [
  "/",
  "/configuracion",
  "/cursos",
  "/portal-alumno",
  "/portal-alumno/cursos",
];

function revalidateCursoCatalogos() {
  revalidateTag(CACHE_TAGS.catalogos);
  REVALIDATE_PATHS.forEach((path) => revalidatePath(path));
}

export async function GET() {
  try {
    const authResponse = await ensureApiUser();
    if (authResponse) {
      return authResponse;
    }

    const data = await getCursoAreas();

    return NextResponse.json<ApiResponse<typeof data>>({
      ok: true,
      data,
    });
  } catch (error) {
    console.error("[GET /api/catalogos/curso-areas]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al obtener las areas" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResponse = await ensureApiAdmin();
    if (authResponse) {
      return authResponse;
    }

    const body = await req.json();
    const parsed = cursoCatalogoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const area = await createCursoArea(parsed.data);
    revalidateCursoCatalogos();

    return NextResponse.json<ApiResponse<typeof area>>(
      { ok: true, data: area },
      { status: 201 }
    );
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "Ya existe un area con ese nombre." },
        { status: 409 }
      );
    }

    console.error("[POST /api/catalogos/curso-areas]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al crear el area" },
      { status: 500 }
    );
  }
}
