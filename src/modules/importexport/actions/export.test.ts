import { describe, expect, it, vi } from "vitest";
import {
  getAlumnosExport,
  getEmpresasExport,
  getFormacionExport,
} from "./export";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    empresa: {
      findMany: vi.fn(),
    },
    alumno: {
      findMany: vi.fn(),
    },
    formacionEmpresa: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/database/prisma", () => ({
  prisma: prismaMock,
}));

describe("export actions", () => {
  it("mapea empresas al formato de columnas esperado", async () => {
    prismaMock.empresa.findMany.mockResolvedValue([
      {
        cif: "B12345678",
        nombre: "Empresa Demo",
        direccion: null,
        localidad: "Alacant/Alicante",
        sector: "Otro",
        cicloFormativo: null,
        telefono: null,
        email: null,
        contacto: null,
        emailContacto: null,
      },
    ]);

    await expect(getEmpresasExport()).resolves.toEqual([
      {
        CIF: "B12345678",
        Nombre: "Empresa Demo",
        Direccion: "",
        Localidad: "Alacant/Alicante",
        Sector: "Otro",
        "Ciclo Formativo": "",
        Telefono: "",
        "Correo Empresa": "",
        Contacto: "",
        "Correo Contacto": "",
      },
    ]);
  });

  it("mapea alumnos al formato exportable", async () => {
    prismaMock.alumno.findMany.mockResolvedValue([
      {
        nia: "NIA-01",
        nif: "12345678Z",
        nuss: "123456789012",
        nombre: "Lucia Perez",
        telefono: "600000000",
        email: "lucia@mail.com",
        ciclo: "DAM",
        cursoCiclo: 1,
        curso: "2025-2026",
      },
    ]);

    await expect(getAlumnosExport()).resolves.toEqual([
      {
        NIA: "NIA-01",
        NIF: "12345678Z",
        NUSS: "123456789012",
        Nombre: "Lucia Perez",
        Telefono: "600000000",
        Correo: "lucia@mail.com",
        Ciclo: "DAM",
        "Curso Ciclo": 1,
        Curso: "2025-2026",
      },
    ]);
  });

  it("mapea formaciones incluyendo nombres relacionados y opcionales vacios", async () => {
    prismaMock.formacionEmpresa.findMany.mockResolvedValue([
      {
        empresa: { nombre: "Empresa Demo" },
        alumno: null,
        periodo: "Marzo - Junio",
        descripcion: null,
        tutorLaboral: null,
        emailTutorLaboral: null,
        curso: "2025-2026",
      },
    ]);

    await expect(getFormacionExport()).resolves.toEqual([
      {
        Empresa: "Empresa Demo",
        Alumno: "",
        Periodo: "Marzo - Junio",
        Descripcion: "",
        "Tutor Laboral": "",
        "Correo Tutor Laboral": "",
        Curso: "2025-2026",
      },
    ]);
  });
});
