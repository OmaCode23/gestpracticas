//src/app/formacion/page.tsx

import { PageHeader } from "@/components/ui";
import FormacionContainer from "@/modules/formacion/components/FormacionContainer";

export default function Page() {
  return (
    <div>
      <PageHeader
        breadcrumb="Inicio"
        breadcrumbHighlight="/ Formación en Empresa"
        title="Gestión de Formación en Empresa"
        subtitle="Asignación de alumnos a empresas y seguimiento de la formación."
      />

      <FormacionContainer />
    </div>
  );
}
