/*
  Warnings:

  - Made the column `telefono` on table `alumnos` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email` on table `alumnos` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "alumnos" ALTER COLUMN "telefono" SET NOT NULL,
ALTER COLUMN "email" SET NOT NULL;
