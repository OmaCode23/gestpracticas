import { unstable_noStore as noStore } from "next/cache";
import { Alert, Badge, Card, CardHeader, CardTitle, SectionLabel } from "@/components/ui";
import {
  getPortalAlumnoActualOrNull,
  getPortalEmpresasDisponibles,
  getPortalFormacionesAlumno,
} from "@/modules/portal-alumno/actions/queries";
import PortalAlumnoCvManager from "@/modules/portal-alumno/components/PortalAlumnoCvManager";

export const dynamic = "force-dynamic";

export default async function PortalAlumnoCvPage() {
  noStore();

  const alumno = await getPortalAlumnoActualOrNull();
  if (!alumno) return null;
  const [formaciones, empresas] = await Promise.all([
    getPortalFormacionesAlumno(alumno),
    getPortalEmpresasDisponibles(12, alumno),
  ]);

  return (
    <div className="space-y-6">
      <Alert>Formación y documentación de {alumno.nombre}.</Alert>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle icon="AL" iconVariant="blue">
            Detalle del alumno
          </CardTitle>
        </CardHeader>
        <div className="p-6">
          <div className="rounded-[18px] border border-border bg-surface px-5 py-4">
            <h2 className="text-lg font-bold text-navy">{alumno.nombre}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <p className="text-sm text-text-mid">
                <span className="font-semibold text-navy">NIA:</span> {alumno.nia}
              </p>
              <p className="text-sm text-text-mid">
                <span className="font-semibold text-navy">NIF:</span> {alumno.nif ?? "-"}
              </p>
              <p className="text-sm text-text-mid">
                <span className="font-semibold text-navy">NUSS:</span> {alumno.nuss ?? "-"}
              </p>
              <p className="text-sm text-text-mid">
                <span className="font-semibold text-navy">Ciclo:</span>{" "}
                {alumno.cicloFormativoCodigo ?? alumno.cicloFormativoNombre ?? "Pendiente"}
              </p>
              <p className="text-sm text-text-mid">
                <span className="font-semibold text-navy">Curso ciclo:</span> {alumno.cursoCiclo}.º
              </p>
              <p className="text-sm text-text-mid">
                <span className="font-semibold text-navy">Curso académico:</span> {alumno.curso}
              </p>
              <p className="text-sm text-text-mid">
                <span className="font-semibold text-navy">Teléfono:</span> {alumno.telefono}
              </p>
              <p className="break-all text-sm text-text-mid">
                <span className="font-semibold text-navy">Correo:</span> {alumno.email}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle icon="CV" iconVariant="purple">
            CV del alumno
          </CardTitle>
        </CardHeader>
        <div className="p-6">
          <PortalAlumnoCvManager
            cvNombre={alumno.cvNombre}
            cvMimeType={alumno.cvMimeType}
            cvTamano={alumno.cvTamano}
            cvUpdatedAt={alumno.cvUpdatedAt}
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle icon="OP" iconVariant="blue">
            Prácticas asignadas
          </CardTitle>
        </CardHeader>
        <div className="p-6">
          {formaciones.length > 0 ? (
            <div className="grid gap-4">
              {formaciones.map((formacion) => (
                <div key={formacion.id} className="rounded-[18px] border border-border bg-surface px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-navy">{formacion.empresa.nombre}</h2>
                      <p className="mt-1 text-sm text-text-mid">{formacion.empresa.localidad}</p>
                    </div>
                    <Badge variant="green">{formacion.periodo ?? formacion.curso}</Badge>
                  </div>
                  <div className="mt-4 grid gap-4 text-sm text-text-mid md:grid-cols-2">
                    <div className="grid gap-2">
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-text-light">
                        Datos de la empresa
                      </p>
                      <p>
                        <span className="font-semibold text-navy">Empresa:</span>{" "}
                        {formacion.empresa.nombre}
                      </p>
                      <p>
                        <span className="font-semibold text-navy">Localidad:</span>{" "}
                        {formacion.empresa.localidad}
                      </p>
                      <p>
                        <span className="font-semibold text-navy">Sector:</span>{" "}
                        {formacion.empresa.sector}
                      </p>
                      <p>
                        <span className="font-semibold text-navy">Ciclo:</span>{" "}
                        {formacion.empresa.cicloFormativo}
                      </p>
                    </div>

                    <div className="grid gap-2">
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-text-light">
                        Datos de la formación
                      </p>
                      <p>
                        <span className="font-semibold text-navy">Curso académico:</span>{" "}
                        {formacion.curso}
                      </p>
                      <p>
                        <span className="font-semibold text-navy">Periodo:</span>{" "}
                        {formacion.periodo ?? "-"}
                      </p>
                      <p>
                        <span className="font-semibold text-navy">Tutor laboral:</span>{" "}
                        {formacion.tutorLaboral ?? "-"}
                      </p>
                      <p>
                        <span className="font-semibold text-navy">Email tutor laboral:</span>{" "}
                        {formacion.emailTutorLaboral ?? "-"}
                      </p>
                      <p>
                        <span className="font-semibold text-navy">Descripción:</span>{" "}
                        {formacion.descripcion ?? "-"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[18px] border border-dashed border-border bg-surface px-5 py-8 text-center">
              <Badge variant="gray">Sin asignación</Badge>
              <h2 className="mt-4 text-lg font-bold text-navy">Todavía no hay práctica asignada</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-text-mid">
                Cuando se cree una formación para este alumno, aparecerá en este bloque.
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
              <p className="text-sm text-text-mid">No hay empresas compatibles registradas todavía.</p>
            </Card>
          )}
        </div>
      </div>

    </div>
  );
}
