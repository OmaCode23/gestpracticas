/**
 * app/api/profesores/[id]/route.ts
 *
 * GET    /api/profesores/:id   → obtener profesor por ID
 * PATCH  /api/profesores/:id   → actualizar profesor
 * DELETE /api/profesores/:id   → eliminar profesor
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ensureApiUser } from "@/modules/auth/api";
import { getProfesorById } from "@/modules/profesores/actions/queries";
import { updateProfesor, deleteProfesor } from "@/modules/profesores/actions/mutations";
import { profesorSchema } from "@/modules/profesores/types/schema";
import {
  AcademicEmailConflictError,
  EmailDomainNotAllowedError,
} from "@/shared/identity/academic-email";
import { AcademicUserSyncError } from "@/shared/identity/academic-user";
import type { ApiResponse } from "@/shared/types/api";

function getAcademicUserSyncCode(error: unknown) {
  if (
    error instanceof AcademicUserSyncError ||
    (typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof (error as { code: unknown }).code === "string" &&
      String((error as { code: string }).code).startsWith("ACADEMIC_USER_"))
  ) {
    return (error as { code: string }).code;
  }

  return null;
}

function parseId(idParam: string) {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const profesor = await getProfesorById(id);

    if (!profesor) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "Profesor no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<typeof profesor>>({ ok: true, data: profesor });
  } catch (error) {
    console.error("[GET /api/profesores/:id]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al obtener el profesor" },
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

    const body = await req.json();
    const parsed = profesorSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const existe = await getProfesorById(id);

    if (!existe) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "Profesor no encontrado" },
        { status: 404 }
      );
    }

    const profesor = await updateProfesor(id, parsed.data);
    revalidatePath("/");
    revalidatePath("/profesores");

    return NextResponse.json<ApiResponse<typeof profesor>>({ ok: true, data: profesor });
  } catch (error: any) {
    if (error instanceof Error && error.message === "CICLO_FORMATIVO_INVALIDO") {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "El ciclo formativo no es valido." },
        { status: 400 }
      );
    }

    if (error instanceof EmailDomainNotAllowedError) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "El dominio del email no está permitido para profesores." },
        { status: 400 }
      );
    }

    if (error instanceof AcademicEmailConflictError) {
      const message =
        error.entity === "PROFESOR"
          ? "Ya existe un profesor con ese email."
          : "Ese email ya esta asignado a un alumno.";

      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: message },
        { status: 409 }
      );
    }

    const academicUserSyncCode = getAcademicUserSyncCode(error);
    if (academicUserSyncCode) {
      const message =
        academicUserSyncCode === "ACADEMIC_USER_ROLE_CONFLICT"
          ? "Ya existe un usuario con ese email y un rol incompatible."
          : "No se pudo sincronizar la cuenta de acceso con ese email.";

      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: message },
        { status: 409 }
      );
    }

    if (error?.code === "P2002") {
      const target = Array.isArray(error?.meta?.target) ? error.meta.target.join(", ") : "";
      return NextResponse.json<ApiResponse<never>>(
        {
          ok: false,
          error: target.includes("email")
            ? "Ya existe un profesor con ese email."
            : "Ya existe un profesor con ese NIF.",
        },
        { status: 409 }
      );
    }

    console.error("[PATCH /api/profesores/:id]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al actualizar el profesor" },
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

    const existe = await getProfesorById(id);

    if (!existe) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "Profesor no encontrado" },
        { status: 404 }
      );
    }

    await deleteProfesor(id);
    revalidatePath("/");
    revalidatePath("/profesores");

    return NextResponse.json<ApiResponse<null>>({ ok: true, data: null });
  } catch (error) {
    console.error("[DELETE /api/profesores/:id]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al eliminar el profesor" },
      { status: 500 }
    );
  }
}
