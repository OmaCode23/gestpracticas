"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import institutoLogo from "@/app/images/logo_instituto.webp";
import AuthSessionControl from "@/components/layout/AuthSessionControl";
import type { AuthMode } from "@/modules/auth/config";
import { canManageUsers } from "@/modules/auth/permissions";
import { useAuthSession } from "@/components/layout/useAuthSession";

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/empresas", label: "Empresas" },
  { href: "/alumnos", label: "Alumnos" },
  { href: "/formacion", label: "Formacion Empresa" },
  { href: "/importexport", label: "Importar / Exportar" },
  { href: "/informes", label: "Informes" },
] as const;

type Props = {
  authMode: AuthMode;
};

export default function Navbar({ authMode }: Props) {
  const pathname = usePathname();
  const session = useAuthSession("Navbar");
  const { sessionUser } = session;
  const showUsersAdmin = !!sessionUser?.rol && canManageUsers(sessionUser.rol);
  const visibleLinks = sessionUser ? NAV_LINKS : [];
  const isConfigActive = pathname === "/configuracion" || pathname.startsWith("/configuracion/");
  const isUsersActive = pathname === "/configuracion/usuarios";

  return (
    <nav className="sticky top-0 z-50 flex flex-wrap items-center gap-3 border-b border-white/10 bg-navy px-4 py-4 shadow-[0_18px_50px_rgba(61,24,34,0.22)] backdrop-blur md:px-6 xl:flex-nowrap xl:px-10">
      <div className="mr-2 flex min-w-0 items-end gap-3 xl:mr-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/95 p-2 shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
          <Image
            src={institutoLogo}
            alt="Logo IES El Grao Valencia"
            className="h-full w-full object-contain"
            priority
          />
        </div>
        <div className="flex min-w-0 flex-col items-stretch justify-end">
          <span className="flex items-center justify-end font-display text-[1.05rem] font-bold tracking-[0.01em] text-white md:text-[1.22rem]">
            <span className="text-white">Gest</span>
            <span className="ml-1 text-[#f3d7de]">Practicas</span>
          </span>
          <div className="mt-1 inline-flex w-full items-center justify-center self-end rounded-full border border-white/18 bg-gradient-to-r from-[#f6e6cb] via-[#fff5e8] to-[#ead2d8] px-3 py-1 shadow-[0_10px_24px_rgba(0,0,0,0.16)]">
            <span className="text-[0.64rem] font-extrabold uppercase tracking-[0.22em] text-[#6d2335] md:text-[0.7rem] md:tracking-[0.28em]">
              IES EL GRAO
            </span>
          </div>
        </div>
      </div>

      <div className="order-3 flex w-full flex-wrap gap-2 xl:order-none xl:w-auto">
        {visibleLinks.map(({ href, label }) => {
          const isActive = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              prefetch={href === "/" ? false : undefined}
              className={[
                "rounded-full px-3.5 py-2 text-sm font-medium no-underline transition-all duration-150",
                isActive
                  ? "bg-accent text-white shadow-[0_10px_30px_rgba(159,29,62,0.34)]"
                  : "text-white/90 hover:bg-white/10 hover:text-white",
              ].join(" ")}
            >
              {label}
            </Link>
          );
        })}
      </div>

      <div className="hidden flex-1 xl:block" />

      <div className="ml-auto flex items-center gap-2">
        {sessionUser && showUsersAdmin ? (
          <Link
            href="/configuracion/usuarios"
            className={[
              "inline-flex items-center rounded-[1.35rem] bg-white/14 px-4 py-2 text-[0.82rem] font-semibold leading-tight text-white transition hover:bg-white/20",
              isUsersActive
                ? "bg-[#f6e6cb] text-[#6d2335] shadow-[0_10px_24px_rgba(0,0,0,0.14)]"
                : "",
            ].join(" ")}
          >
            Administracion de usuarios
          </Link>
        ) : null}

        {sessionUser ? (
          <Link
            href="/configuracion"
            aria-label="Configuracion"
            title="Configuracion"
            className={[
              "inline-flex items-center justify-center text-white transition hover:scale-105",
              isConfigActive ? "text-[#f6e6cb]" : "hover:text-white",
            ].join(" ")}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-9 w-9"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.79 3.2c.28-1 .58-1.45 1.21-1.45s.93.45 1.21 1.45l.16.59c.16.58.6 1.03 1.17 1.21.22.07.44.16.65.27.53.27 1.14.27 1.66.03l.54-.25c.92-.43 1.45-.48 1.9-.03.45.45.4.98-.03 1.9l-.25.54c-.24.52-.24 1.13.03 1.66.11.21.2.43.27.65.18.57.63 1.01 1.21 1.17l.59.16c1 .28 1.45.58 1.45 1.21s-.45.93-1.45 1.21l-.59.16c-.58.16-1.03.6-1.21 1.17-.07.22-.16.44-.27.65-.27.53-.27 1.14-.03 1.66l.25.54c.43.92.48 1.45.03 1.9-.45.45-.98.4-1.9-.03l-.54-.25c-.52-.24-1.13-.24-1.66.03-.21.11-.43.2-.65.27-.57.18-1.01.63-1.17 1.21l-.16.59c-.28 1-.58 1.45-1.21 1.45s-.93-.45-1.21-1.45l-.16-.59c-.16-.58-.6-1.03-1.17-1.21a5.83 5.83 0 0 1-.65-.27 1.87 1.87 0 0 0-1.66-.03l-.54.25c-.92.43-1.45.48-1.9.03-.45-.45-.4-.98.03-1.9l.25-.54c.24-.52.24-1.13-.03-1.66a5.83 5.83 0 0 1-.27-.65c-.18-.57-.63-1.01-1.21-1.17l-.59-.16c-1-.28-1.45-.58-1.45-1.21s.45-.93 1.45-1.21l.59-.16c.58-.16 1.03-.6 1.21-1.17.07-.22.16-.44.27-.65.27-.53.27-1.14.03-1.66l-.25-.54c-.43-.92-.48-1.45-.03-1.9.45-.45.98-.4 1.9.03l.54.25c.52.24 1.13.24 1.66-.03.21-.11.43-.2.65-.27.57-.18 1.01-.63 1.17-1.21l.16-.59Z" />
              <circle cx="12" cy="12" r="3.35" />
            </svg>
          </Link>
        ) : null}

        <AuthSessionControl authMode={authMode} session={session} />
      </div>
    </nav>
  );
}
