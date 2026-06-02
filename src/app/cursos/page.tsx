import { unstable_noStore as noStore } from "next/cache";
import { PageHeader } from "@/components/ui";
import { requireStaffSession } from "@/modules/auth/session";
import CursosContainer from "@/modules/cursos/components/CursosContainer";
import { getConfiguracionAcademica } from "@/modules/settings/actions/queries";

export const dynamic = "force-dynamic";

export default async function CursosPage() {
  noStore();
  await requireStaffSession("/cursos");

  const configuracionAcademica = await getConfiguracionAcademica();

  return (
    <div>
      <PageHeader
        breadcrumb="Inicio"
        breadcrumbHighlight="/ Cursos"
        title="Gestión de Cursos"
        subtitle="Alta de cursos externos, consulta en tabla y vista de tarjetas para el portal."
      />

      <CursosContainer resultadosPorPagina={configuracionAcademica.resultadosPorPagina} />
    </div>
  );
}
