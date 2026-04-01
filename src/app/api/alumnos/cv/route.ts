import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/database/prisma";
import { clearAllAlumnosCv, readAllAlumnosCv } from "@/modules/alumnos/actions/cv";
import type { ApiResponse } from "@/shared/types/api";

function buildArchiveName() {
  return `cvs_alumnos_${new Date().toISOString().slice(0, 10)}.zip`;
}

export async function GET() {
  try {
    const archive = await prisma.$transaction((tx) => readAllAlumnosCv(tx));

    if (!archive) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "No hay CVs adjuntos para descargar." },
        { status: 404 }
      );
    }

    return new NextResponse(new Uint8Array(archive.zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Length": String(archive.zipBuffer.byteLength),
        "Content-Disposition": `attachment; filename="${buildArchiveName()}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[GET /api/alumnos/cv]", error);

    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "No se pudieron descargar los CVs." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const count = await prisma.$transaction((tx) => clearAllAlumnosCv(tx));

    revalidatePath("/");
    revalidatePath("/alumnos");

    return NextResponse.json<ApiResponse<{ deletedCount: number }>>({
      ok: true,
      data: { deletedCount: count },
    });
  } catch (error) {
    console.error("[DELETE /api/alumnos/cv]", error);

    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "No se pudieron eliminar los CVs." },
      { status: 500 }
    );
  }
}
