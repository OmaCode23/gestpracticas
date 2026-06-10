UPDATE "empresas" AS e
SET "sectorId" = s."id"
FROM "sectores" AS s
WHERE e."sectorId" IS NULL
  AND e."sector" IS NOT NULL
  AND BTRIM(e."sector") <> ''
  AND e."sector" = s."nombre";

UPDATE "empresas" AS e
SET "localidadId" = l."id"
FROM "localidades" AS l
WHERE e."localidadId" IS NULL
  AND e."localidad" IS NOT NULL
  AND BTRIM(e."localidad") <> ''
  AND e."localidad" = l."nombre";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "empresas"
    WHERE "sectorId" IS NULL
       OR "localidadId" IS NULL
  ) THEN
    RAISE EXCEPTION
      'No se puede cerrar la transicion de catalogos de empresas: quedan registros sin sectorId o localidadId enlazados.';
  END IF;
END $$;

ALTER TABLE "empresas"
  DROP COLUMN "sector",
  DROP COLUMN "localidad";

ALTER TABLE "empresas"
  ALTER COLUMN "sectorId" SET NOT NULL,
  ALTER COLUMN "localidadId" SET NOT NULL;

ALTER TABLE "empresas" DROP CONSTRAINT "empresas_sectorId_fkey";
ALTER TABLE "empresas" DROP CONSTRAINT "empresas_localidadId_fkey";

ALTER TABLE "empresas"
  ADD CONSTRAINT "empresas_sectorId_fkey"
    FOREIGN KEY ("sectorId") REFERENCES "sectores"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "empresas_localidadId_fkey"
    FOREIGN KEY ("localidadId") REFERENCES "localidades"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
