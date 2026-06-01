import Image from "next/image";
import { unstable_noStore as noStore } from "next/cache";
import institutoLogo from "@/app/images/logo_instituto.webp";
import { Badge } from "@/components/ui";
import PortalAlumnoNav from "@/modules/portal-alumno/components/PortalAlumnoNav";
import { getPortalAlumnoActual } from "@/modules/portal-alumno/actions/queries";

export const dynamic = "force-dynamic";

export default async function PortalAlumnoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  noStore();

  const alumno = await getPortalAlumnoActual();

  return (
    <div>
      <header className="mb-7 overflow-hidden rounded-[24px] border border-white/70 bg-white/82 shadow-card">
        <div className="flex flex-wrap items-center gap-4 px-5 py-5 md:px-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-2 shadow-[0_12px_28px_rgba(43,28,32,0.12)]">
            <Image
              src={institutoLogo}
              alt="Logo IES El Grao Valencia"
              className="h-full w-full object-contain"
              priority
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-text-light">
              IES El Grao
            </p>
            <h1 className="mt-1 font-display text-[1.55rem] font-bold leading-tight text-navy md:text-[1.9rem]">
              Portal del Alumno
            </h1>
            <p className="mt-1 max-w-2xl text-[0.9rem] leading-relaxed text-text-mid">
              Practicas, empresas colaboradoras, cursos externos y CV en un espacio separado del panel interno.
            </p>
          </div>

          <div className="min-w-[220px] rounded-2xl border border-border bg-surface px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={alumno.isDemo ? "amber" : "green"}>
                {alumno.isDemo ? "Vista de prueba" : "Alumno conectado"}
              </Badge>
              {alumno.cicloFormativoCodigo && (
                <Badge variant="blue">{alumno.cicloFormativoCodigo}</Badge>
              )}
            </div>
            <p className="mt-3 truncate text-sm font-bold text-navy">{alumno.nombre}</p>
            <p className="mt-1 text-xs text-text-mid">
              {alumno.curso} / curso {alumno.cursoCiclo}
            </p>
          </div>
        </div>
      </header>

      <div className="mb-6">
        <PortalAlumnoNav />
      </div>

      {children}
    </div>
  );
}
