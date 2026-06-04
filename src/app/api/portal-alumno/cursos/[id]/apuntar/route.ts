import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAlumnoRole } from "@/modules/auth/permissions";
import { requireApiUserSession } from "@/modules/auth/session";
import { registrarInscripcionCursoExterno } from "@/modules/portal-alumno/actions/mutations";
import { getPortalAlumnoActual } from "@/modules/portal-alumno/actions/queries";
import type { ApiResponse } from "@/shared/types/api";

function parseId(idParam: string) {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function requirePortalAlumnoApiAccess() {
  const session = await requireApiUserSession();
  if (!session) {
    return {
      authResponse: NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "No autenticado." },
        { status: 401 }
      ),
      alumno: null,
    };
  }

  if (!isAlumnoRole(session.user.rol)) {
    return {
      authResponse: NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "No autorizado." },
        { status: 403 }
      ),
      alumno: null,
    };
  }

  try {
    return { authResponse: null, alumno: await getPortalAlumnoActual(session) };
  } catch {
    return {
      authResponse: NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "No autorizado." },
        { status: 403 }
      ),
      alumno: null,
    };
  }
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const cursoId = parseId(params.id);
  if (!cursoId) {
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "ID invalido." },
      { status: 400 }
    );
  }

  const { authResponse, alumno } = await requirePortalAlumnoApiAccess();
  if (authResponse || !alumno) {
    return authResponse;
  }

  try {
    const inscripcion = await registrarInscripcionCursoExterno(alumno.id, cursoId);

    revalidatePath("/portal-alumno");
    revalidatePath("/portal-alumno/cursos");

    return NextResponse.json<ApiResponse<typeof inscripcion>>({
      ok: true,
      data: inscripcion,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "CURSO_NO_DISPONIBLE") {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "El curso no esta disponible." },
        { status: 404 }
      );
    }

    console.error("[POST /api/portal-alumno/cursos/:id/apuntar]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "No se pudo registrar la inscripcion al curso." },
      { status: 500 }
    );
  }
}
