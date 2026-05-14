import Image from "next/image";
import institutoLogo from "@/app/images/logo_instituto.webp";
import PortalSessionAccess from "@/components/layout/PortalSessionAccess";
import { getAuthMode } from "@/modules/auth/config";
import { requireAlumnoSession } from "@/modules/auth/session";
import PortalAlumnoNav from "@/modules/portal-alumno/components/PortalAlumnoNav";

export default async function PortalAlumnoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAlumnoSession("/portal-alumno");

  const authMode = getAuthMode();

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
          <div className="ml-auto">
            <PortalSessionAccess authMode={authMode} />
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
