ALTER TABLE "formaciones_empresa"
RENAME COLUMN "contacto" TO "tutorLaboral";

ALTER TABLE "formaciones_empresa"
ADD COLUMN "emailTutorLaboral" TEXT;
