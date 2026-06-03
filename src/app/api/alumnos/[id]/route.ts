/**
 * app/api/alumnos/[id]/route.ts
 *
 * GET    /api/alumnos/:id
 * PATCH  /api/alumnos/:id
 * DELETE /api/alumnos/:id
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ensureApiUser } from "@/modules/auth/api";
import { getAlumnoById } from "@/modules/alumnos/actions/queries";
import { updateAlumno, deleteAlumno } from "@/modules/alumnos/actions/mutations";
import { alumnoCrudUpdateSchema } from "@/modules/alumnos/types/schema";
import { getCursosAcademicosConfigurados } from "@/modules/settings/actions/queries";
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

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const authResponse = await ensureApiUser();
  if (authResponse) {
    return authResponse;
  }

  const id = parseId(params.id);
  if (!id) {
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "ID inválido" },
      { status: 400 }
    );
  }

  const alumno = await getAlumnoById(id);
  if (!alumno) {
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "No encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json<ApiResponse<typeof alumno>>({
    ok: true,
    data: alumno,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authResponse = await ensureApiUser();
  if (authResponse) {
    return authResponse;
  }

  const id = parseId(params.id);
  if (!id) {
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "ID inválido" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const parsed = alumnoCrudUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    if (parsed.data.curso !== undefined) {
      const cursosValidos = await getCursosAcademicosConfigurados();

      if (!cursosValidos.includes(parsed.data.curso)) {
        return NextResponse.json<ApiResponse<never>>(
          { ok: false, error: "El curso no es valido." },
          { status: 400 }
        );
      }
    }

    const existente = await getAlumnoById(id);
    if (!existente) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "No encontrado" },
        { status: 404 }
      );
    }

    const alumno = await updateAlumno(id, parsed.data);
    revalidatePath("/");
    revalidatePath("/alumnos");

    return NextResponse.json<ApiResponse<typeof alumno>>({
      ok: true,
      data: alumno,
    });
  } catch (error: any) {
    if (error instanceof Error && error.message === "CICLO_FORMATIVO_INVALIDO") {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "El ciclo formativo no es valido." },
        { status: 400 }
      );
    }

    if (error instanceof EmailDomainNotAllowedError) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "El dominio del email no está permitido para alumnos." },
        { status: 400 }
      );
    }

    if (error instanceof AcademicEmailConflictError) {
      const message =
        error.entity === "ALUMNO"
          ? "Ya existe un alumno con ese email."
          : "Ese email ya esta asignado a un profesor.";

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
      const message = target.includes("nif")
        ? "Ya existe un alumno con ese NIF"
        : target.includes("nuss")
          ? "Ya existe un alumno con ese NUSS"
          : target.includes("email")
            ? "Ya existe un alumno con ese email."
          : "Ya existe un alumno con ese NIA";

      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: message },
        { status: 409 }
      );
    }

    console.error("[PATCH /api/alumnos/:id]", error);
    const debugMessage =
      process.env.NODE_ENV !== "production" && error instanceof Error
        ? `Error al actualizar: ${error.message}`
        : "Error al actualizar";
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: debugMessage },
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
      { ok: false, error: "ID inválido" },
      { status: 400 }
    );
  }

  try {
    const existente = await getAlumnoById(id);
    if (!existente) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "No encontrado" },
        { status: 404 }
      );
    }

    await deleteAlumno(id);
    revalidatePath("/");
    revalidatePath("/alumnos");

    return NextResponse.json<ApiResponse<null>>({
      ok: true,
      data: null,
    });
  } catch (error: any) {
    if (error?.code === "P2003") {
      return NextResponse.json<ApiResponse<never>>(
        {
          ok: false,
          error: "No se puede eliminar el alumno porque esta incluido en una formacion.",
        },
        { status: 409 }
      );
    }

    console.error("[DELETE /api/alumnos/:id]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al eliminar" },
      { status: 500 }
    );
  }
}
