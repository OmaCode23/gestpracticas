ALTER TABLE "alumnos"
ADD COLUMN "cv_oid" INTEGER,
ADD COLUMN "cv_nombre" TEXT,
ADD COLUMN "cv_mime_type" TEXT,
ADD COLUMN "cv_tamano" INTEGER,
ADD COLUMN "cv_updated_at" TIMESTAMP(3);
