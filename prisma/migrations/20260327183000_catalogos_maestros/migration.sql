-- CreateTable
CREATE TABLE "sectores" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sectores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "localidades" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "localidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ciclos_formativos" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ciclos_formativos_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "empresas"
ADD COLUMN "localidadId" INTEGER,
ADD COLUMN "sectorId" INTEGER,
ADD COLUMN "cicloFormativoId" INTEGER;

-- AlterTable
ALTER TABLE "alumnos"
ADD COLUMN "cicloFormativoId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "sectores_nombre_key" ON "sectores"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "localidades_nombre_key" ON "localidades"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "ciclos_formativos_nombre_key" ON "ciclos_formativos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "ciclos_formativos_codigo_key" ON "ciclos_formativos"("codigo");

-- Seed base catalogs from current live data to avoid breaking the transition.
INSERT INTO "sectores" ("nombre", "createdAt", "updatedAt")
SELECT DISTINCT TRIM("sector"), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "empresas"
WHERE TRIM(COALESCE("sector", '')) <> ''
ON CONFLICT ("nombre") DO NOTHING;

INSERT INTO "localidades" ("nombre", "createdAt", "updatedAt")
SELECT DISTINCT TRIM("localidad"), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "empresas"
WHERE TRIM(COALESCE("localidad", '')) <> ''
ON CONFLICT ("nombre") DO NOTHING;

INSERT INTO "ciclos_formativos" ("nombre", "createdAt", "updatedAt")
SELECT DISTINCT ciclo_nombre, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (
    SELECT TRIM("cicloFormativo") AS ciclo_nombre
    FROM "empresas"
    WHERE TRIM(COALESCE("cicloFormativo", '')) <> ''
    UNION
    SELECT TRIM("ciclo") AS ciclo_nombre
    FROM "alumnos"
    WHERE TRIM(COALESCE("ciclo", '')) <> ''
) ciclos
ON CONFLICT ("nombre") DO NOTHING;

-- Backfill FK columns from the current string fields.
UPDATE "empresas" e
SET "sectorId" = s."id"
FROM "sectores" s
WHERE e."sectorId" IS NULL
  AND TRIM(COALESCE(e."sector", '')) <> ''
  AND s."nombre" = TRIM(e."sector");

UPDATE "empresas" e
SET "localidadId" = l."id"
FROM "localidades" l
WHERE e."localidadId" IS NULL
  AND TRIM(COALESCE(e."localidad", '')) <> ''
  AND l."nombre" = TRIM(e."localidad");

UPDATE "empresas" e
SET "cicloFormativoId" = c."id"
FROM "ciclos_formativos" c
WHERE e."cicloFormativoId" IS NULL
  AND TRIM(COALESCE(e."cicloFormativo", '')) <> ''
  AND c."nombre" = TRIM(e."cicloFormativo");

UPDATE "alumnos" a
SET "cicloFormativoId" = c."id"
FROM "ciclos_formativos" c
WHERE a."cicloFormativoId" IS NULL
  AND TRIM(COALESCE(a."ciclo", '')) <> ''
  AND c."nombre" = TRIM(a."ciclo");

-- AddForeignKey
ALTER TABLE "empresas"
ADD CONSTRAINT "empresas_localidadId_fkey"
FOREIGN KEY ("localidadId") REFERENCES "localidades"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empresas"
ADD CONSTRAINT "empresas_sectorId_fkey"
FOREIGN KEY ("sectorId") REFERENCES "sectores"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empresas"
ADD CONSTRAINT "empresas_cicloFormativoId_fkey"
FOREIGN KEY ("cicloFormativoId") REFERENCES "ciclos_formativos"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alumnos"
ADD CONSTRAINT "alumnos_cicloFormativoId_fkey"
FOREIGN KEY ("cicloFormativoId") REFERENCES "ciclos_formativos"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
