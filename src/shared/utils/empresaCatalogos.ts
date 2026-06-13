type CatalogRef = {
  id?: number | null;
  nombre: string;
  codigo?: string | null;
} | null;

type EmpresaCatalogosLike = {
  sectorId: number | null;
  sectorRef?: CatalogRef;
  localidadId: number | null;
  localidadRef?: CatalogRef;
  cicloFormativoId?: number | null;
  cicloFormativoRef?: CatalogRef;
};

export function normalizeEmpresaCatalogos<T extends EmpresaCatalogosLike>(empresa: T) {
  return {
    ...empresa,
    sector: empresa.sectorRef?.nombre ?? "",
    sectorId: empresa.sectorRef?.id ?? empresa.sectorId ?? null,
    localidad: empresa.localidadRef?.nombre ?? "",
    localidadId: empresa.localidadRef?.id ?? empresa.localidadId ?? null,
    cicloFormativo: empresa.cicloFormativoRef?.nombre ?? null,
    cicloFormativoCodigo: empresa.cicloFormativoRef?.codigo ?? null,
    cicloFormativoId:
      empresa.cicloFormativoRef?.id ?? empresa.cicloFormativoId ?? null,
  };
}
