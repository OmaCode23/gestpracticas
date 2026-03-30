import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  importAlumnos,
  importEmpresas,
  importFormaciones,
  type AlumnoImportRow,
  type EmpresaImportRow,
  type FormacionImportRow,
} from "./import";

const { prismaMock, createEmpresasBatchMock, createImportExportLogMock } = vi.hoisted(() => ({
  prismaMock: {
    empresa: {
      findMany: vi.fn(),
    },
    alumno: {
      findMany: vi.fn(),
      createMany: vi.fn(),
    },
    formacionEmpresa: {
      createMany: vi.fn(),
    },
  },
  createEmpresasBatchMock: vi.fn(),
  createImportExportLogMock: vi.fn(),
}));

vi.mock("@/database/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/modules/empresas/actions/mutations", () => ({
  createEmpresasBatch: createEmpresasBatchMock,
}));

vi.mock("./logs", () => ({
  createImportExportLog: createImportExportLogMock,
}));

describe("import actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("importa empresas válidas y registra el éxito", async () => {
    const rows: EmpresaImportRow[] = [
      {
        cif: "B12345678",
        nombre: "Empresa Demo S.L.",
        direccion: " Calle Mayor 1 ",
        localidad: "Alacant/Alicante",
        sector: "Otro",
        cicloFormativo: "",
        telefono: "600000000",
        email: "INFO@EMPRESA.COM",
        contacto: "Ana",
        emailContacto: "ANA@EMPRESA.COM",
      },
    ];

    prismaMock.empresa.findMany.mockResolvedValue([]);
    createEmpresasBatchMock.mockResolvedValue({ count: 1 });

    const result = await importEmpresas(rows);

    expect(result).toEqual({
      ok: true,
      message: "Importacion completada (1 registros).",
      importedCount: 1,
    });
    expect(prismaMock.empresa.findMany).toHaveBeenCalledWith({
      where: { cif: { in: ["B12345678"] } },
      select: { cif: true },
    });
    expect(createEmpresasBatchMock).toHaveBeenCalledWith([
      expect.objectContaining({
        cif: "B12345678",
        nombre: "Empresa Demo S.L.",
      }),
    ]);
    expect(createImportExportLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        entidad: "Empresas",
        accion: "Importacion",
        estado: "Completado",
        registros: 1,
      })
    );
  });

  it("bloquea la importación de empresas cuando detecta duplicados", async () => {
    const rows: EmpresaImportRow[] = [
      {
        cif: "B12345678",
        nombre: "Empresa Uno",
        localidad: "Alacant/Alicante",
        sector: "Otro",
      },
      {
        cif: "b12345678",
        nombre: "Empresa Dos",
        localidad: "Alacant/Alicante",
        sector: "Otro",
      },
    ];

    prismaMock.empresa.findMany.mockResolvedValue([]);

    const result = await importEmpresas(rows);

    expect(result.ok).toBe(false);
    expect(result.importedCount).toBe(0);
    if (!result.ok) {
      expect(result.errors).toContain(
        'CIF duplicado en el Excel: "B12345678" aparece en las filas 2 y 3.'
      );
    }
    expect(createEmpresasBatchMock).not.toHaveBeenCalled();
    expect(createImportExportLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        entidad: "Empresas",
        estado: "Fallido",
      })
    );
  });

  it("importa alumnos normalizando email y campos de salida", async () => {
    const rows: AlumnoImportRow[] = [
      {
        nia: "NIA-01",
        nombre: " Lucía Pérez ",
        telefono: "600000000",
        email: "LUCIA@MAIL.COM",
        ciclo: "DAM",
        curso: "2025-2026",
      },
    ];

    prismaMock.alumno.findMany.mockResolvedValue([]);
    prismaMock.alumno.createMany.mockResolvedValue({ count: 1 });

    const result = await importAlumnos(rows);

    expect(result).toEqual({
      ok: true,
      message: "Importacion completada (1 registros).",
      importedCount: 1,
    });
    expect(prismaMock.alumno.createMany).toHaveBeenCalledWith({
      data: [
        {
          nombre: "Lucía Pérez",
          nia: "NIA-01",
          telefono: "600000000",
          email: "lucia@mail.com",
          ciclo: "DAM",
          curso: "2025-2026",
        },
      ],
    });
    expect(createImportExportLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        entidad: "Alumnos",
        estado: "Completado",
        registros: 1,
      })
    );
  });

  it("bloquea la importación de alumnos si el NIA ya existe", async () => {
    const rows: AlumnoImportRow[] = [
      {
        nia: "NIA-01",
        nombre: "Lucía Pérez",
        telefono: "600000000",
        email: "lucia@mail.com",
        ciclo: "DAM",
        curso: "2025-2026",
      },
    ];

    prismaMock.alumno.findMany.mockResolvedValue([{ nia: "NIA-01" }]);

    const result = await importAlumnos(rows);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain(
        "Fila 2: ya existe un alumno con el NIA NIA-01."
      );
    }
    expect(prismaMock.alumno.createMany).not.toHaveBeenCalled();
    expect(createImportExportLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        entidad: "Alumnos",
        estado: "Fallido",
      })
    );
  });

  it("guarda todas las incidencias de validación por fila en alumnos", async () => {
    const rows: AlumnoImportRow[] = [
      {
        nia: "",
        nombre: "Alumno Demo",
        telefono: "123",
        email: "correo-invalido",
        ciclo: "XXX",
        curso: "",
      },
    ];

    prismaMock.alumno.findMany.mockResolvedValue([]);

    const result = await importAlumnos(rows);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual(
        expect.arrayContaining([
          "Fila 2: El NIA es obligatorio.",
          "Fila 2: El NIA solo puede contener letras, números y guiones.",
          "Fila 2: El teléfono debe tener 9 dígitos y empezar por 6, 7, 8 o 9.",
          "Fila 2: El email no es válido.",
          "Fila 2: El ciclo no es válido.",
          "Fila 2: El curso es obligatorio.",
          "Fila 2: El curso no es válido.",
        ])
      );
      expect(result.errors).toHaveLength(7);
    }
    expect(createImportExportLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        entidad: "Alumnos",
        estado: "Fallido",
        detalle: expect.stringContaining("Fila 2: El email no es válido."),
      })
    );
  });

  it("importa formaciones resolviendo empresa y alumno por nombre", async () => {
    const rows: FormacionImportRow[] = [
      {
        empresa: "  empresa demo s.l. ",
        alumno: "  Lucía Pérez ",
        periodo: "Marzo - Junio",
        descripcion: " Seguimiento FCT ",
        contacto: " Ana Tutor ",
        curso: "2025-2026",
      },
    ];

    prismaMock.empresa.findMany.mockResolvedValue([{ id: 10, nombre: "Empresa Demo S.L." }]);
    prismaMock.alumno.findMany.mockResolvedValue([{ id: 7, nombre: "Lucía Pérez" }]);
    prismaMock.formacionEmpresa.createMany.mockResolvedValue({ count: 1 });

    const result = await importFormaciones(rows);

    expect(result).toEqual({
      ok: true,
      message: "Importacion completada (1 registros).",
      importedCount: 1,
    });
    expect(prismaMock.formacionEmpresa.createMany).toHaveBeenCalledWith({
      data: [
        {
          empresaId: 10,
          alumnoId: 7,
          curso: "2025-2026",
          periodo: "Marzo - Junio",
          descripcion: "Seguimiento FCT",
          contacto: "Ana Tutor",
        },
      ],
    });
    expect(createImportExportLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        entidad: "Form. Empresa",
        estado: "Completado",
        registros: 1,
      })
    );
  });

  it("bloquea la importación de formaciones si el nombre de empresa es ambiguo", async () => {
    const rows: FormacionImportRow[] = [
      {
        empresa: "Empresa Demo",
        alumno: "Lucía Pérez",
        periodo: "Marzo - Junio",
        curso: "2025-2026",
      },
    ];

    prismaMock.empresa.findMany.mockResolvedValue([
      { id: 10, nombre: "Empresa Demo" },
      { id: 11, nombre: "Empresa Demo" },
    ]);
    prismaMock.alumno.findMany.mockResolvedValue([{ id: 7, nombre: "Lucía Pérez" }]);

    const result = await importFormaciones(rows);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain(
        'Fila 2: hay varias empresas llamadas "Empresa Demo". Usa nombres unicos antes de importar.'
      );
    }
    expect(prismaMock.formacionEmpresa.createMany).not.toHaveBeenCalled();
    expect(createImportExportLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        entidad: "Form. Empresa",
        estado: "Fallido",
      })
    );
  });

  it("guarda todas las incidencias de validación por fila en formación empresa", async () => {
    const rows: FormacionImportRow[] = [
      {
        empresa: "Empresa Demo",
        alumno: "Lucía Pérez",
        periodo: "",
        descripcion: "x".repeat(501),
        contacto: "Tutor 123",
        curso: "",
      },
    ];

    prismaMock.empresa.findMany.mockResolvedValue([{ id: 10, nombre: "Empresa Demo" }]);
    prismaMock.alumno.findMany.mockResolvedValue([{ id: 7, nombre: "Lucía Pérez" }]);

    const result = await importFormaciones(rows);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual(
        expect.arrayContaining([
          "Fila 2: El curso es obligatorio",
          "Fila 2: El curso no es válido",
          "Fila 2: El periodo es obligatorio",
          "Fila 2: El periodo debe contener texto útil",
          "Fila 2: La descripción no puede superar los 500 caracteres",
          "Fila 2: El contacto contiene caracteres no válidos",
          "Fila 2: El contacto no puede contener números",
        ])
      );
      expect(result.errors).toHaveLength(7);
    }
    expect(createImportExportLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        entidad: "Form. Empresa",
        estado: "Fallido",
        detalle: expect.stringContaining(
          "Fila 2: La descripción no puede superar los 500 caracteres"
        ),
      })
    );
  });
});
