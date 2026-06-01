import { Badge, Card, SectionLabel } from "@/components/ui";
import { OFERTA_PRACTICA_FIELDS } from "@/modules/portal-alumno/data";

export default function PortalOfertasContent() {
  return (
    <div className="space-y-6">
      <div>
        <SectionLabel>Ofertas</SectionLabel>
        <Card className="p-5">
          <div className="flex flex-wrap items-center gap-2">
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
