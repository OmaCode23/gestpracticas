import { unstable_cache } from "next/cache";
import { prisma } from "@/database/prisma";
import { CACHE_TAGS } from "@/shared/cache";
import { CURSO_MODALIDADES, CURSO_NIVELES } from "@/shared/catalogs/cursos";

async function getEmpresaCatalogosUncached() {
  const [sectores, localidades, ciclosFormativos] = await Promise.all([
    prisma.sector.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true },
    }),
    prisma.localidad.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true },
    }),
    prisma.cicloFormativo.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, codigo: true },
    }),
  ]);

  return {
    sectores: sectores.map((item) => ({
      id: item.id,
      nombre: item.nombre,
    })),
    localidades: localidades.map((item) => ({
      id: item.id,
      nombre: item.nombre,
    })),
    ciclosFormativos: ciclosFormativos.map((item) => ({
      id: item.id,
      nombre: item.nombre,
      codigo: item.codigo,
    })),
  };
}

const getEmpresaCatalogosCached = unstable_cache(getEmpresaCatalogosUncached, ["empresa-catalogos"], {
  tags: [CACHE_TAGS.catalogos],
});

async function getSectoresUncached() {
  return prisma.sector.findMany({
    orderBy: { nombre: "asc" },
    select: {
      id: true,
      nombre: true,
      activo: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          empresas: true,
        },
      },
    },
  });
}

const getSectoresCached = unstable_cache(getSectoresUncached, ["sectores"], {
  tags: [CACHE_TAGS.catalogos],
});

async function getCiclosFormativosUncached() {
  return prisma.cicloFormativo.findMany({
    orderBy: { nombre: "asc" },
    select: {
      id: true,
      nombre: true,
      codigo: true,
      activo: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          alumnos: true,
          empresas: true,
        },
      },
    },
  });
}

const getCiclosFormativosCached = unstable_cache(getCiclosFormativosUncached, ["ciclos-formativos"], {
  tags: [CACHE_TAGS.catalogos],
});

async function getCiclosFormativosActivosUncached() {
  const ciclos = await prisma.cicloFormativo.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
    select: { nombre: true },
  });

  return ciclos.map((item) => item.nombre);
}

const getCiclosFormativosActivosCached = unstable_cache(
  getCiclosFormativosActivosUncached,
  ["ciclos-formativos-activos"],
  {
    tags: [CACHE_TAGS.catalogos],
  }
);

async function getCiclosFormativosActivosOptionsUncached() {
  return prisma.cicloFormativo.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
    select: {
      id: true,
      nombre: true,
      codigo: true,
    },
  });
}

const getCiclosFormativosActivosOptionsCached = unstable_cache(
  getCiclosFormativosActivosOptionsUncached,
  ["ciclos-formativos-activos-options"],
  {
    tags: [CACHE_TAGS.catalogos],
  }
);

async function getCursoProveedoresUncached() {
  return prisma.cursoProveedor.findMany({
    orderBy: { nombre: "asc" },
    select: {
      id: true,
      nombre: true,
      activo: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          cursos: true,
        },
      },
    },
  });
}

const getCursoProveedoresCached = unstable_cache(
  getCursoProveedoresUncached,
  ["curso-proveedores"],
  {
    tags: [CACHE_TAGS.catalogos],
  }
);

async function getCursoAreasUncached() {
  return prisma.cursoArea.findMany({
    orderBy: { nombre: "asc" },
    select: {
      id: true,
      nombre: true,
      activo: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          cursos: true,
        },
      },
    },
  });
}

const getCursoAreasCached = unstable_cache(getCursoAreasUncached, ["curso-areas"], {
  tags: [CACHE_TAGS.catalogos],
});

async function getCursoCatalogosUncached() {
  const [proveedores, areas] = await Promise.all([
    prisma.cursoProveedor.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true },
    }),
    prisma.cursoArea.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true },
    }),
  ]);

  return {
    proveedores,
    areas,
    niveles: [...CURSO_NIVELES],
    modalidades: [...CURSO_MODALIDADES],
  };
}

const getCursoCatalogosCached = unstable_cache(getCursoCatalogosUncached, ["curso-catalogos"], {
  tags: [CACHE_TAGS.catalogos],
});

export async function getEmpresaCatalogos() {
  return getEmpresaCatalogosCached();
}

export async function getSectores() {
  return getSectoresCached();
}

export async function getCiclosFormativos() {
  return getCiclosFormativosCached();
}

export async function getCiclosFormativosActivos() {
  return getCiclosFormativosActivosCached();
}

export async function getCiclosFormativosActivosOptions() {
  return getCiclosFormativosActivosOptionsCached();
}

export async function getCursoProveedores() {
  return getCursoProveedoresCached();
}

export async function getCursoAreas() {
  return getCursoAreasCached();
}

export async function getCursoCatalogos() {
  return getCursoCatalogosCached();
}
