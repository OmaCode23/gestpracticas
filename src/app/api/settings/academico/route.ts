import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getConfiguracionAcademica } from "@/modules/settings/actions/queries";
import { saveConfiguracionAcademica } from "@/modules/settings/actions/mutations";
import { configuracionAcademicaSchema } from "@/modules/settings/types/schema";
import type { ApiResponse } from "@/shared/types/api";

export async function GET() {
  try {
    const configuracion = await getConfiguracionAcademica();

    return NextResponse.json<ApiResponse<typeof configuracion>>({
      ok: true,
      data: configuracion,
    });
  } catch (error) {
    console.error("[GET /api/settings/academico]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al obtener la configuracion academica." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = configuracionAcademicaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const configuracion = await saveConfiguracionAcademica(parsed.data);

    revalidatePath("/");
    revalidatePath("/alumnos");
    revalidatePath("/formacion");
    revalidatePath("/configuracion");

    return NextResponse.json<ApiResponse<typeof configuracion>>({
      ok: true,
      data: configuracion,
    });
  } catch (error) {
    console.error("[PUT /api/settings/academico]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al guardar la configuracion academica." },
      { status: 500 }
    );
  }
}
