ALTER TABLE "formaciones_empresa"
DROP CONSTRAINT "formaciones_empresa_empresaId_fkey";

ALTER TABLE "formaciones_empresa"
ADD CONSTRAINT "formaciones_empresa_empresaId_fkey"
FOREIGN KEY ("empresaId") REFERENCES "empresas"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "formaciones_empresa"
DROP CONSTRAINT "formaciones_empresa_alumnoId_fkey";

ALTER TABLE "formaciones_empresa"
ADD CONSTRAINT "formaciones_empresa_alumnoId_fkey"
FOREIGN KEY ("alumnoId") REFERENCES "alumnos"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
