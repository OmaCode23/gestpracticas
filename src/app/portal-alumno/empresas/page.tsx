import { unstable_noStore as noStore } from "next/cache";
import { Alert, Badge, Card, SectionLabel } from "@/components/ui";
import {
  getPortalAlumnoActual,
  getPortalEmpresasDisponibles,
} from "@/modules/portal-alumno/actions/queries";

export const dynamic = "force-dynamic";

export default async function PortalAlumnoEmpresasPage() {
  noStore();

  const alumno = await getPortalAlumnoActual();
  const empresas = await getPortalEmpresasDisponibles(24, alumno);

  return (
    <div className="space-y-5">
      <Alert>
        Empresas filtradas para {alumno.nombre}
        {alumno.cicloFormativoNombre ? ` (${alumno.cicloFormativoNombre})` : ""}.
      </Alert>

      <SectionLabel>Empresas disponibles</SectionLabel>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {empresas.map((empresa) => (
          <Card key={empresa.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-navy">{empresa.nombre}</h2>
                <p className="mt-1 text-sm text-text-mid">{empresa.localidad}</p>
              </div>
              <Badge variant="green">{empresa.cicloFormativoCodigo ?? "Ciclos"}</Badge>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-text-mid">
              <p>
                <span className="font-semibold text-navy">Sector:</span> {empresa.sector}
              </p>
              <p>
                <span className="font-semibold text-navy">Ciclo:</span> {empresa.cicloFormativo}
              </p>
            </div>
          </Card>
        ))}
        {empresas.length === 0 && (
          <Card className="p-5">
            <p className="text-sm text-text-mid">No hay empresas compatibles registradas todavia.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
