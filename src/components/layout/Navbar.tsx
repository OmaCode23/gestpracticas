"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/",              label: "🏠 Inicio" },
  { href: "/empresas",      label: "🏢 Empresas" },
  { href: "/alumnos",       label: "👩‍🎓 Alumnos" },
  { href: "/formacion",     label: "📋 Formación Empresa" },
  { href: "/importexport",  label: "🔄 Importar / Exportar" },
] as const;

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-navy sticky top-0 z-50 h-[60px] px-10 flex items-center gap-2 shadow-[0_2px_16px_rgba(0,0,0,0.22)]">
      {/* Logo */}
      <div className="font-display text-white text-[1.18rem] font-bold tracking-tight mr-6 flex items-center gap-2">
        🎓 <span className="text-accent">Gest</span>Prácticas
        <span className="bg-accent text-navy text-[0.6rem] font-bold px-1.5 py-0.5 rounded font-sans tracking-widest uppercase">
          IES
        </span>
      </div>

      {NAV_LINKS.map(({ href, label }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={[
              "text-sm font-medium px-3.5 py-1.5 rounded-md transition-all duration-150 no-underline",
              isActive
                ? "bg-blue-light text-white"
                : "text-white/60 hover:text-white hover:bg-white/10",
            ].join(" ")}
          >
            {label}
          </Link>
        );
      })}

      <div className="flex-1" />

      {/* Usuario */}
      <div className="flex items-center gap-2.5 text-white/70 text-[0.82rem]">
        <div className="w-8 h-8 rounded-full bg-blue-light flex items-center justify-center text-white text-[0.8rem] font-bold">
          AC
        </div>
        Administrador
      </div>
    </nav>
  );
}
