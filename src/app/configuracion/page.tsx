import { unstable_noStore as noStore } from "next/cache";
import { PageHeader } from "@/components/ui";
import { getCiclosFormativos } from "@/modules/catalogos/actions/queries";
import { getConfiguracionAcademica } from "@/modules/settings/actions/queries";
import ConfiguracionPanel from "@/modules/configuracion/components/ConfiguracionPanel";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  noStore();

  const [ciclosFormativos, configuracionAcademica] = await Promise.all([
    getCiclosFormativos(),
    getConfiguracionAcademica(),
  ]);

  return (
    <div>
      <PageHeader
        breadcrumb="Inicio"
        breadcrumbHighlight="/ Configuracion"
        title="Configuracion"
        subtitle="Consulta los catalogos maestros del sistema y prepara su futura administracion."
      />

      <ConfiguracionPanel
        ciclosFormativos={ciclosFormativos}
        configuracionAcademica={configuracionAcademica}
      />
    </div>
  );
}
