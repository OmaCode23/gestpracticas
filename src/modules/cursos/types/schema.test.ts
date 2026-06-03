import { describe, expect, it } from "vitest";
import { cursoExternoSchema } from "./schema";

const VALID_CURSO = {
  titulo: "Fundamentos de cloud",
  proveedorId: "1",
  areaId: "2",
  nivel: "Principiante",
  modalidad: "Online",
  duracion: "",
  descripcion: "",
  enlace: "",
  activo: true,
};

describe("cursoExternoSchema", () => {
  it("acepta catalogos por ID y normaliza valores numericos del formulario", () => {
    const result = cursoExternoSchema.safeParse(VALID_CURSO);

    expect(result.success).toBe(true);
    expect(result.success ? result.data.proveedorId : null).toBe(1);
    expect(result.success ? result.data.areaId : null).toBe(2);
  });

  it("rechaza niveles y modalidades fuera de las opciones del combo", () => {
    const result = cursoExternoSchema.safeParse({
      ...VALID_CURSO,
      nivel: "Inicial",
      modalidad: "A distancia",
    });

    expect(result.success).toBe(false);
  });

  it("rechaza cursos sin proveedor o area de catalogo", () => {
    const result = cursoExternoSchema.safeParse({
      ...VALID_CURSO,
      proveedorId: "",
      areaId: "",
    });

    expect(result.success).toBe(false);
  });
});
