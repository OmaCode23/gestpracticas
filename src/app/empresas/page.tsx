import EmpresasContainer from "@/modules/empresas/components/EmpresasContainer";
import { PageHeader } from "@/components/ui";

export default function Page() {
  return (
    <div>
      <PageHeader
        breadcrumb="Inicio"
        breadcrumbHighlight="/ Empresas"
        title="Gestión de Empresas"
        subtitle="Alta de nuevas empresas y consulta del directorio de colaboradoras."
      />

      <EmpresasContainer />
    </div>
  );
}
