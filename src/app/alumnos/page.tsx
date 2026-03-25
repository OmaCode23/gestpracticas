//src/app/alumnos/page.tsx

import { PageHeader } from "@/components/ui";
import AlumnosContainer from "@/modules/alumnos/components/AlumnosContainer";

export default function Page() {
  return (
    <div>
      <PageHeader
        breadcrumb="Inicio"
        breadcrumbHighlight="/ Alumnos"
        title="Gestión de Alumnos"
        subtitle="Alta de alumnos en prácticas y consulta del censo por ciclo y curso."
      />

      <AlumnosContainer />
    </div>
  );
}
