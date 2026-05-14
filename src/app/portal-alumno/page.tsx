import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { Badge, Card, CardHeader, CardTitle, SectionLabel } from "@/components/ui";
import { getPortalAlumnoSummary, getPortalEmpresasDisponibles } from "@/modules/portal-alumno/actions/queries";
import { CURSOS_EXTERNOS_PREVIEW } from "@/modules/portal-alumno/data";

export const dynamic = "force-dynamic";

export default async function PortalAlumnoPage() {
  noStore();

  const [summary, empresas] = await Promise.all([
    getPortalAlumnoSummary(),
    getPortalEmpresasDisponibles(4),
  ]);

  const stats = [
    { label: "Ofertas publicadas", value: summary.ofertasPublicadas, variant: "blue" as const },
    { label: "Empresas disponibles", value: summary.empresasDisponibles, variant: "green" as const },
    { label: "Cursos disponibles", value: summary.cursosDisponibles, variant: "amber" as const },
  ];

  return (
    <div className="space-y-7">
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
              Ofertas de prácticas
            </CardTitle>
          </CardHeader>
          <div className="p-6">
            <p className="text-sm leading-relaxed text-text-mid">
              Todavía no hay ofertas publicadas. Este bloque queda preparado para mostrar las plazas
              abiertas por empresa y ciclo formativo.
            </p>
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
            <p className="text-sm leading-relaxed text-text-mid">
              La documentación del alumno se gestiona desde la ficha interna de alumnos.
            </p>
            <Link
              href="/portal-alumno/cv"
              className="mt-4 inline-flex rounded-lg border border-border bg-surface2 px-4 py-2 text-sm font-semibold text-text-mid no-underline transition-colors hover:bg-[#e5d7d0]"
            >
              Ir al CV
            </Link>
          </div>
        </Card>
      </div>

      <div>
        <SectionLabel>Empresas destacadas</SectionLabel>
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
