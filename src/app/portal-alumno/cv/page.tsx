import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { Alert, Badge, Card, CardHeader, CardTitle } from "@/components/ui";
import { formatFileSize } from "@/modules/alumnos/utils/cv";
import { getPortalAlumnoActual } from "@/modules/portal-alumno/actions/queries";

export const dynamic = "force-dynamic";

function formatPortalDate(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export default async function PortalAlumnoCvPage() {
  noStore();

  const alumno = await getPortalAlumnoActual();

  return (
    <div className="space-y-6">
      <Alert>
        Documentacion de {alumno.nombre}.
      </Alert>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle icon="CV" iconVariant="purple">
            CV del alumno
          </CardTitle>
        </CardHeader>
        <div className="p-6">
          <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-[18px] border border-border bg-surface px-5 py-4">
              <Badge variant={alumno.isDemo ? "amber" : "green"}>
                {alumno.isDemo ? "Alumno de prueba" : "Alumno conectado"}
              </Badge>
              <h2 className="mt-4 text-lg font-bold text-navy">{alumno.nombre}</h2>
              <div className="mt-4 grid gap-2 text-sm text-text-mid">
                <p>
                  <span className="font-semibold text-navy">NIA:</span> {alumno.nia}
                </p>
                <p>
                  <span className="font-semibold text-navy">Ciclo:</span>{" "}
                  {alumno.cicloFormativoNombre ?? "Pendiente"}
                </p>
                <p>
                  <span className="font-semibold text-navy">Curso:</span> {alumno.curso}
                </p>
              </div>
            </div>

            <div className="rounded-[18px] border border-border bg-surface px-5 py-4">
              {alumno.cvNombre ? (
                <>
                  <Badge variant="purple">CV adjunto</Badge>
                  <div className="mt-4 grid gap-2 text-sm text-text-mid">
                    <p>
                      <span className="font-semibold text-navy">Archivo:</span> {alumno.cvNombre}
                    </p>
                    <p>
                      <span className="font-semibold text-navy">Tipo:</span> {alumno.cvMimeType}
                    </p>
                    <p>
                      <span className="font-semibold text-navy">Tamano:</span> {formatFileSize(alumno.cvTamano)}
                    </p>
                    <p>
                      <span className="font-semibold text-navy">Actualizado:</span>{" "}
                      {formatPortalDate(alumno.cvUpdatedAt)}
                    </p>
                  </div>
                  {alumno.id && (
                    <Link
                      href={`/api/alumnos/${alumno.id}/cv`}
                      className="mt-5 inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white no-underline transition-colors hover:bg-[#851534]"
                    >
                      Ver o descargar CV
                    </Link>
                  )}
                </>
              ) : (
                <div className="rounded-[18px] border border-dashed border-border bg-white/70 px-5 py-8 text-center">
                  <Badge variant="gray">Sin CV</Badge>
                  <h2 className="mt-4 text-lg font-bold text-navy">No hay CV adjunto todavia</h2>
                  <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-text-mid">
                    Cuando se suba un PDF desde la ficha interna del alumno, aparecera aqui automaticamente.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
