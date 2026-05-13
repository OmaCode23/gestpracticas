import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { isLocalAuthMode } from "@/modules/auth/config";
import {
  deleteManagedUser,
  resetManagedUserPassword,
  updateManagedUser,
} from "@/modules/usuarios/actions";
import { requireApiAdminSession } from "@/modules/auth/session";
import { managedUserPasswordSchema, managedUserUpdateSchema } from "@/modules/usuarios/schemas";
import type { ApiResponse } from "@/shared/types/api";

export const dynamic = "force-dynamic";

function parseId(id: string) {
  const parsed = Number.parseInt(id, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireApiAdminSession();
    if (!session) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "No autorizado." },
        { status: 403 }
      );
    }

    const userId = parseId(params.id);
    if (!userId) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "Identificador de usuario invalido." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = managedUserUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    await updateManagedUser(userId, parsed.data);

    return NextResponse.json<ApiResponse<null>>({
      ok: true,
      data: null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "Usuario no encontrado." },
        { status: 404 }
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "Ya existe un usuario con ese email." },
        { status: 409 }
      );
    }

    console.error("[PATCH /api/usuarios/[id]]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "No se pudo actualizar el usuario." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireApiAdminSession();
    if (!session) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "No autorizado." },
        { status: 403 }
      );
    }

    const userId = parseId(params.id);
    if (!userId) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "Identificador de usuario invalido." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = managedUserPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    if (!isLocalAuthMode()) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "El reseteo de contrasena no aplica en autenticacion externa." },
        { status: 400 }
      );
    }

    await resetManagedUserPassword(userId, parsed.data.password);

    return NextResponse.json<ApiResponse<null>>({
      ok: true,
      data: null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "PASSWORD_RESET_NOT_AVAILABLE") {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "El reseteo de contrasena no aplica en autenticacion externa." },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "Usuario no encontrado." },
        { status: 404 }
      );
    }

    console.error("[POST /api/usuarios/[id]]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "No se pudo restablecer la contrasena." },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireApiAdminSession();
    if (!session) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "No autorizado." },
        { status: 403 }
      );
    }

    const userId = parseId(params.id);
    if (!userId) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "Identificador de usuario invalido." },
        { status: 400 }
      );
    }

    await deleteManagedUser(userId, session.user.id);

    return NextResponse.json<ApiResponse<null>>({
      ok: true,
      data: null,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "CANNOT_DELETE_SELF") {
        return NextResponse.json<ApiResponse<never>>(
          { ok: false, error: "No puedes eliminar tu propio usuario administrador." },
          { status: 400 }
        );
      }

      if (error.message === "LAST_ACTIVE_ADMIN") {
        return NextResponse.json<ApiResponse<never>>(
          { ok: false, error: "No puedes eliminar el ultimo administrador activo." },
          { status: 400 }
        );
      }

      if (error.message === "USER_NOT_FOUND") {
        return NextResponse.json<ApiResponse<never>>(
          { ok: false, error: "Usuario no encontrado." },
          { status: 404 }
        );
      }
    }

    console.error("[DELETE /api/usuarios/[id]]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "No se pudo eliminar el usuario." },
      { status: 500 }
    );
  }
}
