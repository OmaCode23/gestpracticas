"use client";

import { useEffect, useRef, useState } from "react";
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
  { href: "/formacion", label: "Formación Empresa" },
  { href: "/importexport", label: "Importar / Exportar" },
  { href: "/informes", label: "Informes" },
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
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
        console.error("[Navbar] No se pudo recuperar la sesión", error);
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
  }, [pathname]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    setMenuOpen(false);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        cache: "no-store",
      });
    } catch (error) {
      console.error("[Navbar] No se pudo cerrar la sesión", error);
    } finally {
      setSessionUser(null);
      setLoggingOut(false);
      router.replace("/login");
      router.refresh();
    }
  }

  const showUsersAdmin = !!sessionUser?.rol && canManageUsers(sessionUser.rol);
  const visibleLinks = sessionUser ? NAV_LINKS : [];
  const initials = sessionUser?.iniciales || sessionUser?.nombre.slice(0, 2).toUpperCase() || "--";
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
            Administración de usuarios
          </Link>
        ) : null}

        {sessionUser ? (
          <Link
            href="/configuracion"
            aria-label="Configuración"
            title="Configuración"
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

        <div className="rounded-2xl border border-white/14 bg-white/10 px-2 py-1.5 shadow-[0_10px_24px_rgba(0,0,0,0.12)] backdrop-blur-sm">
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
            <div ref={menuRef} className="relative flex items-center text-[0.86rem] text-white">
              <button
                type="button"
                onClick={() => setMenuOpen((current) => !current)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[0.8rem] font-bold text-navy shadow-sm transition hover:brightness-105"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Abrir menú de usuario"
              >
                {initials}
              </button>

              {menuOpen ? (
                <div className="absolute right-0 top-[calc(100%+0.75rem)] min-w-[240px] rounded-[18px] border border-white/20 bg-white p-2 text-navy shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
                  <div className="border-b border-slate-100 px-3 py-2">
                    <p className="truncate text-[0.84rem] font-semibold">{sessionUser.nombre}</p>
                    <p className="truncate text-[0.76rem] text-slate-500">
                      ({getRoleLabel(sessionUser.rol)})
                    </p>
                    <p className="truncate text-[0.76rem] text-slate-500">{sessionUser.email}</p>
                  </div>
                  {authMode === "local" ? (
                    <Link
                      href="/cuenta/password"
                      onClick={() => setMenuOpen(false)}
                      className="mt-1 block rounded-[12px] px-3 py-2 text-[0.84rem] font-medium text-navy transition hover:bg-slate-50"
                    >
                      Cambiar contraseña
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="mt-1 w-full rounded-[12px] px-3 py-2 text-left text-[0.84rem] font-medium text-[#7a2237] transition hover:bg-[#fff3f5] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loggingOut ? "Cerrando sesión..." : "Logout"}
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center rounded-full bg-accent px-4 py-2 text-[0.82rem] font-semibold text-white transition hover:brightness-105"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
