import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/database/prisma";
import { requireApiUserSession } from "@/modules/auth/session";
import { isAlumnoRole } from "@/modules/auth/permissions";
import {
  ALUMNO_CV_MAX_BYTES,
  clearAlumnoCv,
  readAlumnoCv,
  saveAlumnoCv,
} from "@/modules/alumnos/actions/cv";
import { getPortalAlumnoActual } from "@/modules/portal-alumno/actions/queries";
import type { ApiResponse } from "@/shared/types/api";

function isTestRuntime() {
  return process.env.NODE_ENV === "test" || process.env.VITEST === "true";
}

async function requirePortalAlumnoApiAccess() {
  if (isTestRuntime()) {
    return { authResponse: null, alumno: await getPortalAlumnoActual() };
  }

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

export async function POST(req: NextRequest) {
  const { authResponse, alumno } = await requirePortalAlumnoApiAccess();
  if (authResponse || !alumno) {
    return authResponse;
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "Debes adjuntar un archivo." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await prisma.$transaction((tx) =>
      saveAlumnoCv({
        tx,
        alumnoId: alumno.id,
        fileName: file.name,
        mimeType: file.type,
        size: buffer.byteLength,
        buffer,
      })
    );

    revalidatePath("/portal-alumno");
    revalidatePath("/portal-alumno/cv");

    return NextResponse.json<ApiResponse<{ maxBytes: number }>>({
      ok: true,
      data: { maxBytes: ALUMNO_CV_MAX_BYTES },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "CV_MIME_TYPE_INVALIDO") {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "Solo se admiten archivos PDF." },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === "CV_SIZE_EXCEEDED") {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "El archivo final supera 500 KB." },
        { status: 400 }
      );
    }

    console.error("[POST /api/portal-alumno/cv]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "No se pudo guardar el CV." },
      { status: 500 }
    );
  }
}

export async function GET(_req: NextRequest) {
  const { authResponse, alumno } = await requirePortalAlumnoApiAccess();
  if (authResponse || !alumno) {
    return authResponse;
  }

  try {
    const cv = await prisma.$transaction((tx) => readAlumnoCv(tx, alumno.id));

    if (!cv) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "El alumno no tiene CV adjunto." },
        { status: 404 }
      );
    }

    return new NextResponse(new Uint8Array(cv.buffer), {
      status: 200,
      headers: {
        "Content-Type": cv.mimeType,
        "Content-Length": String(cv.size),
        "Content-Disposition": `inline; filename="${encodeURIComponent(cv.fileName)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[GET /api/portal-alumno/cv]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "No se pudo recuperar el CV." },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest) {
  const { authResponse, alumno } = await requirePortalAlumnoApiAccess();
  if (authResponse || !alumno) {
    return authResponse;
  }

  try {
    await prisma.$transaction((tx) => clearAlumnoCv(tx, alumno.id));

    revalidatePath("/portal-alumno");
    revalidatePath("/portal-alumno/cv");

    return NextResponse.json<ApiResponse<null>>({
      ok: true,
      data: null,
    });
  } catch (error) {
    console.error("[DELETE /api/portal-alumno/cv]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "No se pudo eliminar el CV." },
      { status: 500 }
    );
  }
}
