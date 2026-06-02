import { PrismaClient, type Prisma } from "@prisma/client";
import {
  CICLOS_FORMATIVOS_BASE,
  DEFAULT_MES_CAMBIO_CURSO,
  DEFAULT_NUMERO_CURSOS_VISIBLES,
  DEFAULT_RESULTADOS_POR_PAGINA,
} from "../src/shared/catalogs/academico.ts";
import { SECTORES } from "../src/shared/catalogs/empresa.ts";
import { LOCALIDADES } from "../src/shared/catalogs/ubicacion.ts";

const prisma = new PrismaClient();

const SETTING_DEFAULTS = [
  { clave: "academico.mesCambioCurso", valor: String(DEFAULT_MES_CAMBIO_CURSO) },
  {
    clave: "academico.numeroCursosVisibles",
    valor: String(DEFAULT_NUMERO_CURSOS_VISIBLES),
  },
  {
    clave: "listados.resultadosPorPagina",
    valor: String(DEFAULT_RESULTADOS_POR_PAGINA),
  },
];

const CURSOS_EXTERNOS_BASE: Prisma.CursoExternoCreateManyInput[] = [
  {
    proveedor: "Cisco",
    titulo: "Redes y conectividad",
    area: "Redes",
    nivel: "Inicial",
    modalidad: "Online",
    duracion: "Autoguiado",
    descripcion: "Curso introductorio para reforzar conceptos de redes y conectividad.",
  },
  {
    proveedor: "Amazon Web Services",
    titulo: "Fundamentos de cloud",
    area: "Cloud",
    nivel: "Inicial",
    modalidad: "Online",
    duracion: "Autoguiado",
    descripcion: "Formacion base sobre servicios cloud y conceptos de despliegue.",
  },
  {
    proveedor: "Microsoft",
    titulo: "Servicios cloud y administracion",
    area: "Cloud",
    nivel: "Intermedio",
    modalidad: "Online",
    duracion: "Autoguiado",
    descripcion: "Curso orientado a administracion de servicios cloud y buenas practicas.",
  },
];

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

  for (const setting of SETTING_DEFAULTS) {
    await prisma.setting.upsert({
      where: { clave: setting.clave },
      update: {},
      create: {
        clave: setting.clave,
        valor: setting.valor,
      },
    });
  }

  await prisma.cursoExterno.createMany({
    data: CURSOS_EXTERNOS_BASE,
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
