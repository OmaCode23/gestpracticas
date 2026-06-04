CREATE TABLE "ofertas_practicas_intereses" (
    "id" SERIAL NOT NULL,
    "alumno_id" INTEGER NOT NULL,
    "oferta_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ofertas_practicas_intereses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cursos_externos_inscripciones" (
    "id" SERIAL NOT NULL,
    "alumno_id" INTEGER NOT NULL,
    "curso_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cursos_externos_inscripciones_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ofertas_practicas_intereses_alumno_id_oferta_id_key"
ON "ofertas_practicas_intereses"("alumno_id", "oferta_id");

CREATE INDEX "ofertas_practicas_intereses_oferta_id_idx"
ON "ofertas_practicas_intereses"("oferta_id");

CREATE UNIQUE INDEX "cursos_externos_inscripciones_alumno_id_curso_id_key"
ON "cursos_externos_inscripciones"("alumno_id", "curso_id");

CREATE INDEX "cursos_externos_inscripciones_curso_id_idx"
ON "cursos_externos_inscripciones"("curso_id");

ALTER TABLE "ofertas_practicas_intereses"
ADD CONSTRAINT "ofertas_practicas_intereses_alumno_id_fkey"
FOREIGN KEY ("alumno_id") REFERENCES "alumnos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ofertas_practicas_intereses"
ADD CONSTRAINT "ofertas_practicas_intereses_oferta_id_fkey"
FOREIGN KEY ("oferta_id") REFERENCES "ofertas_practicas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cursos_externos_inscripciones"
ADD CONSTRAINT "cursos_externos_inscripciones_alumno_id_fkey"
FOREIGN KEY ("alumno_id") REFERENCES "alumnos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cursos_externos_inscripciones"
ADD CONSTRAINT "cursos_externos_inscripciones_curso_id_fkey"
FOREIGN KEY ("curso_id") REFERENCES "cursos_externos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
