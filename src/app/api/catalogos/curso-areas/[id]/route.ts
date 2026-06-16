import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { ensureApiUser } from "@/modules/auth/api";
import { deleteCursoArea, updateCursoArea } from "@/modules/catalogos/actions/mutations";
import { getCursoAreas } from "@/modules/catalogos/actions/queries";
import { cursoCatalogoUpdateSchema } from "@/modules/catalogos/types/cursos";
import { CACHE_TAGS } from "@/shared/cache";
import type { ApiResponse } from "@/shared/types/api";

const REVALIDATE_PATHS = [
  "/",
  "/configuracion",
  "/cursos",
  "/portal-alumno",
  "/portal-alumno/cursos",
];

function parseId(idParam: string) {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function revalidateCursoCatalogos() {
  revalidateTag(CACHE_TAGS.catalogos);
  REVALIDATE_PATHS.forEach((path) => revalidatePath(path));
}

async function getAreaById(id: number) {
  const items = await getCursoAreas();
  return items.find((item) => item.id === id) ?? null;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authResponse = await ensureApiUser();
  if (authResponse) {
    return authResponse;
  }

  const id = parseId(params.id);
  if (!id) {
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "ID invalido" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const parsed = cursoCatalogoUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const existente = await getAreaById(id);
    if (!existente) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "No encontrado" },
        { status: 404 }
      );
    }

    const area = await updateCursoArea(id, parsed.data);
    revalidateCursoCatalogos();

    return NextResponse.json<ApiResponse<typeof area>>({
      ok: true,
      data: area,
    });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "Ya existe un area con ese nombre." },
        { status: 409 }
      );
    }

    console.error("[PATCH /api/catalogos/curso-areas/:id]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al actualizar el area" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const authResponse = await ensureApiUser();
  if (authResponse) {
    return authResponse;
  }

  const id = parseId(params.id);
  if (!id) {
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "ID invalido" },
      { status: 400 }
    );
  }

  try {
    const existente = await getAreaById(id);
    if (!existente) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "No encontrado" },
        { status: 404 }
      );
    }

    await deleteCursoArea(id);
    revalidateCursoCatalogos();

    return NextResponse.json<ApiResponse<null>>({
      ok: true,
      data: null,
    });
  } catch (error: unknown) {
    const deleteError = error as Error & {
      meta?: { cursosCount?: number };
    };

    if (deleteError?.message === "CURSO_AREA_EN_USO") {
      const cursosCount = deleteError.meta?.cursosCount ?? 0;

      return NextResponse.json<ApiResponse<never>>(
        {
          ok: false,
          error: `No se puede eliminar porque el area esta siendo usada en ${cursosCount} curso(s).`,
        },
        { status: 400 }
      );
    }

    console.error("[DELETE /api/catalogos/curso-areas/:id]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al eliminar el area" },
      { status: 500 }
    );
  }
}
