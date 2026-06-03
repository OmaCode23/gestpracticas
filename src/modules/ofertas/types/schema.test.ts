import { describe, expect, it } from "vitest";
import { ofertaPracticaSchema } from "./schema";

const VALID_OFERTA = {
  titulo: "Practicas de desarrollo web",
  empresaId: "7",
  cicloFormativoId: "",
  plazas: "2",
  requisitos: "",
  periodo: "",
  descripcion: "",
  estado: "PUBLICADA",
};

describe("ofertaPracticaSchema", () => {
  it("acepta empresaId desde el selector de empresas", () => {
    const result = ofertaPracticaSchema.safeParse(VALID_OFERTA);

    expect(result.success).toBe(true);
    expect(result.success ? result.data.empresaId : null).toBe(7);
  });

  it("rechaza ofertas sin empresa seleccionada", () => {
    const result = ofertaPracticaSchema.safeParse({
      ...VALID_OFERTA,
      empresaId: "",
    });

    expect(result.success).toBe(false);
  });

  it("no acepta la empresa como texto libre heredado en nuevas escrituras", () => {
    const result = ofertaPracticaSchema.safeParse({
      ...VALID_OFERTA,
      empresaId: undefined,
      empresa: "Empresa sin catalogo",
    });

    expect(result.success).toBe(false);
  });
});
