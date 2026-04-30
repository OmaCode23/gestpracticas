"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import institutoLogo from "@/app/images/logo_instituto.webp";
import type { AuthMode } from "@/modules/auth/config";
import { canManageUsers } from "@/modules/auth/permissions";

type SessionUser = {
  id: number;
  nombre: string;
  email: string;
  iniciales: string | null;
  rol: "ADMIN" | "PROFESOR" | "ALUMNO";
  activo: boolean;
  mustChangePass: boolean;
};

type SessionPayload =
  | {
      ok: true;
      data: { authMode: AuthMode; session: { user: SessionUser; expiresAt: string } | null };
    }
  | { ok: false; error: string };

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/empresas", label: "Empresas" },
  { href: "/alumnos", label: "Alumnos" },
  { href: "/formacion", label: "Formacion Empresa" },
  { href: "/importexport", label: "Importar / Exportar" },
  { href: "/informes", label: "Informes" },
  { href: "/configuracion", label: "Configuracion" },
] as const;

function getRoleLabel(role: SessionUser["rol"]) {
  switch (role) {
    case "ADMIN":
      return "Administrador";
    case "ALUMNO":
      return "Alumno";
    default:
      return "Profesor";
  }
}

type Props = {
  authMode: AuthMode;
};

export default function Navbar({ authMode }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
        });
        const payload = (await response.json()) as SessionPayload;

        if (!active) {
          return;
        }

        if (response.ok && payload.ok) {
          setSessionUser(payload.data.session?.user ?? null);
        } else {
          setSessionUser(null);
        }
      } catch (error) {
        console.error("[Navbar] No se pudo recuperar la sesion", error);
        if (active) {
          setSessionUser(null);
        }
      } finally {
        if (active) {
          setLoadingSession(false);
        }
      }
    }

    void loadSession();

    return () => {
      active = false;
    };
  }, []);

  const visibleLinks = useMemo(() => {
    if (sessionUser?.rol && canManageUsers(sessionUser.rol)) {
      return [...NAV_LINKS, { href: "/configuracion/usuarios", label: "Usuarios" }] as const;
    }

    return NAV_LINKS;
  }, [sessionUser?.rol]);

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("[Navbar] No se pudo cerrar la sesion", error);
    } finally {
      setSessionUser(null);
      setLoggingOut(false);
      router.replace("/login");
      router.refresh();
    }
  }

  const initials = sessionUser?.iniciales || sessionUser?.nombre.slice(0, 2).toUpperCase() || "--";

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

      <div className="ml-auto rounded-full border border-white/14 bg-white/10 px-2.5 py-1.5 shadow-[0_10px_24px_rgba(0,0,0,0.12)] backdrop-blur-sm">
        {loadingSession ? (
          <div className="flex items-center gap-2.5 text-[0.86rem] text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-[0.8rem] font-bold text-navy shadow-sm">
              ..
            </div>
            <span className="hidden font-semibold tracking-[0.01em] text-white md:inline">
              Cargando
            </span>
          </div>
        ) : sessionUser ? (
          <div className="flex items-center gap-2.5 text-[0.86rem] text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[0.8rem] font-bold text-navy shadow-sm">
              {initials}
            </div>
            <div className="hidden min-w-0 md:block">
              <p className="truncate text-[0.82rem] font-semibold tracking-[0.01em] text-white">
                {sessionUser.nombre}
              </p>
              <p className="truncate text-[0.72rem] text-white/75">
                {getRoleLabel(sessionUser.rol)}
                {sessionUser.mustChangePass ? " · clave temporal" : ""}
              </p>
            </div>
            {authMode === "local" ? (
              <Link
                href="/cuenta/password"
                className={[
                  "rounded-full px-3 py-1.5 text-[0.76rem] font-semibold transition",
                  sessionUser.mustChangePass
                    ? "bg-[#f6e6cb] text-[#6d2335] hover:brightness-105"
                    : "border border-white/14 bg-white/10 text-white hover:bg-white/16",
                ].join(" ")}
              >
                Clave
              </Link>
            ) : null}
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-full border border-white/14 bg-white/10 px-3 py-1.5 text-[0.76rem] font-semibold text-white transition hover:bg-white/16 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loggingOut ? "Saliendo..." : "Salir"}
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="inline-flex items-center rounded-full border border-white/16 bg-white/10 px-4 py-2 text-[0.82rem] font-semibold text-white transition hover:bg-white/16"
          >
            Acceder
          </Link>
        )}
      </div>
    </nav>
  );
}
