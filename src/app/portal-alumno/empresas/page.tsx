import { unstable_noStore as noStore } from "next/cache";
import { SectionLabel } from "@/components/ui";
import {
  getPortalEmpresasGenerales,
} from "@/modules/portal-alumno/actions/queries";
import PortalAlumnoEmpresasList from "@/modules/portal-alumno/components/PortalAlumnoEmpresasList";

export const dynamic = "force-dynamic";

export default async function PortalAlumnoEmpresasPage() {
  noStore();

  const empresas = await getPortalEmpresasGenerales();

  return (
    <div className="space-y-5">
      <SectionLabel>Empresas disponibles</SectionLabel>
      <PortalAlumnoEmpresasList empresas={empresas} />
    </div>
  );
}
