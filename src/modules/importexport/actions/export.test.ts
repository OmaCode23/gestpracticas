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
        localidadId: 11,
        localidadRef: { id: 11, nombre: "Alacant/Alicante" },
        sectorId: 7,
        sectorRef: { id: 7, nombre: "Otro" },
        cicloFormativoRef: null,
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
        cicloFormativoRef: { nombre: "DAM" },
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
        "Teléfono": "600000000",
        Correo: "lucia@mail.com",
        Ciclo: "DAM",
        "Curso Ciclo": 1,
        Curso: "2025-2026",
      },
    ]);
  });

  it("mapea alumnos con opcionales nulos a celdas vacias", async () => {
    prismaMock.alumno.findMany.mockResolvedValue([
      {
        nia: "NIA-02",
        nif: null,
        nuss: null,
        nombre: "Alumno Sin Opcionales",
        telefono: "600000000",
        email: "alumno@mail.com",
        cicloFormativoRef: { nombre: "DAM" },
        cursoCiclo: 2,
        curso: "2025-2026",
      },
    ]);

    await expect(getAlumnosExport()).resolves.toEqual([
      {
        NIA: "NIA-02",
        NIF: "",
        NUSS: "",
        Nombre: "Alumno Sin Opcionales",
        "Teléfono": "600000000",
        Correo: "alumno@mail.com",
        Ciclo: "DAM",
        "Curso Ciclo": 2,
        Curso: "2025-2026",
      },
    ]);
  });

  it("mapea formaciones usando CIF y NIA para la plantilla exportable", async () => {
    prismaMock.formacionEmpresa.findMany.mockResolvedValue([
      {
        empresa: { cif: "B12345678" },
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
        CIF: "B12345678",
        NIA: "",
        "Período": "Marzo - Junio",
        "Descripción": "",
        "Tutor Laboral": "",
        "Correo Tutor Laboral": "",
        Curso: "2025-2026",
      },
    ]);
  });

  it("solicita las exportaciones con el orden esperado en cada entidad", async () => {
    prismaMock.empresa.findMany.mockResolvedValue([]);
    prismaMock.alumno.findMany.mockResolvedValue([]);
    prismaMock.formacionEmpresa.findMany.mockResolvedValue([]);

    await getEmpresasExport();
    await getAlumnosExport();
    await getFormacionExport();

    expect(prismaMock.empresa.findMany).toHaveBeenCalledWith({
      include: {
        sectorRef: {
          select: { id: true, nombre: true },
        },
        localidadRef: {
          select: { id: true, nombre: true },
        },
        cicloFormativoRef: {
          select: { nombre: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    expect(prismaMock.alumno.findMany).toHaveBeenCalledWith({
      include: {
        cicloFormativoRef: {
          select: { nombre: true },
        },
      },
      orderBy: { nombre: "asc" },
    });
    expect(prismaMock.formacionEmpresa.findMany).toHaveBeenCalledWith({
      include: {
        empresa: {
          select: { cif: true },
        },
        alumno: {
          select: { nia: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  });
});
