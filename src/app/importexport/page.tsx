import { unstable_noStore as noStore } from "next/cache";
import ImportExportPanel from "@/modules/importexport/components/ImportExportPanel";
import { getConfiguracionAcademica } from "@/modules/settings/actions/queries";

/**
 * Pagina contenedora del modulo de importacion/exportacion.
 * Delega toda la logica y la UI en el panel del modulo.
 */
export default async function ImportExportPage() {
  noStore();

  const configuracionAcademica = await getConfiguracionAcademica();

  return (
    <ImportExportPanel
      resultadosPorPagina={configuracionAcademica.resultadosPorPagina}
    />
  );
}
