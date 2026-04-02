import { beforeEach, describe, expect, it, vi } from "vitest";
import { CARDS } from "./config";
import {
  buildSheetRows,
  collectExcelValidationErrors,
  findDuplicateValues,
  formatDateStamp,
  getMissingHeaders,
  mapAlumnoRows,
  normalizeHeader,
  normalizePhone,
} from "./utils";

describe("importexport utils", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string) => ({
        json: async () =>
          input.includes("/api/catalogos/empresas")
            ? {
                ok: true,
                data: {
                  ciclosFormativos: [
                    { id: 1, nombre: "DAM" },
                    { id: 2, nombre: "DAW" },
                  ],
                },
              }
            : {
                ok: true,
                data: {
                  numeroCursosVisibles: 2,
                  mesCambioCurso: 9,
                },
              },
      }))
    );
  });

  it("normaliza cabeceras con tildes, simbolos y espacios", () => {
    expect(normalizeHeader("  Correo   Contacto ")).toBe("correo contacto");
    expect(normalizeHeader("Cíclo   Formativo")).toBe("ciclo formativo");
    expect(normalizeHeader("Curso-Ciclo")).toBe("curso ciclo");
  });

  it("detecta columnas obligatorias ausentes aunque la cabecera venga con variantes", () => {
    const alumnosConfig = CARDS.find((card) => card.entidad === "alumnos")!;
    const headers = ["NIA", "Nombre", "Teléfono", "Correo", "Curso Cíclo"];

    expect(getMissingHeaders(headers, alumnosConfig)).toEqual(
      expect.arrayContaining(["Ciclo", "Curso"])
    );
  });

  it("reconstruye filas desde cabeceras flexibles y elimina filas completamente vacias", () => {
    const alumnosConfig = CARDS.find((card) => card.entidad === "alumnos")!;
    const rows = buildSheetRows(
      [
        {
          " N.I.A. ": "A-1 ",
          Nombre: " Lucia Perez ",
          "Teléfono": "600 000 000",
          Correo: " lucia@mail.com ",
          "Curso Cíclo": "1",
          Curso: "2025-2026",
          Ciclo: "DAM",
        },
        {
          Nombre: "   ",
          NIA: "",
        },
      ],
      alumnosConfig
    );

    expect(rows).toEqual([
      {
        NIA: "A-1",
        NIF: "",
        NUSS: "",
        Nombre: "Lucia Perez",
        "Teléfono": "600 000 000",
        Correo: "lucia@mail.com",
        Ciclo: "DAM",
        "Curso Ciclo": "1",
        Curso: "2025-2026",
      },
    ]);
  });

  it("detecta duplicados case-insensitive en una columna", () => {
    const duplicates = findDuplicateValues(
      [
        { NIA: "nia-01" },
        { NIA: "NIA-01" },
        { NIA: "NIA-02" },
      ],
      "NIA"
    );

    expect(duplicates).toEqual([
      {
        value: "NIA-01",
        firstRow: 2,
        duplicateRow: 3,
      },
    ]);
  });

  it("valida duplicados de NIA, NIF y NUSS antes de enviar alumnos a la API", async () => {
    const alumnosConfig = CARDS.find((card) => card.entidad === "alumnos")!;
    const errors = await collectExcelValidationErrors({
      config: alumnosConfig,
      headerRow: ["NIA", "NIF", "NUSS", "Nombre", "Teléfono", "Correo", "Ciclo", "Curso Ciclo", "Curso"],
      rows: [
        {
          NIA: "NIA-01",
          NIF: "12345678Z",
          NUSS: "123456789012",
          Nombre: "Lucia",
          "Teléfono": "600000000",
          Correo: "lucia@mail.com",
          Ciclo: "DAM",
          "Curso Ciclo": "1",
          Curso: "2025-2026",
        },
        {
          NIA: "nia-01",
          NIF: "12345678z",
          NUSS: "123456789012",
          Nombre: "Marta",
          "Teléfono": "600000001",
          Correo: "marta@mail.com",
          Ciclo: "DAW",
          "Curso Ciclo": "2",
          Curso: "2025-2026",
        },
      ],
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        'NIA duplicado en el Excel: "nia-01" aparece en las filas 2 y 3.',
        'NIF duplicado en el Excel: "12345678z" aparece en las filas 2 y 3.',
        'NUSS duplicado en el Excel: "123456789012" aparece en las filas 2 y 3.',
      ])
    );
  });

  it("valida catalogos de empresas y faltas obligatorias", async () => {
    const empresasConfig = CARDS.find((card) => card.entidad === "empresas")!;
    const errors = await collectExcelValidationErrors({
      config: empresasConfig,
      headerRow: ["CIF", "Nombre", "Localidad", "Telefono"],
      rows: [
        {
          CIF: "B12345678",
          Nombre: "",
          Direccion: "",
          Localidad: "Localidad Inventada",
          Sector: "Sector Inventado",
          "Ciclo Formativo": "Ciclo Inventado",
          Telefono: "600000000",
          "Correo Empresa": "",
          Contacto: "",
          "Correo Contacto": "",
        },
      ],
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        "Faltan columnas obligatorias en la cabecera: Sector.",
        "Fila 2: faltan datos obligatorios en Nombre.",
        'Fila 2: la localidad "Localidad Inventada" no existe en el catalogo.',
        'Fila 2: el sector "Sector Inventado" no existe en el catalogo.',
        'Fila 2: el ciclo formativo "Ciclo Inventado" no existe en el catalogo.',
      ])
    );
  });

  it("normaliza telefonos al mapear filas de alumnos", () => {
    const mapped = mapAlumnoRows([
      {
        NIA: "NIA-01",
        NIF: "",
        NUSS: "",
        Nombre: "Lucia",
        "Teléfono": "600 000 000",
        Correo: "lucia@mail.com",
        Ciclo: "DAM",
        "Curso Ciclo": "1",
        Curso: "2025-2026",
      },
    ]);

    expect(mapped).toEqual([
      {
        nia: "NIA-01",
        nif: "",
        nuss: "",
        nombre: "Lucia",
        telefono: "600000000",
        email: "lucia@mail.com",
        ciclo: "DAM",
        cursoCiclo: "1",
        curso: "2025-2026",
      },
    ]);
  });

  it("mantiene utilidades basicas estables", () => {
    expect(normalizePhone(" 600 111 222 ")).toBe("600111222");
    expect(formatDateStamp(new Date("2026-03-31T10:20:30Z"))).toBe("2026-03-31");
  });
});
