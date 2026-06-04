import { Badge, Card, SectionLabel } from "@/components/ui";
import { getOfertasPracticasPublicadas } from "@/modules/ofertas/actions/queries";
import PortalAlumnoActionButton from "./PortalAlumnoActionButton";

export default async function PortalOfertasContent() {
  const ofertas = await getOfertasPracticasPublicadas();

  return (
    <div className="space-y-6">
      <div>
        <SectionLabel>Ofertas publicadas</SectionLabel>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ofertas.map((oferta) => (
            <Card key={oferta.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <Badge variant="blue">
                  {oferta.cicloFormativoCodigo ?? oferta.cicloFormativo ?? "Todos los ciclos"}
                </Badge>
                <Badge variant="green">
                  {oferta.plazas} {oferta.plazas === 1 ? "plaza" : "plazas"}
                </Badge>
              </div>
              <h2 className="mt-4 text-base font-bold text-navy">{oferta.titulo}</h2>
              <p className="mt-1 text-sm font-semibold text-text-mid">{oferta.empresa}</p>
              <div className="mt-4 grid gap-2 text-sm text-text-mid">
                {oferta.periodo ? (
                  <p>
                    <span className="font-semibold text-navy">Periodo:</span> {oferta.periodo}
                  </p>
                ) : null}
                {oferta.requisitos ? (
                  <p>
                    <span className="font-semibold text-navy">Requisitos:</span> {oferta.requisitos}
                  </p>
                ) : null}
              </div>
              {oferta.descripcion ? (
                <p className="mt-4 text-sm leading-relaxed text-text-mid">{oferta.descripcion}</p>
              ) : null}
              <PortalAlumnoActionButton
                endpoint={`/api/portal-alumno/ofertas/${oferta.id}/aplicar`}
                label="¡Aplicar aquí!"
                doneLabel="Solicitud registrada"
              />
            </Card>
          ))}
          {ofertas.length === 0 ? (
            <Card className="p-5">
              <p className="text-sm text-text-mid">No hay ofertas publicadas todavia.</p>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
