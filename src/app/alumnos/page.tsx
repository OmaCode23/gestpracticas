//src/app/alumnos/page.tsx

import { unstable_noStore as noStore } from "next/cache";
import { PageHeader } from "@/components/ui";
import { requireStaffSession } from "@/modules/auth/session";
import { getCiclosFormativosActivosOptions } from "@/modules/catalogos/actions/queries";
import {
  getConfiguracionAcademica,
  getCursosAcademicosConfigurados,
} from "@/modules/settings/actions/queries";
import AlumnosContainer from "@/modules/alumnos/components/AlumnosContainer";

export const dynamic = "force-dynamic";

export default async function Page() {
  noStore();
  await requireStaffSession("/alumnos");

  const [ciclosFormativos, cursos, configuracionAcademica] = await Promise.all([
    getCiclosFormativosActivosOptions(),
    getCursosAcademicosConfigurados(),
    getConfiguracionAcademica(),
  ]);

  return (
    <div>
      <PageHeader
        breadcrumb="Inicio"
        breadcrumbHighlight="/ Alumnos"
        title="Gestión de Alumnos"
        subtitle="Alta de alumnos en prácticas y consulta del censo por ciclo y curso."
      />

      <AlumnosContainer
        ciclosFormativos={ciclosFormativos}
        cursos={cursos}
        modoHistorico={configuracionAcademica.modoHistorico}
        resultadosPorPagina={configuracionAcademica.resultadosPorPagina}
      />
    </div>
  );
}
