import { Alert, Badge, Card, CardHeader, CardTitle, SectionLabel } from "@/components/ui";
import { OFERTA_PRACTICA_FIELDS } from "@/modules/portal-alumno/data";

export default function PortalAlumnoOfertasPage() {
  return (
    <div className="space-y-6">
      <Alert>
        Las ofertas se conectaran a una tabla propia para no mezclar plazas abiertas con formaciones ya asignadas.
      </Alert>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle icon="OP" iconVariant="blue">
            Ofertas publicadas
          </CardTitle>
        </CardHeader>
        <div className="p-6">
          <div className="rounded-[18px] border border-dashed border-border bg-surface px-5 py-8 text-center">
            <Badge variant="gray">Sin publicaciones</Badge>
            <h2 className="mt-4 text-lg font-bold text-navy">No hay ofertas disponibles todavia</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-text-mid">
              Cuando el equipo publique plazas, el alumno vera aqui las opciones filtradas por ciclo,
              empresa, localidad y estado.
            </p>
          </div>
        </div>
      </Card>

      <div>
        <SectionLabel>Estructura prevista</SectionLabel>
        <Card className="p-5">
          <div className="flex flex-wrap gap-2">
            {OFERTA_PRACTICA_FIELDS.map((field) => (
              <Badge key={field} variant="blue">
                {field}
              </Badge>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
