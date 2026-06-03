import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { createManagedUser, listManagedUsers } from "@/modules/usuarios/actions";
import { managedUserCreateSchema } from "@/modules/usuarios/schemas";
import { requireApiAdminSession } from "@/modules/auth/session";
import type { ApiResponse } from "@/shared/types/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireApiAdminSession();
    if (!session) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "No autorizado." },
        { status: 403 }
      );
    }

    const users = await listManagedUsers();

    return NextResponse.json<ApiResponse<typeof users>>({
      ok: true,
      data: users,
    });
  } catch (error) {
    console.error("[GET /api/usuarios]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "No se pudo obtener el listado de usuarios." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireApiAdminSession();
    if (!session) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "No autorizado." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = managedUserCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const user = await createManagedUser(parsed.data);

    return NextResponse.json<ApiResponse<{ id: number }>>(
      {
        ok: true,
        data: { id: user.id },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "MANAGED_USER_CREATE_ADMIN_ONLY") {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "Desde esta pantalla solo se pueden crear cuentas ADMIN." },
        { status: 400 }
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

    console.error("[POST /api/usuarios]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "No se pudo crear el usuario." },
      { status: 500 }
    );
  }
}
