import { unstable_noStore as noStore } from "next/cache";
import { PageHeader } from "@/components/ui";
import EmpresasContainer from "@/modules/empresas/components/EmpresasContainer";
import { getConfiguracionAcademica } from "@/modules/settings/actions/queries";

/**
 * Pagina contenedora del modulo de empresas.
 * Delega la carga, filtros, formulario y tabla al contenedor del modulo.
 */
export default async function EmpresasPage() {
  noStore();

  const configuracionAcademica = await getConfiguracionAcademica();

  return (
    <div>
      <PageHeader
        breadcrumb="Inicio"
        breadcrumbHighlight="/ Empresas"
        title="Gestión de Empresas"
        subtitle="Alta de nuevas empresas y consulta del directorio de colaboradoras."
      />

      <EmpresasContainer
        resultadosPorPagina={configuracionAcademica.resultadosPorPagina}
      />
    </div>
  );
}
