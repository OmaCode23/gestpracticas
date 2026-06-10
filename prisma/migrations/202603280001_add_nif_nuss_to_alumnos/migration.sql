ALTER TABLE "alumnos"
ADD COLUMN "nif" TEXT,
ADD COLUMN "nuss" TEXT;

CREATE UNIQUE INDEX "alumnos_nif_key" ON "alumnos"("nif");

CREATE UNIQUE INDEX "alumnos_nuss_key" ON "alumnos"("nuss");
