/**
 * app/api/profesores/route.ts
 *
 * GET  /api/profesores   → lista paginada con filtros
 * POST /api/profesores   → crear nuevo profesor
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ensureApiUser } from "@/modules/auth/api";
import { getProfesores } from "@/modules/profesores/actions/queries";
import { createProfesor } from "@/modules/profesores/actions/mutations";
import { profesorFilterSchema, profesorSchema } from "@/modules/profesores/types/schema";
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

export async function GET(req: NextRequest) {
  try {
    const authResponse = await ensureApiUser();
    if (authResponse) {
      return authResponse;
    }

    const { searchParams } = req.nextUrl;

    const parsedFilters = profesorFilterSchema.safeParse({
      ciclo: searchParams.get("ciclo") || undefined,
      search: searchParams.get("search") || undefined,
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

    const result = await getProfesores(parsedFilters.data);

    return NextResponse.json<ApiResponse<typeof result>>({ ok: true, data: result });
  } catch (error) {
    console.error("[GET /api/profesores]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al obtener los profesores" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResponse = await ensureApiUser();
    if (authResponse) {
      return authResponse;
    }

    const body = await req.json();
    const parsed = profesorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const profesor = await createProfesor(parsed.data);
    revalidatePath("/");
    revalidatePath("/profesores");

    return NextResponse.json<ApiResponse<typeof profesor>>(
      { ok: true, data: profesor },
      { status: 201 }
    );
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

    console.error("[POST /api/profesores]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al crear el profesor" },
      { status: 500 }
    );
  }
}
