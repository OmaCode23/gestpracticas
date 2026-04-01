ALTER TABLE "formaciones_empresa"
DROP CONSTRAINT IF EXISTS "formaciones_empresa_empresaId_fkey";

ALTER TABLE "formaciones_empresa"
ADD CONSTRAINT "formaciones_empresa_empresaId_fkey"
FOREIGN KEY ("empresaId") REFERENCES "empresas"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
