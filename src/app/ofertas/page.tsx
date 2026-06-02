import { unstable_noStore as noStore } from "next/cache";
import { PageHeader } from "@/components/ui";
import { requireStaffSession } from "@/modules/auth/session";
import OfertasContainer from "@/modules/ofertas/components/OfertasContainer";
import { getConfiguracionAcademica } from "@/modules/settings/actions/queries";

export const dynamic = "force-dynamic";

export default async function OfertasPage() {
  noStore();
  await requireStaffSession("/ofertas");

  const configuracionAcademica = await getConfiguracionAcademica();

  return (
    <div>
      <PageHeader
        breadcrumb="Inicio"
        breadcrumbHighlight="/ Ofertas"
        title="Gestión de Ofertas"
        subtitle="Publicación y mantenimiento de ofertas de prácticas visibles para el alumnado."
      />

      <OfertasContainer resultadosPorPagina={configuracionAcademica.resultadosPorPagina} />
    </div>
  );
}
