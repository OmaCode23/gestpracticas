import { Badge, Card, SectionLabel } from "@/components/ui";
import { CURSOS_EXTERNOS_PREVIEW } from "@/modules/portal-alumno/data";

export default function PortalAlumnoCursosPage() {
  return (
    <div>
      <SectionLabel>Cursos disponibles</SectionLabel>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {CURSOS_EXTERNOS_PREVIEW.map((curso) => (
          <Card key={curso.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <Badge variant="amber">{curso.proveedor}</Badge>
              <Badge variant="gray">{curso.nivel}</Badge>
            </div>
            <h2 className="mt-4 text-base font-bold text-navy">{curso.titulo}</h2>
            <div className="mt-4 grid gap-2 text-sm text-text-mid">
              <p>
                <span className="font-semibold text-navy">Area:</span> {curso.area}
              </p>
              <p>
                <span className="font-semibold text-navy">Modalidad:</span> {curso.modalidad}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
