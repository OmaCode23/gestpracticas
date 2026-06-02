import { Badge, Card, SectionLabel } from "@/components/ui";
import { getCursosExternosPublicados } from "@/modules/cursos/actions/queries";

export default async function PortalCursosContent() {
  const cursos = await getCursosExternosPublicados();

  return (
    <div className="space-y-5">
      <SectionLabel>Cursos disponibles</SectionLabel>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cursos.map((curso) => (
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
              {curso.duracion ? (
                <p>
                  <span className="font-semibold text-navy">Duracion:</span> {curso.duracion}
                </p>
              ) : null}
            </div>
            {curso.descripcion ? (
              <p className="mt-4 text-sm leading-relaxed text-text-mid">{curso.descripcion}</p>
            ) : null}
          </Card>
        ))}
        {cursos.length === 0 ? (
          <Card className="p-5">
            <p className="text-sm text-text-mid">No hay cursos activos publicados todavia.</p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
