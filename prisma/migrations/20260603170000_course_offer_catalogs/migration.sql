CREATE TABLE "curso_proveedores" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curso_proveedores_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "curso_areas" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curso_areas_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "curso_proveedores_nombre_key" ON "curso_proveedores"("nombre");
CREATE INDEX "curso_proveedores_activo_idx" ON "curso_proveedores"("activo");

CREATE UNIQUE INDEX "curso_areas_nombre_key" ON "curso_areas"("nombre");
CREATE INDEX "curso_areas_activo_idx" ON "curso_areas"("activo");

ALTER TABLE "cursos_externos"
ADD COLUMN "proveedor_id" INTEGER,
ADD COLUMN "area_id" INTEGER;

ALTER TABLE "ofertas_practicas"
ADD COLUMN "empresa_id" INTEGER;

INSERT INTO "curso_proveedores" ("nombre", "activo", "createdAt", "updatedAt")
SELECT DISTINCT "nombre", true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (
    SELECT btrim("proveedor") AS "nombre"
    FROM "cursos_externos"
    WHERE "proveedor" IS NOT NULL
) AS "proveedores"
WHERE "nombre" <> '';

INSERT INTO "curso_areas" ("nombre", "activo", "createdAt", "updatedAt")
SELECT DISTINCT "nombre", true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (
    SELECT btrim("area") AS "nombre"
    FROM "cursos_externos"
    WHERE "area" IS NOT NULL
) AS "areas"
WHERE "nombre" <> '';

UPDATE "cursos_externos" AS "curso"
SET
    "proveedor_id" = "proveedor"."id",
    "proveedor" = "proveedor"."nombre"
FROM "curso_proveedores" AS "proveedor"
WHERE btrim("curso"."proveedor") = "proveedor"."nombre";

UPDATE "cursos_externos" AS "curso"
SET
    "area_id" = "area"."id",
    "area" = "area"."nombre"
FROM "curso_areas" AS "area"
WHERE btrim("curso"."area") = "area"."nombre";

UPDATE "cursos_externos"
SET "nivel" = CASE
    WHEN lower(btrim("nivel")) IN ('inicial', 'bajo', 'baja', 'principiante') THEN 'Principiante'
    WHEN lower(btrim("nivel")) IN ('medio', 'media', 'intermedio') THEN 'Intermedio'
    WHEN lower(btrim("nivel")) IN ('alto', 'alta', 'avanzado') THEN 'Avanzado'
    ELSE "nivel"
END;

UPDATE "cursos_externos"
SET "modalidad" = CASE
    WHEN lower(btrim("modalidad")) = 'online' THEN 'Online'
    WHEN lower(btrim("modalidad")) = 'semipresencial' THEN 'Semipresencial'
    WHEN lower(btrim("modalidad")) = 'presencial' THEN 'Presencial'
    ELSE "modalidad"
END;

WITH "empresa_matches" AS (
    SELECT lower(btrim("nombre")) AS "nombre_key", MIN("id") AS "empresa_id"
    FROM "empresas"
    GROUP BY lower(btrim("nombre"))
),
"empresa_canonica" AS (
    SELECT "empresa_matches"."nombre_key", "empresa_matches"."empresa_id", "empresas"."nombre"
    FROM "empresa_matches"
    INNER JOIN "empresas" ON "empresas"."id" = "empresa_matches"."empresa_id"
)
UPDATE "ofertas_practicas" AS "oferta"
SET
    "empresa_id" = "empresa_canonica"."empresa_id",
    "empresa" = "empresa_canonica"."nombre"
FROM "empresa_canonica"
WHERE lower(btrim("oferta"."empresa")) = "empresa_canonica"."nombre_key";

CREATE INDEX "cursos_externos_proveedor_id_idx" ON "cursos_externos"("proveedor_id");
CREATE INDEX "cursos_externos_area_id_idx" ON "cursos_externos"("area_id");
CREATE INDEX "ofertas_practicas_empresa_id_idx" ON "ofertas_practicas"("empresa_id");

ALTER TABLE "cursos_externos"
ADD CONSTRAINT "cursos_externos_proveedor_id_fkey"
FOREIGN KEY ("proveedor_id") REFERENCES "curso_proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "cursos_externos"
ADD CONSTRAINT "cursos_externos_area_id_fkey"
FOREIGN KEY ("area_id") REFERENCES "curso_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ofertas_practicas"
ADD CONSTRAINT "ofertas_practicas_empresa_id_fkey"
FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
