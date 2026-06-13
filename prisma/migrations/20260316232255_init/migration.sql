-- CreateTable
CREATE TABLE "empresas" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "cif" TEXT NOT NULL,
    "direccion" TEXT,
    "localidad" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "cicloFormativo" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "contacto" TEXT,
    "emailContacto" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alumnos" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "nia" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "ciclo" TEXT NOT NULL,
    "curso" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alumnos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formaciones_empresa" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "alumnoId" INTEGER,
    "periodo" TEXT,
    "descripcion" TEXT,
    "contacto" TEXT,
    "curso" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "formaciones_empresa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "empresas_cif_key" ON "empresas"("cif");

-- CreateIndex
CREATE UNIQUE INDEX "alumnos_nia_key" ON "alumnos"("nia");

-- AddForeignKey
ALTER TABLE "formaciones_empresa" ADD CONSTRAINT "formaciones_empresa_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formaciones_empresa" ADD CONSTRAINT "formaciones_empresa_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "alumnos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
