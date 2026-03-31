import { describe, expect, it } from "vitest";
import { alumnoSchema } from "@/modules/alumnos/types/schema";
import { empresaSchema } from "@/modules/empresas/types/schema";

describe("email validation", () => {
  it("acepta puntos en el correo de alumno antes de la arroba", () => {
    const result = alumnoSchema.safeParse({
      nombre: "Lucia Perez",
      nia: "NIA-01",
      nif: "",
      nuss: "",
      telefono: "600000000",
      email: "lucia.perez@educa.gva.es",
      ciclo: "DAM",
      cursoCiclo: 1,
      curso: "2025-2026",
    });

    expect(result.success).toBe(true);
  });

  it("acepta puntos en los correos de empresa y contacto", () => {
    const result = empresaSchema.safeParse({
      nombre: "Empresa Demo S.L.",
      cif: "B12345678",
      direccion: "",
      localidad: "Alacant/Alicante",
      sector: "Otro",
      cicloFormativo: "",
      telefono: "600000000",
      email: "info.general@empresa.com",
      contacto: "Ana Perez",
      emailContacto: "ana.perez@empresa.com",
    });

    expect(result.success).toBe(true);
  });
});
