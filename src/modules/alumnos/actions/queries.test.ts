import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAlumnoById, getAlumnosPaginated } from "./queries";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    alumno: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock("@/database/prisma", () => ({
  prisma: prismaMock,
}));

describe("alumnos queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normaliza el ciclo formativo y la fecha de CV en listados paginados", async () => {
    prismaMock.alumno.findMany.mockResolvedValue([
      {
        id: 1,
        nombre: "Ana",
        nia: "A-1",
        cicloFormativoId: null,
        cvUpdatedAt: new Date("2026-04-01T10:30:00.000Z"),
        cicloFormativoRef: {
          id: 7,
          nombre: "DAM",
          codigo: "DAM",
        },
      },
    ]);
    prismaMock.alumno.count.mockResolvedValue(1);

    const result = await getAlumnosPaginated({ page: 1, perPage: 10 });

    expect(result).toEqual({
      items: [
        expect.objectContaining({
          id: 1,
          cicloFormativoId: 7,
          cicloFormativoNombre: "DAM",
          cicloFormativoCodigo: "DAM",
          cvUpdatedAt: "2026-04-01T10:30:00.000Z",
        }),
      ],
      total: 1,
      page: 1,
      perPage: 10,
      totalPages: 1,
    });
  });

  it("construye filtros por ciclo, curso y texto de busqueda", async () => {
    prismaMock.alumno.findMany.mockResolvedValue([]);
    prismaMock.alumno.count.mockResolvedValue(0);

    await getAlumnosPaginated({
      ciclo: "DAM",
      curso: "2025-2026",
      search: "ana",
      page: 2,
      perPage: 5,
    });

    expect(prismaMock.alumno.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          cicloFormativoRef: {
            is: { nombre: "DAM" },
          },
          curso: "2025-2026",
          OR: [
            { nombre: { contains: "ana", mode: "insensitive" } },
            { nia: { contains: "ana", mode: "insensitive" } },
          ],
        },
        skip: 5,
        take: 5,
      })
    );
  });

  it("normaliza tambien el ciclo formativo en la lectura por id", async () => {
    prismaMock.alumno.findUnique.mockResolvedValue({
      id: 2,
      nombre: "Luis",
      nia: "B-2",
      cicloFormativoId: 3,
      cvUpdatedAt: null,
      cicloFormativoRef: {
        id: 9,
        nombre: "DAW",
        codigo: "DAW",
      },
    });

    const result = await getAlumnoById(2);

    expect(result).toEqual(
      expect.objectContaining({
        id: 2,
        cicloFormativoId: 9,
        cicloFormativoNombre: "DAW",
        cicloFormativoCodigo: "DAW",
        cvUpdatedAt: null,
      })
    );
  });
});
