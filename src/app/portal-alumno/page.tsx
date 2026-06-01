import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { Badge, Card, CardHeader, CardTitle, SectionLabel } from "@/components/ui";
import { formatFileSize } from "@/modules/alumnos/utils/cv";
import { getPortalAlumnoDashboard } from "@/modules/portal-alumno/actions/queries";
import { CURSOS_EXTERNOS_PREVIEW } from "@/modules/portal-alumno/data";

export const dynamic = "force-dynamic";

function formatPortalDate(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export default async function PortalAlumnoPage() {
  noStore();

  const { alumno, summary, empresas, formaciones } = await getPortalAlumnoDashboard();

  const stats = [
    { label: "Practicas asignadas", value: summary.formacionesAsignadas, variant: "blue" as const },
    { label: "Empresas compatibles", value: summary.empresasCompatibles, variant: "green" as const },
    { label: "Cursos disponibles", value: summary.cursosDisponibles, variant: "amber" as const },
  ];

  return (
    <div className="space-y-7">
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="green">Alumno conectado</Badge>
              {alumno.cicloFormativoCodigo ? <Badge variant="blue">{alumno.cicloFormativoCodigo}</Badge> : null}
            </div>
            <h2 className="mt-4 text-xl font-bold text-navy">{alumno.nombre}</h2>
            <p className="mt-1 text-sm text-text-mid">
              {alumno.cicloFormativoNombre ?? "Ciclo pendiente"} / {alumno.curso} / curso {alumno.cursoCiclo}
            </p>
          </div>
          <div className="grid gap-1 text-sm text-text-mid md:text-right">
            <p>
              <span className="font-semibold text-navy">NIA:</span> {alumno.nia}
            </p>
            <p>
              <span className="font-semibold text-navy">Email:</span> {alumno.email}
            </p>
            <p>
              <span className="font-semibold text-navy">Telefono:</span> {alumno.telefono}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((item) => (
          <Card key={item.label} className="p-5">
            <Badge variant={item.variant}>{item.label}</Badge>
            <p className="mt-4 text-2xl font-bold text-navy">{item.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle icon="OP" iconVariant="blue">
              Practicas y opciones
            </CardTitle>
          </CardHeader>
          <div className="p-6">
            {formaciones.length > 0 ? (
              <div className="space-y-4">
                {formaciones.slice(0, 2).map((formacion) => (
                  <div key={formacion.id} className="rounded-[16px] border border-border bg-surface px-4 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-navy">{formacion.empresa.nombre}</p>
                        <p className="mt-1 text-xs text-text-mid">{formacion.empresa.localidad}</p>
                      </div>
                      <Badge variant="green">{formacion.periodo ?? formacion.curso}</Badge>
                    </div>
                    {formacion.descripcion ? (
                      <p className="mt-3 text-sm leading-relaxed text-text-mid">{formacion.descripcion}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-text-mid">
                Todavia no hay una practica asignada a este alumno. Se muestran empresas compatibles con su ciclo.
              </p>
            )}
            <Link
              href="/portal-alumno/ofertas"
              className="mt-4 inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white no-underline transition-colors hover:bg-[#851534]"
            >
              Ver ofertas
            </Link>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle icon="CV" iconVariant="purple">
              CV del alumno
            </CardTitle>
          </CardHeader>
          <div className="p-6">
            {alumno.cvNombre ? (
              <div className="space-y-2 text-sm text-text-mid">
                <p>
                  <span className="font-semibold text-navy">Archivo:</span> {alumno.cvNombre}
                </p>
                <p>
                  <span className="font-semibold text-navy">Tamano:</span> {formatFileSize(alumno.cvTamano)}
                </p>
                <p>
                  <span className="font-semibold text-navy">Actualizado:</span> {formatPortalDate(alumno.cvUpdatedAt)}
                </p>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-text-mid">
                Este alumno todavia no tiene CV adjunto en su ficha interna.
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/portal-alumno/cv"
                className="inline-flex rounded-lg border border-border bg-surface2 px-4 py-2 text-sm font-semibold text-text-mid no-underline transition-colors hover:bg-[#e5d7d0]"
              >
                Ir al CV
              </Link>
              {alumno.cvNombre ? (
                <Link
                  href={`/api/alumnos/${alumno.id}/cv`}
                  className="inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white no-underline transition-colors hover:bg-[#851534]"
                >
                  Descargar
                </Link>
              ) : null}
            </div>
          </div>
        </Card>
      </div>

      <div>
        <SectionLabel>Empresas compatibles</SectionLabel>
        <div className="grid gap-4 md:grid-cols-2">
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
          {empresas.length === 0 ? (
            <Card className="p-5">
              <p className="text-sm text-text-mid">No hay empresas compatibles registradas todavia.</p>
            </Card>
          ) : null}
        </div>
      </div>

      <div>
        <SectionLabel>Cursos externos</SectionLabel>
        <div className="grid gap-4 md:grid-cols-3">
          {CURSOS_EXTERNOS_PREVIEW.map((curso) => (
            <Card key={curso.id} className="p-5">
              <Badge variant="amber">{curso.proveedor}</Badge>
              <h2 className="mt-4 text-base font-bold text-navy">{curso.titulo}</h2>
              <p className="mt-2 text-sm text-text-mid">
                {curso.area} / {curso.nivel} / {curso.modalidad}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
