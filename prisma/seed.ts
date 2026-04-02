import { PrismaClient } from "@prisma/client";
import { CICLOS_FORMATIVOS_BASE } from "../src/shared/catalogs/academico";
import { SECTORES } from "../src/shared/catalogs/empresa";
import { LOCALIDADES } from "../src/shared/catalogs/ubicacion";

const prisma = new PrismaClient();

async function main() {
  await prisma.sector.createMany({
    data: SECTORES.map((nombre) => ({ nombre })),
    skipDuplicates: true,
  });

  await prisma.localidad.createMany({
    data: LOCALIDADES.map((nombre) => ({ nombre })),
    skipDuplicates: true,
  });

  await prisma.cicloFormativo.createMany({
    data: CICLOS_FORMATIVOS_BASE,
    skipDuplicates: true,
  });

  console.log("Catalogos base sembrados correctamente.");
}

main()
  .catch((error) => {
    console.error("Error al sembrar catalogos base:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
