CREATE TYPE "OfertaEstado" AS ENUM ('BORRADOR', 'PUBLICADA', 'CERRADA');

CREATE TABLE "cursos_externos" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "proveedor" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "nivel" TEXT NOT NULL,
    "modalidad" TEXT NOT NULL,
    "duracion" TEXT,
    "descripcion" TEXT,
    "enlace" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cursos_externos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ofertas_practicas" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "empresa" TEXT NOT NULL,
    "cicloFormativoId" INTEGER,
    "plazas" INTEGER NOT NULL DEFAULT 1,
    "requisitos" TEXT,
    "periodo" TEXT,
    "descripcion" TEXT,
    "estado" "OfertaEstado" NOT NULL DEFAULT 'PUBLICADA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ofertas_practicas_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cursos_externos_titulo_proveedor_key" ON "cursos_externos"("titulo", "proveedor");
CREATE INDEX "cursos_externos_activo_idx" ON "cursos_externos"("activo");
CREATE INDEX "ofertas_practicas_estado_idx" ON "ofertas_practicas"("estado");
CREATE INDEX "ofertas_practicas_cicloFormativoId_idx" ON "ofertas_practicas"("cicloFormativoId");

ALTER TABLE "ofertas_practicas"
ADD CONSTRAINT "ofertas_practicas_cicloFormativoId_fkey"
FOREIGN KEY ("cicloFormativoId") REFERENCES "ciclos_formativos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
