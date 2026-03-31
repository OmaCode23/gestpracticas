//src/app/formacion/page.tsx

import { unstable_noStore as noStore } from "next/cache";
import { PageHeader } from "@/components/ui";
import { getCiclosFormativosActivos } from "@/modules/catalogos/actions/queries";
import { getCursosAcademicosConfigurados } from "@/modules/settings/actions/queries";
import FormacionContainer from "@/modules/formacion/components/FormacionContainer";

export const dynamic = "force-dynamic";

export default async function Page() {
  noStore();

  const [ciclosFormativos, cursos] = await Promise.all([
    getCiclosFormativosActivos(),
    getCursosAcademicosConfigurados(),
  ]);

  return (
    <div>
      <PageHeader
        breadcrumb="Inicio"
        breadcrumbHighlight="/ FormaciÃ³n en Empresa"
        title="GestiÃ³n de FormaciÃ³n en Empresa"
        subtitle="AsignaciÃ³n de alumnos a empresas y seguimiento de la formaciÃ³n."
      />

      <FormacionContainer ciclosFormativos={ciclosFormativos} cursos={cursos} />
    </div>
  );
}
