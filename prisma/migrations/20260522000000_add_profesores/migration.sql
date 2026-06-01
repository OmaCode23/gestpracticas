-- CreateTable
CREATE TABLE "profesores" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "nif" TEXT,
    "especialidad" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "cicloFormativoId" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profesores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profesores_nif_key" ON "profesores"("nif");

-- AddForeignKey
ALTER TABLE "profesores" ADD CONSTRAINT "profesores_cicloFormativoId_fkey" FOREIGN KEY ("cicloFormativoId") REFERENCES "ciclos_formativos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
