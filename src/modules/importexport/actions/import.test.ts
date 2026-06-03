import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  importAlumnos,
  importEmpresas,
  importFormaciones,
  importProfesores,
  type AlumnoImportRow,
  type EmpresaImportRow,
  type FormacionImportRow,
  type ProfesorImportRow,
} from "./import";

const {
  prismaMock,
  createEmpresasBatchMock,
  createImportExportLogMock,
  getAcademicEmailUsageMock,
  getEmailDomainsConfigMock,
  createProfesoresBatchMock,
  syncAcademicUserIdentityMock,
  txMock,
} = vi.hoisted(() => ({
  prismaMock: {
    empresa: {
      findMany: vi.fn(),
    },
    sector: {
      findMany: vi.fn(),
    },
    localidad: {
      findMany: vi.fn(),
    },
    cicloFormativo: {
      findMany: vi.fn(),
    },
    profesor: {
      findMany: vi.fn(),
    },
    alumno: {
      findMany: vi.fn(),
      createMany: vi.fn(),
    },
    formacionEmpresa: {
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  createEmpresasBatchMock: vi.fn(),
  createProfesoresBatchMock: vi.fn(),
  createImportExportLogMock: vi.fn(),
  getAcademicEmailUsageMock: vi.fn(),
  getEmailDomainsConfigMock: vi.fn(),
  syncAcademicUserIdentityMock: vi.fn(),
  txMock: {
    alumno: {
      createMany: vi.fn(),
    },
    usuario: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    localAuthAccount: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("@/database/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/modules/empresas/actions/mutations", () => ({
  createEmpresasBatch: createEmpresasBatchMock,
}));

vi.mock("@/modules/profesores/actions/mutations", () => ({
  createProfesoresBatch: createProfesoresBatchMock,
}));

vi.mock("./logs", () => ({
  createImportExportLog: createImportExportLogMock,
}));

vi.mock("@/modules/settings/actions/queries", () => ({
  getCursosAcademicosConfigurados: vi.fn(async () => ["2025-2026", "2026-2027"]),
  getEmailDomainsConfig: getEmailDomainsConfigMock,
}));

vi.mock("@/shared/identity/academic-email", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/identity/academic-email")>();
  return {
    ...actual,
    getAcademicEmailUsage: getAcademicEmailUsageMock,
  };
});

vi.mock("@/shared/identity/academic-user", () => ({
  syncAcademicUserIdentity: syncAcademicUserIdentityMock,
}));

describe("import actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAcademicEmailUsageMock.mockResolvedValue({
      alumnos: new Set<string>(),
      profesores: new Set<string>(),
    });
    getEmailDomainsConfigMock.mockResolvedValue({
      dominiosAlumnos: ["alu.edu.gva.es", "mail.com"],
      dominiosProfesores: ["edu.gva.es", "mail.com"],
      extraDominiosAlumnos: ["mail.com"],
      extraDominiosProfesores: ["mail.com"],
    });
    prismaMock.sector.findMany.mockResolvedValue([
      { id: 1, nombre: "Otro" },
      { id: 2, nombre: "Tecnologia" },
    ]);
    prismaMock.localidad.findMany.mockResolvedValue([
      { id: 3, nombre: "Alacant/Alicante" },
      { id: 4, nombre: "Elx/Elche" },
    ]);
    prismaMock.cicloFormativo.findMany.mockResolvedValue([
      { id: 1, nombre: "DAM" },
      { id: 2, nombre: "DAW" },
    ]);
    prismaMock.profesor.findMany.mockResolvedValue([]);
    syncAcademicUserIdentityMock.mockResolvedValue(undefined);
    prismaMock.$transaction.mockImplementation(async (callback: (tx: typeof txMock) => unknown) =>
      callback(txMock)
    );
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

  it("bloquea la importacion de empresas si el sector o la localidad no existen en el catalogo activo", async () => {
    const rows: EmpresaImportRow[] = [
      {
        cif: "B12345678",
        nombre: "Empresa Demo",
        localidad: "Localidad Inventada",
        sector: "Sector Inventado",
        cicloFormativo: "",
      },
    ];

    prismaMock.empresa.findMany.mockResolvedValue([]);

    const result = await importEmpresas(rows);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual(
        expect.arrayContaining([
          'Fila 2: el sector "Sector Inventado" no existe en el catalogo activo.',
          'Fila 2: la localidad "Localidad Inventada" no existe en el catalogo activo.',
        ])
      );
    }
    expect(createEmpresasBatchMock).not.toHaveBeenCalled();
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
    txMock.alumno.createMany.mockResolvedValue({ count: 1 });

    const result = await importAlumnos(rows);

    expect(result).toEqual({
      ok: true,
      message: "Importacion completada (1 registros).",
      importedCount: 1,
    });
    expect(txMock.alumno.createMany).toHaveBeenCalledWith({
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
    expect(syncAcademicUserIdentityMock).toHaveBeenCalledWith(txMock, {
      entity: "ALUMNO",
      nombre: "Lucia Perez",
      email: "lucia@mail.com",
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
    expect(txMock.alumno.createMany).not.toHaveBeenCalled();
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
    expect(txMock.alumno.createMany).not.toHaveBeenCalled();
  });

  it("bloquea la importacion de alumnos si el Excel repite email", async () => {
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
      {
        nia: "NIA-02",
        nif: "",
        nuss: "",
        nombre: "Marta Perez",
        telefono: "600000001",
        email: "LUCIA@MAIL.COM",
        ciclo: "DAW",
        cursoCiclo: 2,
        curso: "2025-2026",
      },
    ];

    prismaMock.alumno.findMany.mockResolvedValue([]);

    const result = await importAlumnos(rows);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain(
        'Email duplicado en el Excel: "lucia@mail.com" aparece en las filas 2 y 3.'
      );
    }
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
    expect(txMock.alumno.createMany).not.toHaveBeenCalled();
  });

  it("bloquea la importacion de alumnos si el email ya esta asignado a un profesor", async () => {
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

    prismaMock.alumno.findMany.mockResolvedValue([]);
    getAcademicEmailUsageMock.mockResolvedValue({
      alumnos: new Set<string>(),
      profesores: new Set<string>(["lucia@mail.com"]),
    });

    const result = await importAlumnos(rows);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain(
        "Fila 2: el email lucia@mail.com ya esta asignado a un profesor."
      );
    }
  });

  it("rechaza filas de alumnos cuyo dominio de email no esta permitido", async () => {
    getEmailDomainsConfigMock.mockResolvedValue({
      dominiosAlumnos: ["alu.edu.gva.es"],
      dominiosProfesores: ["edu.gva.es"],
      extraDominiosAlumnos: [],
      extraDominiosProfesores: [],
    });

    const rows: AlumnoImportRow[] = [
      {
        nia: "NIA-01",
        nif: "12345678Z",
        nuss: "123456789012",
        nombre: "Lucia Perez",
        telefono: "600000000",
        email: "lucia@gmail.com",
        ciclo: "DAM",
        cursoCiclo: "1",
        curso: "2025-2026",
      },
    ];

    prismaMock.alumno.findMany.mockResolvedValue([]);

    const result = await importAlumnos(rows);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain(
        "Fila 2: El dominio del email no está permitido para alumnos."
      );
    }
    expect(txMock.alumno.createMany).not.toHaveBeenCalled();
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

  it("importa formaciones resolviendo empresa y alumno por CIF y NIA", async () => {
    const rows: FormacionImportRow[] = [
      {
        cif: "  B12345678 ",
        nia: "  NIA-01 ",
        periodo: "Marzo - Junio",
        descripcion: " Seguimiento FCT ",
        tutorLaboral: " Ana Tutor ",
        emailTutorLaboral: " ANA.TUTOR@EMPRESA.COM ",
        curso: "2025-2026",
      },
    ];

    prismaMock.empresa.findMany.mockResolvedValue([{ id: 10, cif: "B12345678" }]);
    prismaMock.alumno.findMany.mockResolvedValue([{ id: 7, nia: "NIA-01" }]);
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

  it("bloquea la importacion de formaciones si el CIF de empresa no existe", async () => {
    const rows: FormacionImportRow[] = [
      {
        cif: "B00000000",
        nia: "NIA-01",
        periodo: "Marzo - Junio",
        curso: "2025-2026",
      },
    ];

    prismaMock.empresa.findMany.mockResolvedValue([{ id: 10, cif: "B12345678" }]);
    prismaMock.alumno.findMany.mockResolvedValue([{ id: 7, nia: "NIA-01" }]);

    const result = await importFormaciones(rows);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain(
        'Fila 2: no existe ninguna empresa con el CIF "B00000000".'
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

  it("bloquea la importacion de formaciones si el NIA del alumno no existe", async () => {
    const rows: FormacionImportRow[] = [
      {
        cif: "B12345678",
        nia: "NIA-404",
        periodo: "Marzo - Junio",
        curso: "2025-2026",
      },
    ];

    prismaMock.empresa.findMany.mockResolvedValue([{ id: 10, cif: "B12345678" }]);
    prismaMock.alumno.findMany.mockResolvedValue([]);

    const result = await importFormaciones(rows);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain(
        'Fila 2: no existe ningun alumno con el NIA "NIA-404".'
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

  it("importa profesores con email obligatorio y normalizado", async () => {
    const rows: ProfesorImportRow[] = [
      {
        nombre: "Ana Tutor",
        nif: "12345678A",
        especialidad: "Informatica",
        telefono: "612345678",
        email: "ANA.TUTOR@MAIL.COM",
        cicloFormativo: "DAM",
      },
    ];

    createProfesoresBatchMock.mockResolvedValue({ count: 1 });

    const result = await importProfesores(rows);

    expect(result).toEqual({
      ok: true,
      message: "Importacion completada (1 registros).",
      importedCount: 1,
    });
    expect(createProfesoresBatchMock).toHaveBeenCalledWith([
      expect.objectContaining({
        email: "ANA.TUTOR@MAIL.COM",
        cicloFormativoId: 1,
      }),
    ]);
  });

  it("bloquea la importacion de profesores si el email ya esta asignado a un alumno", async () => {
    const rows: ProfesorImportRow[] = [
      {
        nombre: "Ana Tutor",
        nif: "12345678A",
        especialidad: "Informatica",
        telefono: "612345678",
        email: "ana.tutor@mail.com",
        cicloFormativo: "DAM",
      },
    ];

    getAcademicEmailUsageMock.mockResolvedValue({
      alumnos: new Set<string>(["ana.tutor@mail.com"]),
      profesores: new Set<string>(),
    });

    const result = await importProfesores(rows);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain(
        "Fila 2: el email ana.tutor@mail.com ya esta asignado a un alumno."
      );
    }
    expect(createProfesoresBatchMock).not.toHaveBeenCalled();
  });

  it("rechaza filas de profesores cuyo dominio de email no esta permitido", async () => {
    getEmailDomainsConfigMock.mockResolvedValue({
      dominiosAlumnos: ["alu.edu.gva.es"],
      dominiosProfesores: ["edu.gva.es"],
      extraDominiosAlumnos: [],
      extraDominiosProfesores: [],
    });

    const rows: ProfesorImportRow[] = [
      {
        nombre: "Ana Tutor",
        nif: "12345678A",
        especialidad: "Informatica",
        telefono: "612345678",
        email: "ana.tutor@gmail.com",
        cicloFormativo: "DAM",
      },
    ];

    const result = await importProfesores(rows);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain(
        "Fila 2: El dominio del email no está permitido para profesores."
      );
    }
    expect(createProfesoresBatchMock).not.toHaveBeenCalled();
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
        cif: "B12345678",
        nia: "NIA-01",
        periodo: "",
        descripcion: "x".repeat(501),
        tutorLaboral: "Tutor 123",
        curso: "",
      },
    ];

    prismaMock.empresa.findMany.mockResolvedValue([{ id: 10, cif: "B12345678" }]);
    prismaMock.alumno.findMany.mockResolvedValue([{ id: 7, nia: "NIA-01" }]);

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
