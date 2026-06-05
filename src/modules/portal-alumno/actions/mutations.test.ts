import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    ofertaPractica: {
      findFirst: vi.fn(),
    },
    ofertaPracticaInteres: {
      upsert: vi.fn(),
    },
    cursoExterno: {
      findFirst: vi.fn(),
    },
    cursoExternoInscripcion: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock("@/database/prisma", () => ({
  prisma: prismaMock,
}));

import {
  registrarInscripcionCursoExterno,
  registrarInteresOfertaPractica,
} from "./mutations";

describe("portal alumno mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registra el interes de un alumno en una oferta publicada", async () => {
    const createdAt = new Date("2026-06-04T10:00:00.000Z");
    prismaMock.ofertaPractica.findFirst.mockResolvedValue({ id: 12 });
    prismaMock.ofertaPracticaInteres.upsert.mockResolvedValue({
      id: 1,
      alumnoId: 7,
      ofertaId: 12,
      createdAt,
      updatedAt: createdAt,
    });

    const result = await registrarInteresOfertaPractica(7, 12);

    expect(prismaMock.ofertaPractica.findFirst).toHaveBeenCalledWith({
      where: { id: 12, estado: "PUBLICADA" },
      select: { id: true },
    });
    expect(prismaMock.ofertaPracticaInteres.upsert).toHaveBeenCalledWith({
      where: { alumnoId_ofertaId: { alumnoId: 7, ofertaId: 12 } },
      update: {},
      create: { alumnoId: 7, ofertaId: 12 },
    });
    expect(result.ofertaId).toBe(12);
  });

  it("rechaza ofertas que no estan publicadas o no existen", async () => {
    prismaMock.ofertaPractica.findFirst.mockResolvedValue(null);

    await expect(registrarInteresOfertaPractica(7, 99)).rejects.toThrow(
      "OFERTA_NO_DISPONIBLE"
    );
    expect(prismaMock.ofertaPracticaInteres.upsert).not.toHaveBeenCalled();
  });

  it("registra la inscripcion de un alumno en un curso activo", async () => {
    const createdAt = new Date("2026-06-04T10:00:00.000Z");
    prismaMock.cursoExterno.findFirst.mockResolvedValue({ id: 4 });
    prismaMock.cursoExternoInscripcion.upsert.mockResolvedValue({
      id: 2,
      alumnoId: 7,
      cursoId: 4,
      createdAt,
      updatedAt: createdAt,
    });

    const result = await registrarInscripcionCursoExterno(7, 4);

    expect(prismaMock.cursoExterno.findFirst).toHaveBeenCalledWith({
      where: { id: 4, activo: true },
      select: { id: true },
    });
    expect(prismaMock.cursoExternoInscripcion.upsert).toHaveBeenCalledWith({
      where: { alumnoId_cursoId: { alumnoId: 7, cursoId: 4 } },
      update: {},
      create: { alumnoId: 7, cursoId: 4 },
    });
    expect(result.cursoId).toBe(4);
  });

  it("rechaza cursos inactivos o inexistentes", async () => {
    prismaMock.cursoExterno.findFirst.mockResolvedValue(null);

    await expect(registrarInscripcionCursoExterno(7, 99)).rejects.toThrow(
      "CURSO_NO_DISPONIBLE"
    );
    expect(prismaMock.cursoExternoInscripcion.upsert).not.toHaveBeenCalled();
  });
});
