import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAlumnoRole } from "@/modules/auth/permissions";
import { requireApiUserSession } from "@/modules/auth/session";
import { registrarInteresOfertaPractica } from "@/modules/portal-alumno/actions/mutations";
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
  const ofertaId = parseId(params.id);
  if (!ofertaId) {
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
    const interes = await registrarInteresOfertaPractica(alumno.id, ofertaId);

    revalidatePath("/portal-alumno");
    revalidatePath("/portal-alumno/ofertas");

    return NextResponse.json<ApiResponse<typeof interes>>({
      ok: true,
      data: interes,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "OFERTA_NO_DISPONIBLE") {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "La oferta no esta disponible." },
        { status: 404 }
      );
    }

    console.error("[POST /api/portal-alumno/ofertas/:id/aplicar]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "No se pudo registrar el interes en la oferta." },
      { status: 500 }
    );
  }
}
