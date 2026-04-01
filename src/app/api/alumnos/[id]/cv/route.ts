import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/database/prisma";
import { getAlumnoById } from "@/modules/alumnos/actions/queries";
import {
  ALUMNO_CV_MAX_BYTES,
  clearAlumnoCv,
  readAlumnoCv,
  saveAlumnoCv,
} from "@/modules/alumnos/actions/cv";
import type { ApiResponse } from "@/shared/types/api";

function parseId(idParam: string) {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseId(params.id);

  if (!id) {
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "ID invalido." },
      { status: 400 }
    );
  }

  const alumno = await getAlumnoById(id);
  if (!alumno) {
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Alumno no encontrado." },
      { status: 404 }
    );
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
        alumnoId: id,
        fileName: file.name,
        mimeType: file.type,
        size: buffer.byteLength,
        buffer,
      })
    );

    revalidatePath("/");
    revalidatePath("/alumnos");

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

    console.error("[POST /api/alumnos/:id/cv]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "No se pudo guardar el CV." },
      { status: 500 }
    );
  }
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseId(params.id);

  if (!id) {
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "ID invalido." },
      { status: 400 }
    );
  }

  try {
    const cv = await prisma.$transaction((tx) => readAlumnoCv(tx, id));

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
    console.error("[GET /api/alumnos/:id/cv]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "No se pudo recuperar el CV." },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseId(params.id);

  if (!id) {
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "ID invalido." },
      { status: 400 }
    );
  }

  try {
    const alumno = await getAlumnoById(id);
    if (!alumno) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: "Alumno no encontrado." },
        { status: 404 }
      );
    }

    await prisma.$transaction((tx) => clearAlumnoCv(tx, id));

    revalidatePath("/");
    revalidatePath("/alumnos");

    return NextResponse.json<ApiResponse<null>>({
      ok: true,
      data: null,
    });
  } catch (error) {
    console.error("[DELETE /api/alumnos/:id/cv]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "No se pudo eliminar el CV." },
      { status: 500 }
    );
  }
}
