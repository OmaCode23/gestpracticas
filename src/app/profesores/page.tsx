import { unstable_noStore as noStore } from "next/cache";
import { PageHeader } from "@/components/ui";
import { requireStaffSession } from "@/modules/auth/session";
import ProfesoresContainer from "@/modules/profesores/components/ProfesoresContainer";
import { getConfiguracionAcademica } from "@/modules/settings/actions/queries";

export default async function ProfesoresPage() {
  noStore();
  await requireStaffSession("/profesores");

  const configuracionAcademica = await getConfiguracionAcademica();

  return (
    <div>
      <PageHeader
        breadcrumb="Inicio"
        breadcrumbHighlight="/ Profesores"
        title="Gestión de Profesores"
        subtitle="Alta de nuevos profesores y consulta del directorio del centro."
      />

      <ProfesoresContainer
        resultadosPorPagina={configuracionAcademica.resultadosPorPagina}
      />
    </div>
  );
}
