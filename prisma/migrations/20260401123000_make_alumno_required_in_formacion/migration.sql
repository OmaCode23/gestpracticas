DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "formaciones_empresa"
    WHERE "alumnoId" IS NULL
  ) THEN
    RAISE EXCEPTION
      'No se puede convertir formaciones_empresa.alumnoId en obligatorio mientras existan filas con alumnoId NULL';
  END IF;
END $$;

ALTER TABLE "formaciones_empresa"
DROP CONSTRAINT "formaciones_empresa_alumnoId_fkey";

ALTER TABLE "formaciones_empresa"
ALTER COLUMN "alumnoId" SET NOT NULL;

ALTER TABLE "formaciones_empresa"
ADD CONSTRAINT "formaciones_empresa_alumnoId_fkey"
FOREIGN KEY ("alumnoId") REFERENCES "alumnos"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
