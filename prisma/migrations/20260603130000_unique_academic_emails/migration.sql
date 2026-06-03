/*
  Warnings:

  - Esta migracion fallara si existen emails duplicados o nulos en `alumnos` o `profesores`.
  - Antes de aplicarla hay que limpiar cualquier duplicado historico, especialmente en `alumnos`.
*/

UPDATE "alumnos"
SET "email" = lower(btrim("email"));

UPDATE "profesores"
SET "email" = lower(btrim("email"))
WHERE "email" IS NOT NULL;

ALTER TABLE "profesores"
ALTER COLUMN "email" SET NOT NULL;

CREATE UNIQUE INDEX "alumnos_email_key" ON "alumnos"("email");

CREATE UNIQUE INDEX "profesores_email_key" ON "profesores"("email");
