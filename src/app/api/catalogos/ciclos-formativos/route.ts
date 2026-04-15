import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createCicloFormativo } from "@/modules/catalogos/actions/mutations";
import { getCiclosFormativos } from "@/modules/catalogos/actions/queries";
import { cicloFormativoSchema } from "@/modules/catalogos/types/ciclos";
import type { ApiResponse } from "@/shared/types/api";

export async function GET() {
  try {
    const data = await getCiclosFormativos();

    return NextResponse.json<ApiResponse<typeof data>>({
      ok: true,
      data,
    });
  } catch (error) {
    console.error("[GET /api/catalogos/ciclos-formativos]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al obtener los ciclos formativos" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = cicloFormativoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const ciclo = await createCicloFormativo(parsed.data);
    revalidatePath("/configuracion");

    return NextResponse.json<ApiResponse<typeof ciclo>>(
      { ok: true, data: ciclo },
      { status: 201 }
    );
  } catch (error: any) {
    if (error?.message === "CICLO_FORMATIVO_CODIGO_RESERVADO") {
      return NextResponse.json<ApiResponse<never>>(
        {
          ok: false,
          error: "Ese codigo esta reservado para un ciclo formativo base. Usa la restauracion de valores por defecto.",
        },
        { status: 400 }
      );
    }

    if (error?.code === "P2002") {
      const target = Array.isArray(error?.meta?.target) ? error.meta.target.join(", ") : "";
      const message = target.includes("codigo")
        ? "Ya existe un ciclo con ese codigo."
        : "Ya existe un ciclo con ese nombre.";

      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: message },
        { status: 409 }
      );
    }

    console.error("[POST /api/catalogos/ciclos-formativos]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al crear el ciclo formativo" },
      { status: 500 }
    );
  }
}
