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
    cicloFormativo: {
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

vi.mock("@/modules/settings/actions/queries", () => ({
  getCursosAcademicosConfigurados: vi.fn(async () => ["2025-2026", "2026-2027"]),
}));

describe("import actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.cicloFormativo.findMany.mockResolvedValue([
      { id: 1, nombre: "DAM" },
      { id: 2, nombre: "DAW" },
    ]);
  });

  it("importa empresas validas y registra el exito", async () => {
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
        cicloFormativoId: null,
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

  it("bloquea la importacion de empresas cuando detecta duplicados", async () => {
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
        nif: "12345678Z",
        nuss: "123456789012",
        nombre: " Lucia Perez ",
        telefono: "600000000",
        email: "LUCIA@MAIL.COM",
        ciclo: "DAM",
        cursoCiclo: "1",
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
          nombre: "Lucia Perez",
          nia: "NIA-01",
          nif: "12345678Z",
          nuss: "123456789012",
          telefono: "600000000",
          email: "lucia@mail.com",
          cicloFormativoId: 1,
          cursoCiclo: 1,
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

  it("bloquea la importacion de alumnos si el NIA ya existe", async () => {
    const rows: AlumnoImportRow[] = [
      {
        nia: "NIA-01",
        nif: "",
        nuss: "",
        nombre: "Lucia Perez",
        telefono: "600000000",
        email: "lucia@mail.com",
        ciclo: "DAM",
        cursoCiclo: 1,
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

  it("bloquea la importacion de alumnos si el Excel repite NIF o NUSS", async () => {
    const rows: AlumnoImportRow[] = [
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
      {
        nia: "NIA-02",
        nif: "12345678z",
        nuss: "123456789012",
        nombre: "Marta Perez",
        telefono: "600000001",
        email: "marta@mail.com",
        ciclo: "DAW",
        cursoCiclo: 2,
        curso: "2025-2026",
      },
    ];

    prismaMock.alumno.findMany.mockResolvedValue([]);

    const result = await importAlumnos(rows);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual(
        expect.arrayContaining([
          'NIF duplicado en el Excel: "12345678Z" aparece en las filas 2 y 3.',
          'NUSS duplicado en el Excel: "123456789012" aparece en las filas 2 y 3.',
        ])
      );
    }
    expect(prismaMock.alumno.createMany).not.toHaveBeenCalled();
  });

  it("bloquea la importacion de alumnos si ya existen NIF o NUSS en la base", async () => {
    const rows: AlumnoImportRow[] = [
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
    ];

    prismaMock.alumno.findMany.mockResolvedValue([
      { nia: "OTRO-NIA", nif: "12345678Z", nuss: "123456789012" },
    ]);

    const result = await importAlumnos(rows);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual(
        expect.arrayContaining([
          "Fila 2: ya existe un alumno con el NIF 12345678Z.",
          "Fila 2: ya existe un alumno con el NUSS 123456789012.",
        ])
      );
    }
    expect(prismaMock.alumno.createMany).not.toHaveBeenCalled();
  });

  it("rechaza importaciones vacias en alumnos", async () => {
    const result = await importAlumnos([]);

    expect(result).toEqual({
      ok: false,
      message: "El archivo no contiene filas con datos para importar.",
      importedCount: 0,
      errors: ["El archivo no contiene filas con datos para importar."],
    });
    expect(createImportExportLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        entidad: "Alumnos",
        estado: "Fallido",
        registros: 0,
      })
    );
  });

  it("guarda todas las incidencias de validacion por fila en alumnos", async () => {
    const rows: AlumnoImportRow[] = [
      {
        nia: "",
        nif: "",
        nuss: "",
        nombre: "Alumno Demo",
        telefono: "123",
        email: "correo-invalido",
        ciclo: "",
        cursoCiclo: "",
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
          "Fila 2: El ciclo es obligatorio.",
          "Fila 2: El curso ciclo debe ser 1 o 2.",
          "Fila 2: El curso es obligatorio.",
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
        alumno: "  Lucia Perez ",
        periodo: "Marzo - Junio",
        descripcion: " Seguimiento FCT ",
        tutorLaboral: " Ana Tutor ",
        emailTutorLaboral: " ANA.TUTOR@EMPRESA.COM ",
        curso: "2025-2026",
      },
    ];

    prismaMock.empresa.findMany.mockResolvedValue([{ id: 10, nombre: "Empresa Demo S.L." }]);
    prismaMock.alumno.findMany.mockResolvedValue([{ id: 7, nombre: "Lucia Perez" }]);
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
          tutorLaboral: "Ana Tutor",
          emailTutorLaboral: "ana.tutor@empresa.com",
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

  it("bloquea la importacion de formaciones si el nombre de empresa es ambiguo", async () => {
    const rows: FormacionImportRow[] = [
      {
        empresa: "Empresa Demo",
        alumno: "Lucia Perez",
        periodo: "Marzo - Junio",
        curso: "2025-2026",
      },
    ];

    prismaMock.empresa.findMany.mockResolvedValue([
      { id: 10, nombre: "Empresa Demo" },
      { id: 11, nombre: "Empresa Demo" },
    ]);
    prismaMock.alumno.findMany.mockResolvedValue([{ id: 7, nombre: "Lucia Perez" }]);

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

  it("bloquea la importacion de formaciones si el alumno no existe", async () => {
    const rows: FormacionImportRow[] = [
      {
        empresa: "Empresa Demo",
        alumno: "Alumno Fantasma",
        periodo: "Marzo - Junio",
        curso: "2025-2026",
      },
    ];

    prismaMock.empresa.findMany.mockResolvedValue([{ id: 10, nombre: "Empresa Demo" }]);
    prismaMock.alumno.findMany.mockResolvedValue([]);

    const result = await importFormaciones(rows);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain(
        'Fila 2: no existe ningun alumno con el nombre "Alumno Fantasma".'
      );
    }
    expect(prismaMock.formacionEmpresa.createMany).not.toHaveBeenCalled();
  });

  it("rechaza importaciones vacias en formacion empresa", async () => {
    const result = await importFormaciones([]);

    expect(result).toEqual({
      ok: false,
      message: "El archivo no contiene filas con datos para importar.",
      importedCount: 0,
      errors: ["El archivo no contiene filas con datos para importar."],
    });
    expect(createImportExportLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        entidad: "Form. Empresa",
        estado: "Fallido",
        registros: 0,
      })
    );
  });

  it("rechaza importaciones vacias en empresas", async () => {
    const result = await importEmpresas([]);

    expect(result).toEqual({
      ok: false,
      message: "El archivo no contiene filas con datos para importar.",
      importedCount: 0,
      errors: ["El archivo no contiene filas con datos para importar."],
    });
    expect(createImportExportLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        entidad: "Empresas",
        estado: "Fallido",
        registros: 0,
      })
    );
  });

  it("guarda todas las incidencias de validacion por fila en formacion empresa", async () => {
    const rows: FormacionImportRow[] = [
      {
        empresa: "Empresa Demo",
        alumno: "Lucia Perez",
        periodo: "",
        descripcion: "x".repeat(501),
        tutorLaboral: "Tutor 123",
        curso: "",
      },
    ];

    prismaMock.empresa.findMany.mockResolvedValue([{ id: 10, nombre: "Empresa Demo" }]);
    prismaMock.alumno.findMany.mockResolvedValue([{ id: 7, nombre: "Lucia Perez" }]);

    const result = await importFormaciones(rows);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual(
        expect.arrayContaining([
          "Fila 2: El curso es obligatorio",
          "Fila 2: El periodo es obligatorio",
          "Fila 2: El periodo debe contener texto util",
          "Fila 2: La descripcion no puede superar los 500 caracteres",
          "Fila 2: El tutor laboral contiene caracteres no validos",
          "Fila 2: El tutor laboral no puede contener numeros",
        ])
      );
      expect(result.errors).toHaveLength(6);
    }
    expect(createImportExportLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        entidad: "Form. Empresa",
        estado: "Fallido",
        detalle: expect.stringContaining(
          "Fila 2: La descripcion no puede superar los 500 caracteres"
        ),
      })
    );
  });
});
