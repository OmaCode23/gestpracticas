/**
 * app/api/settings/email-domains/route.ts
 *
 * GET  /api/settings/email-domains   → devuelve dominios base y extra por entidad
 * PUT  /api/settings/email-domains   → guarda dominios extra para una entidad
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { ensureApiAdmin, ensureApiUser } from "@/modules/auth/api";
import {
  getEmailDomainsConfig,
} from "@/modules/settings/actions/queries";
import { saveExtraEmailDomains } from "@/modules/settings/actions/mutations";
import { EMAIL_DOMAIN_DEFAULTS } from "@/modules/settings/constants";
import { CACHE_TAGS } from "@/shared/cache";
import type { ApiResponse } from "@/shared/types/api";

export const dynamic = "force-dynamic";

const DOMAIN_REGEX = /^(?!-)[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

const emailDomainsUpdateSchema = z.object({
  entity: z.enum(["ALUMNO", "PROFESOR"], {
    required_error: "La entidad es obligatoria.",
    invalid_type_error: "La entidad debe ser ALUMNO o PROFESOR.",
  }),
  domains: z
    .array(
      z.string().regex(DOMAIN_REGEX, "Formato de dominio no válido.")
    )
    .min(0),
});

export async function GET() {
  try {
    const authResponse = await ensureApiUser();
    if (authResponse) return authResponse;

    const config = await getEmailDomainsConfig();

    return NextResponse.json<ApiResponse<typeof config & {
      defaultDominiosAlumnos: readonly string[];
      defaultDominiosProfesores: readonly string[];
    }>>({
      ok: true,
      data: {
        ...config,
        defaultDominiosAlumnos: EMAIL_DOMAIN_DEFAULTS.alumnos,
        defaultDominiosProfesores: EMAIL_DOMAIN_DEFAULTS.profesores,
      },
    });
  } catch (error) {
    console.error("[GET /api/settings/email-domains]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al obtener los dominios de email." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authResponse = await ensureApiAdmin();
    if (authResponse) return authResponse;

    const body = await req.json();
    const parsed = emailDomainsUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { ok: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { entity, domains } = parsed.data;

    // Deduplicar y normalizar
    const uniqueDomains = Array.from(
      new Set(domains.map((d) => d.toLowerCase().trim()))
    );

    await saveExtraEmailDomains(entity, uniqueDomains);

    revalidateTag(CACHE_TAGS.settings);

    const config = await getEmailDomainsConfig();

    return NextResponse.json<ApiResponse<typeof config>>({
      ok: true,
      data: config,
    });
  } catch (error) {
    console.error("[PUT /api/settings/email-domains]", error);
    return NextResponse.json<ApiResponse<never>>(
      { ok: false, error: "Error al guardar los dominios de email." },
      { status: 500 }
    );
  }
}
