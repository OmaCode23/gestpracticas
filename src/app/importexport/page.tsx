import { unstable_noStore as noStore } from "next/cache";
import { canImportExcel } from "@/modules/auth/permissions";
import { requireStaffSession } from "@/modules/auth/session";
import ImportExportPanel from "@/modules/importexport/components/ImportExportPanel";
import { getConfiguracionAcademica } from "@/modules/settings/actions/queries";

/**
 * Pagina contenedora del modulo de importacion/exportacion.
 * Delega toda la logica y la UI en el panel del modulo.
 */
export default async function ImportExportPage() {
  noStore();
  const session = await requireStaffSession("/importexport");

  const configuracionAcademica = await getConfiguracionAcademica();

  return (
    <ImportExportPanel
      resultadosPorPagina={configuracionAcademica.resultadosPorPagina}
      canImport={canImportExcel(session.user.rol)}
    />
  );
}
