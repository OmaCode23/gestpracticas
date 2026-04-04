import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFormacion, updateFormacion } from "./mutations";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    formacionEmpresa: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/database/prisma", () => ({
  prisma: prismaMock,
}));

describe("formacion mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normaliza sector y localidad de empresa desde relacion al crear", async () => {
    prismaMock.formacionEmpresa.create.mockResolvedValue({
      id: 1,
      curso: "2025-2026",
      empresa: {
        id: 10,
        nombre: "Empresa Demo",
        sectorId: 3,
        sectorRef: { nombre: "Otro" },
        localidadId: 4,
        localidadRef: { nombre: "Alacant/Alicante" },
        cicloFormativoId: null,
        cicloFormativoRef: null,
      },
      alumno: null,
    });

    const result = await createFormacion({
      empresaId: 10,
      alumnoId: 7,
      curso: "2025-2026",
      periodo: "Marzo",
      descripcion: "",
      tutorLaboral: "",
      emailTutorLaboral: "",
    });

    expect(result.empresa).toEqual({
      id: 10,
      nombre: "Empresa Demo",
      sector: "Otro",
      sectorId: 3,
      sectorRef: { nombre: "Otro" },
      localidad: "Alacant/Alicante",
      localidadId: 4,
      localidadRef: { nombre: "Alacant/Alicante" },
      cicloFormativoId: null,
      cicloFormativoRef: null,
      cicloFormativo: null,
    });
  });

  it("normaliza la empresa tambien al actualizar", async () => {
    prismaMock.formacionEmpresa.update.mockResolvedValue({
      id: 2,
      curso: "2025-2026",
      empresa: {
        id: 11,
        nombre: "Empresa Demo",
        sectorId: 8,
        sectorRef: { nombre: "Tecnologia" },
        localidadId: 12,
        localidadRef: { nombre: "Elx/Elche" },
        cicloFormativoId: null,
        cicloFormativoRef: null,
      },
      alumno: null,
    });

    const result = await updateFormacion(2, {
      periodo: "Abril",
    });

    expect(result.empresa).toEqual({
      id: 11,
      nombre: "Empresa Demo",
      sector: "Tecnologia",
      sectorId: 8,
      sectorRef: { nombre: "Tecnologia" },
      localidad: "Elx/Elche",
      localidadId: 12,
      localidadRef: { nombre: "Elx/Elche" },
      cicloFormativoId: null,
      cicloFormativoRef: null,
      cicloFormativo: null,
    });
  });
});
