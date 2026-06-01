import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { Alert, Badge, Card, CardHeader, CardTitle, SectionLabel } from "@/components/ui";
import {
  getPortalAlumnoActualOrNull,
  getPortalEmpresasDisponibles,
  getPortalFormacionesAlumno,
} from "@/modules/portal-alumno/actions/queries";
import { OFERTA_PRACTICA_FIELDS } from "@/modules/portal-alumno/data";

export const dynamic = "force-dynamic";

export default async function PortalAlumnoOfertasPage() {
  noStore();

  const alumno = await getPortalAlumnoActualOrNull();
  if (!alumno) return null;
  const [formaciones, empresas] = await Promise.all([
    getPortalFormacionesAlumno(alumno),
    getPortalEmpresasDisponibles(12, alumno),
  ]);

  return (
    <div className="space-y-6">
      <Alert>
        Datos actuales de {alumno.nombre}: practicas asignadas y empresas compatibles.
      </Alert>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle icon="OP" iconVariant="blue">
            Practicas asignadas
          </CardTitle>
        </CardHeader>
        <div className="p-6">
          {formaciones.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {formaciones.map((formacion) => (
                <div key={formacion.id} className="rounded-[18px] border border-border bg-surface px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-navy">{formacion.empresa.nombre}</h2>
                      <p className="mt-1 text-sm text-text-mid">{formacion.empresa.localidad}</p>
                    </div>
                    <Badge variant="green">{formacion.periodo ?? formacion.curso}</Badge>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-text-mid">
                    <p>
                      <span className="font-semibold text-navy">Tutor laboral:</span>{" "}
                      {formacion.tutorLaboral ?? "Pendiente"}
                    </p>
                    <p>
                      <span className="font-semibold text-navy">Contacto:</span>{" "}
                      {formacion.emailTutorLaboral ?? "Pendiente"}
                    </p>
                    {formacion.descripcion && <p>{formacion.descripcion}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[18px] border border-dashed border-border bg-surface px-5 py-8 text-center">
              <Badge variant="gray">Sin asignacion</Badge>
              <h2 className="mt-4 text-lg font-bold text-navy">Todavia no hay practica asignada</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-text-mid">
                Cuando se cree una formacion para este alumno, aparecera en este bloque.
              </p>
            </div>
          )}
        </div>
      </Card>

      <div>
        <SectionLabel>Empresas compatibles</SectionLabel>
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
              <p className="mt-4 text-sm text-text-mid">{empresa.sector}</p>
            </Card>
          ))}
          {empresas.length === 0 && (
            <Card className="p-5">
              <p className="text-sm text-text-mid">No hay empresas compatibles registradas todavia.</p>
            </Card>
          )}
        </div>
      </div>

      <div>
        <SectionLabel>Datos de oferta</SectionLabel>
        <Card className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            {OFERTA_PRACTICA_FIELDS.map((field) => (
              <Badge key={field} variant="blue">
                {field}
              </Badge>
            ))}
          </div>
          <Link
            href="/portal-alumno/empresas"
            className="mt-4 inline-flex rounded-lg border border-border bg-surface2 px-4 py-2 text-sm font-semibold text-text-mid no-underline transition-colors hover:bg-[#e5d7d0]"
          >
            Ver empresas
          </Link>
        </Card>
      </div>
    </div>
  );
}
