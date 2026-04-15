import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createSector } from "@/modules/catalogos/actions/mutations";
import { getSectores } from "@/modules/catalogos/actions/queries";
import { sectorSchema } from "@/modules/catalogos/types/sectores";
import type { ApiResponse } from "@/shared/types/api";

export async function GET() {
  try {
    const data = await getSectores();

    return NextResponse.json<ApiResponse<typeof data>>({
      ok: true,
      data,
    });
  } catch (error) {
    console.error("[GET /api/catalogos/sectores]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al obtener los sectores" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = sectorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const sector = await createSector(parsed.data);
    revalidatePath("/configuracion");

    return NextResponse.json<ApiResponse<typeof sector>>(
      { ok: true, data: sector },
      { status: 201 }
    );
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "Ya existe un sector con ese nombre." },
        { status: 409 }
      );
    }

    console.error("[POST /api/catalogos/sectores]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al crear el sector" },
      { status: 500 }
    );
  }
}
