import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearAllAlumnosCv, readAllAlumnosCv } from "./cv";

const createTxMock = () => ({
  alumno: {
    findMany: vi.fn(),
    updateMany: vi.fn(),
  },
  $queryRawUnsafe: vi.fn(),
  $executeRawUnsafe: vi.fn(),
});

describe("alumnos cv actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("aplica filtros al preparar el zip de CVs", async () => {
    const tx = createTxMock();
    tx.alumno.findMany.mockResolvedValue([
      {
        id: 1,
        nombre: "Ana",
        nia: "A-1",
        cvOid: 42,
        cvNombre: "ana.pdf",
        cvMimeType: "application/pdf",
        cvTamano: 3,
      },
    ]);
    tx.$queryRawUnsafe.mockResolvedValue([{ data: Buffer.from("pdf") }]);

    const result = await readAllAlumnosCv(tx as any, {
      ciclo: "DAM",
      curso: "2025-2026",
      search: "ana",
    });

    expect(tx.alumno.findMany).toHaveBeenCalledWith(
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
          cvOid: { not: null },
          cvNombre: { not: null },
          cvMimeType: { not: null },
          cvTamano: { not: null },
        },
      })
    );
    expect(result?.count).toBe(1);
  });

  it("aplica filtros al eliminar CVs en bloque", async () => {
    const tx = createTxMock();
    tx.alumno.findMany.mockResolvedValue([
      { id: 1, cvOid: 42 },
      { id: 2, cvOid: 43 },
    ]);
    tx.alumno.updateMany.mockResolvedValue({ count: 2 });

    const result = await clearAllAlumnosCv(tx as any, {
      ciclo: "DAW",
      curso: "2026-2027",
      search: "luis",
    });

    expect(tx.alumno.findMany).toHaveBeenCalledWith({
      where: {
        cicloFormativoRef: {
          is: { nombre: "DAW" },
        },
        curso: "2026-2027",
        OR: [
          { nombre: { contains: "luis", mode: "insensitive" } },
          { nia: { contains: "luis", mode: "insensitive" } },
        ],
        cvOid: { not: null },
      },
      select: {
        id: true,
        cvOid: true,
      },
    });
    expect(tx.$executeRawUnsafe).toHaveBeenCalledTimes(2);
    expect(tx.alumno.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: [1, 2] } },
      })
    );
    expect(result).toBe(2);
  });
});
